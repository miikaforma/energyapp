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
import { Prisma, type shelly_historical_data } from "@prisma/client";

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
      WHERE "time" >= ${dayjs(startTime).subtract(1, "hour").toDate()}
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

const getAggregatedDataV2 = (
  ctx: IContext,
  startTime: Date,
  endTime: Date,
  interval: TimePeriod,
  deviceIds: string[],
): Promise<ShellyConsumption[]> => {
  const sqlInterval = mapIntervalToSQL(interval);

  return ctx.db.$queryRaw<ShellyConsumption[]>`
    WITH avg_measurements AS (
        SELECT
            device_id,
            time_bucket(${Prisma.raw(
              `'${sqlInterval}'`,
            )}, "time") AS rounded_interval,
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
        GROUP BY device_id, rounded_interval
    )
    SELECT
        c.time AS time,
        c.device_id,
        c.energy_mw AS consumption,
        m.avg_apower AS avg_apower,
        m.avg_temp_c AS avg_temperature_c,
        m.avg_temp_f AS avg_temperature_f,
        m.avg_voltage AS avg_voltage,
        m.avg_current AS avg_current,
        m.avg_freq AS avg_freq
    FROM shelly_historical_consumption_data c
    LEFT JOIN avg_measurements m
      ON m.device_id = c.device_id
      AND m.rounded_interval = time_bucket(${Prisma.raw(
        `'${sqlInterval}'`,
      )}, c.time)
    WHERE c.time >= ${startTime}
      AND c.time <= ${endTime}
      AND c.device_id IN (${Prisma.join(deviceIds)})
    ORDER BY 1 DESC;
  `;
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

// time_bucket(${Prisma.raw(`'${interval}'`)}, "time") AS time,
// "device_id",
// SUM("delta") AS consumption,
// MAX("aenergy") - MIN("aenergy") AS consumption2,
// AVG("temperature_c") AS avg_temperature_c,
// AVG("temperature_f") AS avg_temperature_f,
// AVG("apower") AS avg_apower,
// AVG("voltage") AS avg_voltage,
// AVG("freq") AS avg_freq,
// AVG("current") AS avg_current

const getAggregatedDayData = (
  ctx: IContext,
  startTime: Date,
  endTime: Date,
  deviceIds: string[],
) => getAggregatedDataV3(ctx, startTime, endTime, TimePeriod.P1D, deviceIds);
const getAggregatedMonthData = (
  ctx: IContext,
  startTime: Date,
  endTime: Date,
  deviceIds: string[],
) => getAggregatedDataV3(ctx, startTime, endTime, TimePeriod.P1M, deviceIds);
const getAggregatedYearData = (
  ctx: IContext,
  startTime: Date,
  endTime: Date,
  deviceIds: string[],
) => getAggregatedDataV3(ctx, startTime, endTime, TimePeriod.P1Y, deviceIds);
const getAggregatedHourData = (
  ctx: IContext,
  startTime: Date,
  endTime: Date,
  deviceIds: string[],
) => getAggregatedDataV3(ctx, startTime, endTime, TimePeriod.PT1H, deviceIds);
const getAggregated15MinutesData = (
  ctx: IContext,
  startTime: Date,
  endTime: Date,
  deviceIds: string[],
) => getAggregatedDataV3(ctx, startTime, endTime, TimePeriod.PT15M, deviceIds);

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

export const shellyRouter = createTRPCRouter({
  getDevices: protectedProcedure.query(async ({ ctx }) => {
    const devices = await getDevices(ctx);
    return devices;
  }),
  getDevicesWithInfo: protectedProcedure.query(async ({ ctx }) => {
    const devices = await getDevices(ctx);

    // Fetch the latest data for each device
    // const latestData = await ctx.db.shelly_historical_data.findMany({
    //   where: {
    //     device_id: {
    //       in: devices.map((device) => device.accessId),
    //     },
    //   },
    //   orderBy: {
    //     time: "desc",
    //   },
    // });

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
        devices.map((device) => device.accessId),
      )})
    `;

    // Map the latest data to the devices
    const devicesWithLatestData = devices.map((device) => {
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
      }

      if (input.viewType === ShellyViewType.GROUP) {
        if (!input.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Group ID is required for group view type",
          });
        }

        const groupKey = decodeURIComponent(input.id);
        deviceIds = devices
          .filter((device) => {
            const customData = device.serviceAccess.customData as {
              groupKey?: string;
            };
            return customData?.groupKey === groupKey;
          })
          .map((device) => device.accessId);
      }
      // const deviceIds = ['shellyplus1pm-a0dd6c2b81dc']

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
        return consumptionsToResponse(input.timePeriod, data, devices);
      });

      // switch (input.timePeriod) {
      //   case TimePeriod.PT1H:
      //     return getAggregatedHourData(ctx, startTime, endTime, deviceIds).then(
      //       (data) => {
      //         return consumptionsToResponse(input.timePeriod, data, devices);
      //       },
      //     );
      //   case TimePeriod.P1D:
      //     return getAggregatedDayData(ctx, startTime, endTime, deviceIds).then(
      //       (data) => {
      //         return consumptionsToResponse(input.timePeriod, data, devices);
      //       },
      //     );
      //   case TimePeriod.P1M:
      //     return getAggregatedMonthData(
      //       ctx,
      //       startTime,
      //       endTime,
      //       deviceIds,
      //     ).then((data) => {
      //       return consumptionsToResponse(input.timePeriod, data, devices);
      //     });
      //   case TimePeriod.P1Y:
      //     return getAggregatedYearData(ctx, startTime, endTime, deviceIds).then(
      //       (data) => {
      //         return consumptionsToResponse(input.timePeriod, data, devices);
      //       },
      //     );
      //   case TimePeriod.PT15M:
      //     return getAggregated15MinutesData(
      //       ctx,
      //       startTime,
      //       endTime,
      //       deviceIds,
      //     ).then((data) => {
      //       return consumptionsToResponse(input.timePeriod, data, devices);
      //     });
      //   default:
      //     return Promise.reject("Not implemented");
      // }
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
