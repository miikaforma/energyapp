import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  // publicProcedure,
} from "@energyapp/server/api/trpc";
import dayjs, { type Dayjs } from "dayjs";
import {
  type ShellyConsumption,
  type ShellyConsumptionResponse,
  type ShellyConsumptionSummary,
  type IContext,
} from "@energyapp/shared/interfaces";
import { ShellyViewType, TimePeriod } from "@energyapp/shared/enums";
import { TRPCError } from "@trpc/server";
import {
  Prisma,
  shellyNotificationEventType,
  type shelly_historical_data,
} from "@energyapp/generated/client";
import { env } from "@energyapp/env";
import axios from "axios";
import { parseCustomData } from "@energyapp/utils/dbHelpers";

export type DatePickerRange = {
  min?: Dayjs;
  max?: Dayjs;
};

// const tz = "Europe/Helsinki";

const zodDay = z.custom<Dayjs>(
  (val: unknown) => dayjs(val as string).isValid(),
  "Invalid date",
);
const zodTimePeriod = z.nativeEnum(TimePeriod);
const zodShellyViewType = z.nativeEnum(ShellyViewType);
const zodShellyNotificationEventType = z.nativeEnum(shellyNotificationEventType);

const groupNotificationEventTypes = [
  shellyNotificationEventType.GROUP_POWER_STARTED,
  shellyNotificationEventType.GROUP_POWER_STOPPED,
] as const;

const deviceNotificationEventTypes = [
  shellyNotificationEventType.DEVICE_OFFLINE,
  shellyNotificationEventType.DEVICE_ONLINE,
  shellyNotificationEventType.DEVICE_POWER_STARTED,
  shellyNotificationEventType.DEVICE_POWER_STOPPED,
] as const;

const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time");

const mapIntervalToSQL = (interval: TimePeriod): string => {
  switch (interval) {
    case TimePeriod.PT1H:
      return "1 hour";
    case TimePeriod.PT15M:
      return "15 minutes";
    case TimePeriod.P1D:
      return "1 day";
    case TimePeriod.P1M:
      return "1 month";
    case TimePeriod.P1Y:
      return "1 year";
    default:
      throw new Error(`Unsupported interval: ${interval as string}`);
  }
};

