import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  // publicProcedure,
} from "@energyapp/server/api/trpc";
import dayjs, { type Dayjs } from "dayjs";
import {
  type IContext,
} from "@energyapp/shared/interfaces";
import { TimePeriod } from "@energyapp/shared/enums";
import { TRPCError } from "@trpc/server";
import { Prisma, ruuvi_measurements } from "@energyapp/generated/client";
import axios from "axios";
import { env } from "@energyapp/env";
import { parseCustomData } from "@energyapp/utils/dbHelpers";

export type DatePickerRange = {
  min?: Dayjs;
  max?: Dayjs;
};

const zodDay = z.custom<Dayjs>(
  (val: unknown) => dayjs(val as string).isValid(),
  "Invalid date",
);
const zodTimePeriod = z.nativeEnum(TimePeriod);

const getDevices = async (ctx: IContext) => {
  const userAccesses = await ctx.db.userAccess.findMany({
    where: {
      userId: ctx.session?.user?.id ?? "",
      type: "RUUVI",
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
          type: "RUUVI",
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

export const ruuviRouter = createTRPCRouter({
  getDevices: protectedProcedure.query(async ({ ctx }) => {
    const devices = await getDevices(ctx);
    return devices;
  }),
  getDevicesWithInfo: protectedProcedure.query(async ({ ctx }) => {
    const devices = await getDevices(ctx);

    if (devices.length === 0) {
      return [];
    }

    const latestData = await ctx.db.$queryRaw<ruuvi_measurements[]>`
      SELECT rm.*
      FROM (VALUES ${Prisma.join(
      devices.map((device) => Prisma.sql`(${device.accessId})`),
    )}) AS macs(mac)
      CROSS JOIN LATERAL (
        SELECT *
        FROM ruuvi_measurements
        WHERE mac = macs.mac
        ORDER BY "time" DESC
        LIMIT 1
      ) rm
    `;

    const devicesWithLatestData = devices.map((device) => {
      const latest = latestData.find(
        (data) => data.mac === device.accessId,
      );
      return {
        ...device,
        latestData: latest ? latest : null,
      };
    });

    return devicesWithLatestData;
  }),
  getDevice: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const device = await ctx.db.serviceAccess.findFirst({
        where: {
          accessId: input.id,
          userAccesses: {
            some: {
              userId: ctx.session?.user?.id ?? "",
              type: "RUUVI",
            },
          },
        },
        select: {
          accessId: true,
          accessName: true,
          customData: true,
        },
      });
      if (!device) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Device not found or you don't have access to it",
        });
      }
      return device;
    }),
  get: protectedProcedure
    .input(
      z.object({
        timePeriod: zodTimePeriod,
        startTime: zodDay,
        endTime: zodDay.optional(),
        id: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const devices = await getDevices(ctx);
      const deviceIds = devices.map((device) => device.accessId);

      if (input.id && !deviceIds.includes(input.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this device",
        });
      }

      const requestedStart = dayjs(input.startTime);
      const requestedEnd = input.endTime ? dayjs(input.endTime) : dayjs();
      const now = dayjs();

      const intervalMinutes =
        input.timePeriod === TimePeriod.PT5M ? 5 : 15;

      const macWhere = input.id ? input.id : { in: deviceIds };

      const last30MinStart = now.subtract(30, "minute");
      const rawBackfillStart = requestedStart.isAfter(last30MinStart)
        ? requestedStart
        : last30MinStart;

      const hasRecentOverlap = rawBackfillStart.isBefore(requestedEnd);

      const downsampledEnd = hasRecentOverlap
        ? rawBackfillStart.toDate()
        : requestedEnd.toDate();

      const downsampledWhere = {
        mac: macWhere,
        time: {
          gte: requestedStart.toDate(),
          lt: downsampledEnd,
        },
      };

      const downsampled =
        requestedStart.isBefore(dayjs(downsampledEnd))
          ? input.timePeriod === TimePeriod.PT5M
            ? await ctx.db.ruuvi_measurements_downsampled_5min.findMany({
              where: downsampledWhere,
              orderBy: { time: "asc" },
            })
            : await ctx.db.ruuvi_measurements_downsampled_15min.findMany({
              where: downsampledWhere,
              orderBy: { time: "asc" },
            })
          : [];

      if (!hasRecentOverlap) {
        return downsampled;
      }

      const rawStart = rawBackfillStart.toDate();
      const rawEnd = requestedEnd.toDate();

      const macSql = input.id
        ? Prisma.sql`rm.mac = ${input.id}`
        : Prisma.sql`rm.mac IN (${Prisma.join(deviceIds)})`;

      const bucketIntervalSql =
        intervalMinutes === 5
          ? Prisma.sql`INTERVAL '5 minutes'`
          : Prisma.sql`INTERVAL '15 minutes'`;

      const rawAggregated = await ctx.db.$queryRaw<
        Array<{
          time: Date;
          mac: string;
          avg_temperature: number | null;
          min_temperature: number | null;
          max_temperature: number | null;
          avg_humidity: number | null;
          min_humidity: number | null;
          max_humidity: number | null;
          avg_pressure: number | null;
          min_pressure: number | null;
          max_pressure: number | null;
          avg_acceleration_x: number | null;
          avg_acceleration_y: number | null;
          avg_acceleration_z: number | null;
          max_movement_counter: number | null;
          avg_battery_voltage: number | null;
          min_battery_voltage: number | null;
          max_battery_voltage: number | null;
          max_tx_power: number | null;
          max_measurement_sequence_number: number | null;
          avg_rssi: number | null;
          avg_pm1_0: number | null;
          min_pm1_0: number | null;
          max_pm1_0: number | null;
          avg_pm2_5: number | null;
          min_pm2_5: number | null;
          max_pm2_5: number | null;
          avg_pm4_0: number | null;
          min_pm4_0: number | null;
          max_pm4_0: number | null;
          avg_pm10_0: number | null;
          min_pm10_0: number | null;
          max_pm10_0: number | null;
          avg_co2: number | null;
          min_co2: number | null;
          max_co2: number | null;
          avg_voc: number | null;
          min_voc: number | null;
          max_voc: number | null;
          avg_nox: number | null;
          min_nox: number | null;
          max_nox: number | null;
          avg_luminosity: number | null;
          min_luminosity: number | null;
          max_luminosity: number | null;
          max_flags: number | null;
        }>
      >(Prisma.sql`
      SELECT
        time_bucket(${bucketIntervalSql}, rm.time) AS time,
        rm.mac,
        AVG(rm.temperature)::real AS avg_temperature,
        MIN(rm.temperature)::real AS min_temperature,
        MAX(rm.temperature)::real AS max_temperature,
        AVG(rm.humidity)::real AS avg_humidity,
        MIN(rm.humidity)::real AS min_humidity,
        MAX(rm.humidity)::real AS max_humidity,
        AVG(rm.pressure)::real AS avg_pressure,
        MIN(rm.pressure)::real AS min_pressure,
        MAX(rm.pressure)::real AS max_pressure,
        AVG(rm.acceleration_x)::real AS avg_acceleration_x,
        AVG(rm.acceleration_y)::real AS avg_acceleration_y,
        AVG(rm.acceleration_z)::real AS avg_acceleration_z,
        MAX(rm.movement_counter)::integer AS max_movement_counter,
        AVG(rm.battery_voltage)::real AS avg_battery_voltage,
        MIN(rm.battery_voltage)::real AS min_battery_voltage,
        MAX(rm.battery_voltage)::real AS max_battery_voltage,
        MAX(rm.tx_power)::integer AS max_tx_power,
        MAX(rm.measurement_sequence_number)::integer AS max_measurement_sequence_number,
        AVG(rm.rssi)::real AS avg_rssi,
        AVG(rm.pm1_0)::real AS avg_pm1_0,
        MIN(rm.pm1_0)::real AS min_pm1_0,
        MAX(rm.pm1_0)::real AS max_pm1_0,
        AVG(rm.pm2_5)::real AS avg_pm2_5,
        MIN(rm.pm2_5)::real AS min_pm2_5,
        MAX(rm.pm2_5)::real AS max_pm2_5,
        AVG(rm.pm4_0)::real AS avg_pm4_0,
        MIN(rm.pm4_0)::real AS min_pm4_0,
        MAX(rm.pm4_0)::real AS max_pm4_0,
        AVG(rm.pm10_0)::real AS avg_pm10_0,
        MIN(rm.pm10_0)::real AS min_pm10_0,
        MAX(rm.pm10_0)::real AS max_pm10_0,
        AVG(rm.co2)::real AS avg_co2,
        MIN(rm.co2)::real AS min_co2,
        MAX(rm.co2)::real AS max_co2,
        AVG(rm.voc)::real AS avg_voc,
        MIN(rm.voc)::real AS min_voc,
        MAX(rm.voc)::real AS max_voc,
        AVG(rm.nox)::real AS avg_nox,
        MIN(rm.nox)::real AS min_nox,
        MAX(rm.nox)::real AS max_nox,
        AVG(rm.luminosity)::real AS avg_luminosity,
        MIN(rm.luminosity)::real AS min_luminosity,
        MAX(rm.luminosity)::real AS max_luminosity,
        MAX(rm.flags)::integer AS max_flags
      FROM ruuvi_measurements rm
      WHERE
        rm.time >= ${rawStart}
        AND rm.time <= ${rawEnd}
        AND ${macSql}
      GROUP BY 1, 2
      ORDER BY 1 ASC, 2 ASC
    `);

      return [...downsampled, ...rawAggregated];
    }),
  getRange: protectedProcedure
    .input(z.object({ timePeriod: zodTimePeriod }))
    .query(({ input, ctx }) => {
      return getRange(ctx, input.timePeriod);
    }),
  uploadImage: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        image: z.string(), // base64 or file URL
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Permission check
      await checkDeviceAccess(ctx, input.deviceId);

      // Upload image to Cloudinary with Basic Auth, overwrite previous image
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`;
      const uploadPreset = env.CLOUDINARY_UPLOAD_PRESET;
      const formData = new FormData();
      formData.append("file", input.image);
      formData.append("upload_preset", uploadPreset);
      // Set public_id to deviceId to overwrite previous image
      formData.append("public_id", input.deviceId);

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

      // Update serviceAccess.customData for the device while preserving other customData properties
      const prev = await ctx.db.serviceAccess.findUnique({
        where: { accessId: input.deviceId },
        select: { customData: true },
      });
      await ctx.db.serviceAccess.update({
        where: { accessId: input.deviceId },
        data: {
          customData: {
            ...parseCustomData(prev?.customData),
            picture: imageUrl,
          },
        },
      });
      return { success: true, imageUrl };
    }),
});

const getRange = async (
  ctx: IContext,
  timePeriod: TimePeriod,
): Promise<DatePickerRange> => {
  const minMaxTime = await ctx.db.ruuvi_measurements_downsampled_5min.aggregate({
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
    case TimePeriod.PT5M:
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


