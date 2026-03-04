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
import { Prisma, ruuvi_measurements, type shelly_historical_data } from "@energyapp/generated/client";

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
      const devices = await getDevices(ctx);
      const deviceIds = devices.map((device) => device.accessId);

      if (input.id && !deviceIds.includes(input.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this device",
        });
      }
    }),
  getRange: protectedProcedure
    .input(z.object({ timePeriod: zodTimePeriod }))
    .query(({ input, ctx }) => {
      return getRange(ctx, input.timePeriod);
    }),
});

const getRange = async (
  ctx: IContext,
  timePeriod: TimePeriod,
): Promise<DatePickerRange> => {
  const minMaxTime = await ctx.db.ruuvi_measurements.aggregate({
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
    timePeriod,
    summary,
    consumptions,
  };
};