const getAggregatedDataV3 = (
  ctx: IContext,
  startTime: Date,
  endTime: Date,
  interval: TimePeriod,
  deviceIds: string[],
  viewType?: ShellyViewType,
  groupKey?: string,
): Promise<ShellyConsumption[]> => {
  const sqlInterval = mapIntervalToSQL(interval);

  if (viewType === ShellyViewType.GROUP && groupKey) {
    return ctx.db.$queryRaw<ShellyConsumption[]>`
      WITH avg_measurements AS (
          SELECT
              time_bucket(${Prisma.raw(
      `'${sqlInterval}'`,
    )}, time) AS rounded_time,
              ROUND(AVG(apower)::NUMERIC, 1) AS avg_apower,
              ROUND(AVG(voltage)::NUMERIC, 1) AS avg_voltage,
              ROUND(AVG(current)::NUMERIC, 1) AS avg_current,
              ROUND(AVG(freq)::NUMERIC, 1) AS avg_freq,
              ROUND(AVG(temperature_c)::NUMERIC, 1) AS avg_temp_c,
              ROUND(AVG(temperature_f)::NUMERIC, 1) AS avg_temp_f
          FROM shelly_historical_data
          WHERE time >= ${startTime}
            AND time <= ${endTime}
            AND device_id IN (${Prisma.join(deviceIds)})
          GROUP BY rounded_time
      ),
      consumption_data AS (
          SELECT
              time_bucket(${Prisma.raw(
      `'${sqlInterval}'`,
    )}, time) AS rounded_time,
              SUM(energy_mw) AS energy_mw
          FROM shelly_historical_consumption_data
          WHERE time >= ${startTime}
            AND time <= ${endTime}
            AND device_id IN (${Prisma.join(deviceIds)})
          GROUP BY rounded_time
      )
      SELECT
          c.rounded_time AS time,
          ${Prisma.raw(`'${groupKey}'`)} AS device_id,
          c.energy_mw AS consumption,
          m.avg_apower,
          m.avg_temp_c AS avg_temperature_c,
          m.avg_temp_f AS avg_temperature_f,
          m.avg_voltage,
          m.avg_current,
          m.avg_freq
      FROM consumption_data c
      LEFT JOIN avg_measurements m
        ON m.rounded_time = c.rounded_time
      ORDER BY 1 DESC, 2 ASC;
    `;
  }

  return ctx.db.$queryRaw<ShellyConsumption[]>`
    WITH avg_measurements AS (
        SELECT
            device_id,
            time_bucket(${Prisma.raw(
    `'${sqlInterval}'`,
  )}, time) AS rounded_time,
            ROUND(AVG(apower)::NUMERIC, 1) AS avg_apower,
            ROUND(AVG(voltage)::NUMERIC, 1) AS avg_voltage,
            ROUND(AVG(current)::NUMERIC, 1) AS avg_current,
            ROUND(AVG(freq)::NUMERIC, 1) AS avg_freq,
            ROUND(AVG(temperature_c)::NUMERIC, 1) AS avg_temp_c,
            ROUND(AVG(temperature_f)::NUMERIC, 1) AS avg_temp_f
        FROM shelly_historical_data
        WHERE time >= ${startTime}
          AND time <= ${endTime}
          AND device_id IN (${Prisma.join(deviceIds)})
        GROUP BY device_id, rounded_time
    ),
    consumption_data AS (
        SELECT
            device_id,
            time_bucket(${Prisma.raw(
    `'${sqlInterval}'`,
  )}, time) AS rounded_time,
            SUM(energy_mw) AS energy_mw
        FROM shelly_historical_consumption_data
        WHERE time >= ${startTime}
          AND time <= ${endTime}
          AND device_id IN (${Prisma.join(deviceIds)})
        GROUP BY device_id, rounded_time
    )
    SELECT
        c.rounded_time AS time,
        c.device_id,
        c.energy_mw AS consumption,
        m.avg_apower,
        m.avg_temp_c AS avg_temperature_c,
        m.avg_temp_f AS avg_temperature_f,
        m.avg_voltage,
        m.avg_current,
        m.avg_freq
    FROM consumption_data c
    LEFT JOIN avg_measurements m
      ON m.device_id = c.device_id
    AND m.rounded_time = c.rounded_time
    ORDER BY 1 DESC, 2 ASC;
  `;
};

const getDevices = async (ctx: IContext) => {
  const userAccesses = await ctx.db.userAccess.findMany({
    where: {
      userId: ctx.session?.user?.id ?? "",
      type: "SHELLY",
    },
    orderBy: {
      serviceAccess: {
        accessName: "asc",
      },
    },
    select: {
      accessId: true,
      serviceAccess: {
        select: {
          accessName: true,
          customData: true,
        },
      },
    },
  });

  return userAccesses;
};

const checkDeviceAccess = async (ctx: IContext, deviceId: string) => {
  const device = await ctx.db.serviceAccess.findFirst({
    where: {
      accessId: deviceId,
      userAccesses: {
        some: {
          userId: ctx.session?.user?.id ?? "",
          type: "SHELLY",
        },
      },
    },
    select: { accessId: true },
  });
  if (!device) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this device",
    });
  }
  return device;
};

const checkGroupAccess = async (ctx: IContext, groupKey: string) => {
  const group = await ctx.db.shellyGroup.findUnique({
    where: { groupKey_userId: { groupKey: groupKey, userId: ctx.session?.user?.id ?? "" } },
    select: { groupKey: true },
  });
  if (!group) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this group",
    });
  }
  return group;
};

