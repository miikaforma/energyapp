import { z } from "zod";
import { observable } from '@trpc/server/observable';
import { protectedProcedure, createTRPCRouter } from '../trpc';
import { notificationEmitter } from '../../homewizardListener';
import {
  type IContext,
  type HomewizardMeasurement,
  type HomewizardResponse,
} from "@energyapp/shared/interfaces";
import { TimePeriod } from "@energyapp/shared/enums";
import { TRPCError } from "@trpc/server";
import {
  type homewizard_measurements,
} from "@energyapp/generated/client";
import { Prisma } from "@energyapp/generated/client";
import dayjs, { type Dayjs } from "dayjs";
import { type DatePickerRange } from "./spotPrice";

const zodDay = z.custom<Dayjs>((val: unknown) => dayjs(val as string).isValid(), 'Invalid date');
const zodTimePeriod = z.nativeEnum(TimePeriod);
const deviceIdInput = z.object({ deviceId: z.string().optional() }).optional();
const getInput = z.object({
  timePeriod: zodTimePeriod,
  startTime: zodDay,
  endTime: zodDay,
  deviceId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const getFirstDevice = async (ctx: IContext) => {
  const userAccess = await ctx.db.userAccess.findFirst({
    where: {
      userId: ctx.session?.user?.id ?? "",
      type: "HOMEWIZARD",
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

  return userAccess;
};

const checkDeviceAccess = async (ctx: IContext, deviceId: string) => {
  const device = await ctx.db.serviceAccess.findFirst({
    where: {
      accessId: deviceId,
      userAccesses: {
        some: {
          userId: ctx.session?.user?.id ?? "",
          type: "HOMEWIZARD",
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

export const homewizardRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getInput)
    .query(async ({ input, ctx }) => {
      let deviceId = input.deviceId;
      if (!deviceId) {
        const firstDevice = await getFirstDevice(ctx);
        if (!firstDevice) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No devices found for this user" });
        }
        deviceId = firstDevice.accessId;
      } else {
        await checkDeviceAccess(ctx, deviceId);
      }

      const startTime = dayjs(input.startTime).toDate();
      const endTime = dayjs(input.endTime).toDate();

      if (startTime > endTime) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Start time must be before end time" });
      }

      switch (input.timePeriod) {
        case TimePeriod.PT15M:
          return queryView(ctx, "homewizard_pt15m", deviceId, startTime, endTime, input.timePeriod);
        case TimePeriod.PT1H:
          return queryView(ctx, "homewizard_pt1h", deviceId, startTime, endTime, input.timePeriod);
        case TimePeriod.P1D:
          return queryView(ctx, "homewizard_p1d", deviceId, startTime, endTime, input.timePeriod);
        case TimePeriod.P1M:
          return queryView(ctx, "homewizard_p1m", deviceId, startTime, endTime, input.timePeriod);
        case TimePeriod.P1Y:
          return queryView(ctx, "homewizard_p1y", deviceId, startTime, endTime, input.timePeriod);
        default:
          throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported time period" });
      }
    }),

  getRange: protectedProcedure
    .input(deviceIdInput)
    .query(async ({ input, ctx }) => {
      let deviceId = input?.deviceId;
      if (!deviceId) {
        const firstDevice = await getFirstDevice(ctx);
        if (!firstDevice) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No devices found for this user" });
        }
        deviceId = firstDevice.accessId;
      } else {
        await checkDeviceAccess(ctx, deviceId);
      }

      return queryRange(ctx, deviceId);
    }),

  onNewMeasurement: protectedProcedure
    .input(z.object({ deviceId: z.string().optional() }).optional())
    .subscription(async ({ input, ctx }) => {
      console.log("Subscribing to Homewizard measurements with input", input);
      // Determine deviceId: use input.deviceId or fetch first device for user
      let deviceId = input?.deviceId;
      if (!deviceId) {
        const firstDevice = await getFirstDevice(ctx);
        if (!firstDevice) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No devices found for this user",
          });
        }

        deviceId = firstDevice.accessId;
      }
      else {
        await checkDeviceAccess(ctx, deviceId);
      }
      return observable<homewizard_measurements>((emit) => {
        const handler = (data: homewizard_measurements) => {
          // Only emit if deviceId matches (assume data.unique_id is the device id)
          if (!deviceId || data.unique_id === deviceId) {
            emit.next(data);
          }
        };
        notificationEmitter.on('homewizard_measurements_insert', handler);
        return () => notificationEmitter.off('homewizard_measurements_insert', handler);
      });
    }),
  getLatest: protectedProcedure
    .input(z.object({ deviceId: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      let deviceId = input?.deviceId;
      if (!deviceId) {
        const firstDevice = await getFirstDevice(ctx);
        if (!firstDevice) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No devices found for this user",
          });
        }
        deviceId = firstDevice.accessId;
      } else {
        await checkDeviceAccess(ctx, deviceId);
      }
      const latestMeasurement = await ctx.db.homewizard_measurements.findFirst({
        where: { unique_id: deviceId },
        orderBy: { timestamp: "desc" },
      });
      if (!latestMeasurement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No measurements found for this device",
        });
      }
      return latestMeasurement;
    }),
});

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

