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
import { TimePeriod } from "@energyapp/shared/enums";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

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

const getAggregatedData = (
  ctx: IContext,
  startTime: Date,
  endTime: Date,
  interval: string,
  deviceIds: string[],
): Promise<ShellyConsumption[]> => {
  // console.log("getAggregatedData", startTime, endTime, interval, deviceIds);

  return ctx.db.$queryRaw<ShellyConsumption[]>`
    SELECT
        time_bucket(${Prisma.raw(`'${interval}'`)}, "time") AS time,
        "device_id",
        SUM("delta") AS consumption,
        MAX("aenergy") - MIN("aenergy") AS consumption2,
        AVG("temperature_c") AS avg_temperature_c,
        AVG("temperature_f") AS avg_temperature_f,
        AVG("apower") AS avg_apower,
        AVG("voltage") AS avg_voltage,
        AVG("freq") AS avg_freq,
        AVG("current") AS avg_current
    FROM 
    (
      SELECT
        *,
        -- GREATEST(aenergy - COALESCE(LAG(aenergy) OVER (PARTITION BY device_id ORDER BY time), aenergy), 0) AS delta
        CASE 
            WHEN EXTRACT(EPOCH FROM (time - LAG(time) OVER (PARTITION BY device_id ORDER BY time))) < 120 THEN 
              GREATEST(aenergy - COALESCE(LAG(aenergy) OVER (PARTITION BY device_id ORDER BY time), aenergy), 0)
            ELSE 
              0 -- Reset delta if the interval is 2 minutes or more
        END AS delta
      FROM "shelly_historical_data"
      WHERE "time" >= ${dayjs(startTime).subtract(1, 'hour').toDate()}
        AND "time" <= ${endTime}
        AND "device_id" IN (${Prisma.join(deviceIds)})
    ) AS delta_history
    WHERE "time" >= ${startTime}
      AND "time" <= ${endTime}
      AND "device_id" IN (${Prisma.join(deviceIds)})
    GROUP BY 1, "device_id"
    ORDER BY 1, "device_id"
  `;
};

const getAggregatedDayData = (
  ctx: IContext,
  startTime: Date,
  endTime: Date,
  deviceIds: string[],
) => getAggregatedData(ctx, startTime, endTime, "1 day", deviceIds);
const getAggregatedMonthData = (
  ctx: IContext,
  startTime: Date,
  endTime: Date,
  deviceIds: string[],
) => getAggregatedData(ctx, startTime, endTime, "1 month", deviceIds);
const getAggregatedYearData = (
  ctx: IContext,
  startTime: Date,
  endTime: Date,
  deviceIds: string[],
) => getAggregatedData(ctx, startTime, endTime, "1 year", deviceIds);
const getAggregatedHourData = (
  ctx: IContext,
  startTime: Date,
  endTime: Date,
  deviceIds: string[],
) => getAggregatedData(ctx, startTime, endTime, "1 hour", deviceIds);
const getAggregated15MinutesData = (
  ctx: IContext,
  startTime: Date,
  endTime: Date,
  deviceIds: string[],
) => getAggregatedData(ctx, startTime, endTime, "15 minutes", deviceIds);

const getDevices = async (ctx: IContext) => {
  const userAccesses = await ctx.db.userAccess.findMany({
    where: {
      userId: ctx.session?.user?.id ?? "",
      type: "SHELLY",
    },
    select: {
      accessId: true,
      serviceAccess: {
        select: {
          accessName: true,
        },
      },
    },
  });

  return userAccesses;
};

export const shellyRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        timePeriod: zodTimePeriod,
        startTime: zodDay,
        endTime: zodDay,
      }),
    )
    .query(async ({ input, ctx }) => {
      const startTime = dayjs(input.startTime).toDate();
      const endTime = dayjs(input.endTime).toDate();

      const devices = await getDevices(ctx);
      const deviceIds = devices.map((device) => device.accessId);
      // const deviceIds = ['shellyplus1pm-a0dd6c2b81dc']

      switch (input.timePeriod) {
        case TimePeriod.PT1H:
          return getAggregatedHourData(ctx, startTime, endTime, deviceIds).then(
            (data) => {
              return consumptionsToResponse(input.timePeriod, data, devices);
            },
          );
        case TimePeriod.P1D:
          return getAggregatedDayData(ctx, startTime, endTime, deviceIds).then(
            (data) => {
              return consumptionsToResponse(input.timePeriod, data, devices);
            },
          );
        case TimePeriod.P1M:
          return getAggregatedMonthData(
            ctx,
            startTime,
            endTime,
            deviceIds,
          ).then((data) => {
            return consumptionsToResponse(input.timePeriod, data, devices);
          });
        case TimePeriod.P1Y:
          return getAggregatedYearData(ctx, startTime, endTime, deviceIds).then(
            (data) => {
              return consumptionsToResponse(input.timePeriod, data, devices);
            },
          );
        case TimePeriod.PT15M:
          return getAggregated15MinutesData(
            ctx,
            startTime,
            endTime,
            deviceIds,
          ).then((data) => {
            return consumptionsToResponse(input.timePeriod, data, devices);
          });
        default:
          return Promise.reject("Not implemented");
      }
    }),
  // getCurrentPrice: publicProcedure
  //   .query(({ ctx }) => {
  //     return getCurrentSpotPrices(ctx)
  //   }),
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
    consumption.device_name = device?.serviceAccess.accessName ?? undefined;
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