const timeToString = (value: Date | null | undefined) => {
  if (!value) {
    return null;
  }

  return value.toISOString().slice(11, 16);
};

const timeStringToDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  return new Date(`1970-01-01T${value}:00.000Z`);
};

type NotificationPreferenceRow = {
  event_type: string;
  enabled: boolean;
  power_threshold_w: number | null;
  offline_delay_seconds: number | null;
  cooldown_seconds: number | null;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone_id: string | null;
};

export const shellyRouter = createTRPCRouter({
  getDevices: protectedProcedure.query(async ({ ctx }) => {
    const devices = await getDevices(ctx);
    return devices;
  }),
  getDevicesWithInfo: protectedProcedure
    .input(
      z.object({
        deviceIds: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const devices = await getDevices(ctx);

      // If deviceIds were provided, filter the devices
      const filteredDevices = input.deviceIds
        ? devices.filter((device) => input.deviceIds?.includes(device.accessId))
        : devices;

      const latestData = await ctx.db.$queryRaw<shelly_historical_data[]>`
        SELECT sd.*
        FROM shelly_historical_data sd
        JOIN (
          SELECT device_id, MAX("time") AS max_time
          FROM shelly_historical_data
          GROUP BY device_id
        ) latest
        ON sd.device_id = latest.device_id AND sd."time" = latest.max_time
        WHERE sd.device_id IN (${Prisma.join(
          filteredDevices.map((device) => device.accessId),
        )})
      `;

      // Map the latest data to the devices
      const devicesWithLatestData = filteredDevices.map((device) => {
        const latest = latestData.find(
          (data) => data.device_id === device.accessId,
        );
        return {
          ...device,
          latestData: latest ? latest : null,
        };
      });

      return devicesWithLatestData;
    }),
  getGroups: protectedProcedure.query(async ({ ctx }) => {
    const groups = await ctx.db.shellyGroup.findMany({
      where: {
        userId: ctx.session?.user?.id ?? "",
      },
      include: {
        devices: {
          select: {
            id: true,
            accessId: true,
            accessName: true
          },
        },
      },
    });

    return groups;
  }),
  getGroup: protectedProcedure.input(
    z.object({
      groupKey: z.string(),
    }),
  ).query(async ({ input, ctx }) => {
    const group = await ctx.db.shellyGroup.findUnique({
      where: { groupKey_userId: { groupKey: input.groupKey, userId: ctx.session?.user?.id ?? "" } },
      include: {
        devices: {
          select: {
            id: true,
            accessId: true,
            accessName: true
          },
        },
      },
    });

    return group;
  }),
  getGroupNotificationPreferences: protectedProcedure
    .input(
      z.object({
        groupKey: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      await checkGroupAccess(ctx, input.groupKey);

      const userId = ctx.session?.user?.id ?? "";
      const eventTypes = groupNotificationEventTypes.map(
        (eventType) =>
          Prisma.sql`${eventType}::shelly_notification_event_type`,
      );
      const existingPreferences = await ctx.db.$queryRaw<
        NotificationPreferenceRow[]
      >`
        SELECT
          event_type::text,
          enabled,
          power_threshold_w,
          offline_delay_seconds,
          cooldown_seconds,
          quiet_hours_enabled,
          TO_CHAR(quiet_hours_start, 'HH24:MI') AS quiet_hours_start,
          TO_CHAR(quiet_hours_end, 'HH24:MI') AS quiet_hours_end,
          timezone_id
        FROM user_shelly_notification_preference
        WHERE user_id = ${userId}
          AND scope_type = 'GROUP'::shelly_notification_scope_type
          AND group_key = ${input.groupKey}
          AND event_type IN (${Prisma.join(eventTypes)})
      `;

      return groupNotificationEventTypes.map((eventType) => {
        const preference = existingPreferences.find(
          (item) => item.event_type === eventType,
        );

        return {
          eventType,
          enabled: preference?.enabled ?? false,
          powerThresholdW: preference?.power_threshold_w ?? null,
          cooldownSeconds: preference?.cooldown_seconds ?? null,
          quietHoursEnabled: preference?.quiet_hours_enabled ?? false,
          quietHoursStart: preference?.quiet_hours_start ?? null,
          quietHoursEnd: preference?.quiet_hours_end ?? null,
          timezoneId: preference?.timezone_id ?? null,
        };
      });
    }),
  getDeviceNotificationPreferences: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      await checkDeviceAccess(ctx, input.deviceId);

      const userId = ctx.session?.user?.id ?? "";
      const eventTypes = deviceNotificationEventTypes.map(
        (eventType) =>
          Prisma.sql`${eventType}::shelly_notification_event_type`,
      );
      const existingPreferences = await ctx.db.$queryRaw<
        NotificationPreferenceRow[]
      >`
        SELECT
          event_type::text,
          enabled,
          power_threshold_w,
          offline_delay_seconds,
          cooldown_seconds,
          quiet_hours_enabled,
          TO_CHAR(quiet_hours_start, 'HH24:MI') AS quiet_hours_start,
          TO_CHAR(quiet_hours_end, 'HH24:MI') AS quiet_hours_end,
          timezone_id
        FROM user_shelly_notification_preference
        WHERE user_id = ${userId}
          AND scope_type = 'DEVICE'::shelly_notification_scope_type
          AND device_id = ${input.deviceId}
          AND event_type IN (${Prisma.join(eventTypes)})
      `;

      return deviceNotificationEventTypes.map((eventType) => {
        const preference = existingPreferences.find(
          (item) => item.event_type === eventType,
        );

        return {
          eventType,
          enabled: preference?.enabled ?? false,
          powerThresholdW: preference?.power_threshold_w ?? null,
          offlineDelaySeconds: preference?.offline_delay_seconds ?? null,
          cooldownSeconds: preference?.cooldown_seconds ?? null,
          quietHoursEnabled: preference?.quiet_hours_enabled ?? false,
          quietHoursStart: preference?.quiet_hours_start ?? null,
          quietHoursEnd: preference?.quiet_hours_end ?? null,
          timezoneId: preference?.timezone_id ?? null,
        };
      });
    }),
  get: protectedProcedure
    .input(
      z.object({
        timePeriod: zodTimePeriod,
        startTime: zodDay,
        endTime: zodDay,
        viewType: zodShellyViewType.optional(),
        id: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const startTime = dayjs(input.startTime).toDate();
      const endTime = dayjs(input.endTime).toDate();

      const devices = await getDevices(ctx);
      let deviceIds = devices.map((device) => device.accessId);
      let title = "";

      if (input.viewType === ShellyViewType.DEVICE) {
        if (!input.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Device ID is required for device view type",
          });
        }
        const device = devices.find((device) => device.accessId === input.id);
        if (!device) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Device not found",
          });
        }

        deviceIds = [device.accessId];
        title = device.serviceAccess.accessName ?? device.accessId;
      }

      if (input.viewType === ShellyViewType.GROUP) {
        if (!input.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Group ID is required for group view type",
          });
        }

        const group = await ctx.db.shellyGroup.findUnique({
          where: { groupKey_userId: { groupKey: decodeURIComponent(input.id), userId: ctx.session?.user?.id ?? "" } },
          include: {
            devices: {
              select: {
                id: true,
                accessId: true,
                accessName: true,
              },
            },
          },
        });

        if (!group) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }

        deviceIds = group.devices.map((device) => device.accessId);
        title = group.name ?? "Unknown group";
      }

      return getAggregatedDataV3(
        ctx,
        startTime,
        endTime,
        input.timePeriod,
        deviceIds,
        input.viewType,
        input.viewType === ShellyViewType.GROUP && input.id
          ? decodeURIComponent(input.id)
          : "",
      ).then((data) => {
        return consumptionsToResponse(title, input.timePeriod, data, devices);
      });
    }),
  getRange: protectedProcedure
    .input(z.object({ timePeriod: zodTimePeriod }))
    .query(({ input, ctx }) => {
      return getRange(ctx, input.timePeriod);
    }),

  upsertGroup: protectedProcedure
    .input(
      z.object({
        groupKey: z.string().optional(), // Optional for creation, required for update
        groupName: z.string(),
        deviceAccessIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if group exists
      const existingGroup = await ctx.db.shellyGroup.findUnique({
        where: { groupKey_userId: { groupKey: input.groupKey ?? "", userId: ctx.session?.user?.id ?? "" } },
      });

      console.log("Upsert group input:", input, "Existing group:", existingGroup);

      if (existingGroup) {
        // Update existing group
        await ctx.db.shellyGroup.update({
          where: {
            groupKey_userId: {
              groupKey: existingGroup.groupKey,
              userId: ctx.session?.user?.id ?? "",
            },
          },
          data: {
            name: input.groupName,
            devices: {
              set: input.deviceAccessIds.map((accessId) => ({
                accessId,
              })),
            },
          },
        });
      } else {
        // Create new group
        await ctx.db.shellyGroup.create({
          data: {
            groupKey: generateGroupKey(), // Generate a new groupKey if not provided
            name: input.groupName,
            userId: ctx.session?.user?.id ?? "",
            devices: {
              connect: input.deviceAccessIds.map((accessId) => ({
                accessId,
              })),
            },
          },
        });
      }

      return { success: true };
    }),
  upsertGroupNotificationPreferences: protectedProcedure
    .input(
      z.object({
        groupKey: z.string(),
        preferences: z
          .array(
            z.object({
              eventType: zodShellyNotificationEventType,
              enabled: z.boolean(),
              powerThresholdW: z.number().nullable(),
              cooldownSeconds: z.number().int().nullable(),
              quietHoursEnabled: z.boolean(),
              quietHoursStart: timeStringSchema.nullable(),
              quietHoursEnd: timeStringSchema.nullable(),
              timezoneId: z.string().nullable(),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await checkGroupAccess(ctx, input.groupKey);

      const userId = ctx.session?.user?.id ?? "";
      const updatedAt = new Date();

      await ctx.db.$transaction(
        input.preferences.map((preference) => {
          if (
            !groupNotificationEventTypes.some(
              (eventType) => eventType === preference.eventType,
            )
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Unsupported group notification event type",
            });
          }

          return ctx.db.$executeRaw`
            INSERT INTO user_shelly_notification_preference (
              user_id,
              scope_type,
              device_id,
              group_key,
              event_type,
              enabled,
              power_threshold_w,
              offline_delay_seconds,
              cooldown_seconds,
              quiet_hours_enabled,
              quiet_hours_start,
              quiet_hours_end,
              timezone_id,
              updated_at
            )
            VALUES (
              ${userId},
              'GROUP'::shelly_notification_scope_type,
              NULL,
              ${input.groupKey},
              ${preference.eventType}::shelly_notification_event_type,
              ${preference.enabled},
              ${preference.powerThresholdW},
              NULL,
              ${preference.cooldownSeconds},
              ${preference.quietHoursEnabled},
              ${preference.quietHoursEnabled ? preference.quietHoursStart : null}::time,
              ${preference.quietHoursEnabled ? preference.quietHoursEnd : null}::time,
              ${preference.timezoneId},
              ${updatedAt}
            )
            ON CONFLICT (
              user_id,
              scope_type,
              COALESCE(device_id, ''),
              COALESCE(group_key, ''),
              event_type
            )
            DO UPDATE SET
              enabled = EXCLUDED.enabled,
              power_threshold_w = EXCLUDED.power_threshold_w,
              offline_delay_seconds = EXCLUDED.offline_delay_seconds,
              cooldown_seconds = EXCLUDED.cooldown_seconds,
              quiet_hours_enabled = EXCLUDED.quiet_hours_enabled,
              quiet_hours_start = EXCLUDED.quiet_hours_start,
              quiet_hours_end = EXCLUDED.quiet_hours_end,
              timezone_id = EXCLUDED.timezone_id,
              updated_at = EXCLUDED.updated_at
          `;
        }),
      );

      return { success: true };
    }),
  upsertDeviceNotificationPreferences: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        preferences: z
          .array(
            z.object({
              eventType: zodShellyNotificationEventType,
              enabled: z.boolean(),
              powerThresholdW: z.number().nullable(),
              offlineDelaySeconds: z.number().int().nullable(),
              cooldownSeconds: z.number().int().nullable(),
              quietHoursEnabled: z.boolean(),
              quietHoursStart: timeStringSchema.nullable(),
              quietHoursEnd: timeStringSchema.nullable(),
              timezoneId: z.string().nullable(),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await checkDeviceAccess(ctx, input.deviceId);

      const userId = ctx.session?.user?.id ?? "";
      const updatedAt = new Date();

      await ctx.db.$transaction(
        input.preferences.map((preference) => {
          if (
            !deviceNotificationEventTypes.some(
              (eventType) => eventType === preference.eventType,
            )
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Unsupported device notification event type",
            });
          }

          return ctx.db.$executeRaw`
            INSERT INTO user_shelly_notification_preference (
              user_id,
              scope_type,
              device_id,
              group_key,
              event_type,
              enabled,
              power_threshold_w,
              offline_delay_seconds,
              cooldown_seconds,
              quiet_hours_enabled,
              quiet_hours_start,
              quiet_hours_end,
              timezone_id,
              updated_at
            )
            VALUES (
              ${userId},
              'DEVICE'::shelly_notification_scope_type,
              ${input.deviceId},
              NULL,
              ${preference.eventType}::shelly_notification_event_type,
              ${preference.enabled},
              ${preference.powerThresholdW},
              ${preference.offlineDelaySeconds},
              ${preference.cooldownSeconds},
              ${preference.quietHoursEnabled},
              ${preference.quietHoursEnabled ? preference.quietHoursStart : null}::time,
              ${preference.quietHoursEnabled ? preference.quietHoursEnd : null}::time,
              ${preference.timezoneId},
              ${updatedAt}
            )
            ON CONFLICT (
              user_id,
              scope_type,
              COALESCE(device_id, ''),
              COALESCE(group_key, ''),
              event_type
            )
            DO UPDATE SET
              enabled = EXCLUDED.enabled,
              power_threshold_w = EXCLUDED.power_threshold_w,
              offline_delay_seconds = EXCLUDED.offline_delay_seconds,
              cooldown_seconds = EXCLUDED.cooldown_seconds,
              quiet_hours_enabled = EXCLUDED.quiet_hours_enabled,
              quiet_hours_start = EXCLUDED.quiet_hours_start,
              quiet_hours_end = EXCLUDED.quiet_hours_end,
              timezone_id = EXCLUDED.timezone_id,
              updated_at = EXCLUDED.updated_at
          `;
        }),
      );

      return { success: true };
    }),

  deleteGroup: protectedProcedure
    .input(z.object({ groupKey: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.shellyGroup.delete({
        where: { groupKey_userId: { groupKey: input.groupKey, userId: ctx.session?.user?.id ?? "" } },
      });
      return { success: true };
    }),

  uploadImage: protectedProcedure
    .input(
      z.object({
        accessKey: z.string(),
        viewType: zodShellyViewType,
        image: z.string(), // base64 or file URL
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Permission check
      switch (input.viewType) {
        case ShellyViewType.DEVICE:
          await checkDeviceAccess(ctx, input.accessKey);
          break;
        case ShellyViewType.GROUP:
          await checkGroupAccess(ctx, input.accessKey);
          break;
        default:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid view type",
          });
      }

      // Upload image to Cloudinary with Basic Auth, overwrite previous image
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`;
      const uploadPreset = env.CLOUDINARY_UPLOAD_PRESET;
      const formData = new FormData();
      formData.append("file", input.image);
      formData.append("upload_preset", uploadPreset);
      // Set public_id to organize images in folders
      formData.append("public_id", `shelly/${input.viewType}/${input.accessKey}`);

      // Basic Auth credentials from env
      const apiKey = env.CLOUDINARY_API_KEY;
      const apiSecret = env.CLOUDINARY_API_SECRET;
      const basicAuth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

      const response = await axios.post(cloudinaryUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Basic ${basicAuth}`,
        },
      });
      const imageUrl = response.data.secure_url;

      switch (input.viewType) {
        case ShellyViewType.DEVICE:
          // Update serviceAccess.customData for the device while preserving other customData properties
          const prev = await ctx.db.serviceAccess.findUnique({
            where: { accessId: input.accessKey },
            select: { customData: true },
          });
          await ctx.db.serviceAccess.update({
            where: { accessId: input.accessKey },
            data: {
              customData: {
                ...parseCustomData(prev?.customData),
                picture: imageUrl,
              },
            },
          });
          break;
        case ShellyViewType.GROUP:
          // Update shellyGroup.picture for the group
          await ctx.db.shellyGroup.update({
            where: {
              groupKey_userId: {
                groupKey: input.accessKey,
                userId: ctx.session?.user?.id ?? ""
              }
            },
            data: {
              picture: imageUrl,
            },
          });
          break;
        default:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid view type",
          });
      }

      return { success: true, imageUrl };
    }),
});