type ViewName = "homewizard_pt15m" | "homewizard_pt1h" | "homewizard_p1d" | "homewizard_p1m" | "homewizard_p1y";

type ViewRow = {
  unique_id: string;
  bucket: Date;
  grid_import_kwh: number | null;
  grid_export_kwh: number | null;
  power_avg_w: number | null;
  peak_import_power_w: number | null;
  peak_export_power_w: number | null;
  sample_count: bigint | null;
};

type RangeRow = {
  min_bucket: Date | null;
  max_bucket: Date | null;
};

const toMeasurement = (row: ViewRow): HomewizardMeasurement => {
  const imported = row.grid_import_kwh ?? 0;
  const exported = row.grid_export_kwh ?? 0;
  const net = parseFloat((imported - exported).toFixed(4));
  return {
    bucket: dayjs(row.bucket),
    unique_id: row.unique_id,
    grid_import_kwh: parseFloat(imported.toFixed(4)),
    grid_export_kwh: parseFloat(exported.toFixed(4)),
    net_kwh: net,
    direction: net > 0.0001 ? "import" : net < -0.0001 ? "export" : "balanced",
    power_avg_w: row.power_avg_w !== null ? parseFloat(row.power_avg_w.toFixed(1)) : null,
    peak_import_power_w: row.peak_import_power_w !== null ? parseFloat(row.peak_import_power_w.toFixed(1)) : null,
    peak_export_power_w: row.peak_export_power_w !== null ? parseFloat(row.peak_export_power_w.toFixed(1)) : null,
    sample_count: Number(row.sample_count ?? 0),
  };
};

const viewTableMap: Record<ViewName, string> = {
  homewizard_pt15m: "homewizard_pt15m",
  homewizard_pt1h:  "homewizard_pt1h",
  homewizard_p1d:   "homewizard_p1d",
  homewizard_p1m:   "homewizard_p1m",
  homewizard_p1y:   "homewizard_p1y",
};

const queryView = async (
  ctx: IContext,
  view: ViewName,
  deviceId: string,
  startTime: Date,
  endTime: Date,
  timePeriod: TimePeriod,
): Promise<HomewizardResponse> => {
  const table = Prisma.raw(viewTableMap[view]);
  const rows = await ctx.db.$queryRaw<ViewRow[]>`
    SELECT
      unique_id,
      bucket,
      grid_import_kwh,
      grid_export_kwh,
      power_avg_w,
      peak_import_power_w,
      peak_export_power_w,
      sample_count
    FROM ${table}
    WHERE unique_id = ${deviceId}
      AND bucket >= ${startTime}
      AND bucket <= ${endTime}
    ORDER BY bucket ASC
  `;

  if (!rows.length) {
    throw new TRPCError({ code: "NOT_FOUND", message: "No measurements found for the given time period" });
  }

  return {
    timePeriod,
    measurements: rows.map(toMeasurement),
  };
};

const queryRange = async (ctx: IContext, deviceId: string): Promise<DatePickerRange> => {
  const rows = await ctx.db.$queryRaw<RangeRow[]>`
    SELECT
      MIN(bucket) AS min_bucket,
      MAX(bucket) AS max_bucket
    FROM homewizard_p1d
    WHERE unique_id = ${deviceId}
  `;
  const row = rows[0];
  return {
    min: row?.min_bucket ? dayjs(row.min_bucket) : undefined,
    max: row?.max_bucket ? dayjs(row.max_bucket) : undefined,
  };
};