const getRange = async (
  ctx: IContext,
  timePeriod: TimePeriod,
): Promise<DatePickerRange> => {
  const minMaxTime = await ctx.db.shelly_historical_data.aggregate({
    _min: {
      time: true,
    },
    _max: {
      time: true,
    },
  });

  let minDate = dayjs(minMaxTime._min.time);
  let maxDate = dayjs(minMaxTime._max.time);

  switch (timePeriod) {
    case TimePeriod.PT15M:
    case TimePeriod.PT1H:
      // No change needed for hourly range
      break;
    case TimePeriod.P1D:
      // Adjust minDate and maxDate to the start and end of the day
      minDate = minDate.startOf("day");
      maxDate = maxDate.endOf("day");
      break;
    case TimePeriod.P1M:
      // Adjust minDate and maxDate to the start and end of the month
      minDate = minDate.startOf("month");
      maxDate = maxDate.endOf("month");
      break;
    case TimePeriod.P1Y:
      // Adjust minDate and maxDate to the start and end of the year
      minDate = minDate.startOf("year");
      maxDate = maxDate.endOf("year");
      break;
    default:
      return Promise.reject("Not implemented");
  }

  return {
    min: minDate,
    max: maxDate,
  };
};

const consumptionsToResponse = (
  title: string,
  timePeriod: TimePeriod,
  consumptions: ShellyConsumption[],
  devices: { accessId: string; serviceAccess: { accessName: string | null } }[],
): ShellyConsumptionResponse => {
  if (!consumptions.length) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No data found for the given time period",
    });
  }

  // Populate device names
  consumptions.forEach((consumption) => {
    const device = devices.find((d) => d.accessId === consumption.device_id);
    consumption.device_name = device?.serviceAccess.accessName ?? consumption.device_id;
  });

  const summary = {
    total: consumptions.reduce((prev, curr) => {
      return prev + curr.consumption;
    }, 0),
    highest: consumptions.reduce((prev, curr) => {
      return prev.consumption > curr.consumption ? prev : curr;
    }),
    lowest: consumptions.reduce((prev, curr) => {
      return prev.consumption < curr.consumption ? prev : curr;
    }),
  } as ShellyConsumptionSummary;

  return {
    title: title,
    timePeriod,
    summary,
    consumptions,
  };
};
function generateGroupKey(): string {
  // Generate a unique group key, e.g., using a UUID or a similar approach
  return `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
