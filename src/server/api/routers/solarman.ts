import {
  createTRPCRouter,
  protectedProcedure,
} from "@energyapp/server/api/trpc";
import dayjs, { type Dayjs } from "dayjs";
import { z } from "zod";

import {
  type solarman_inverter_data,
} from "@prisma/client";
import { TimePeriod } from "@energyapp/shared/enums";
import {
  type SolarmanProductionSummary,
  type IContext,
  type SolarmanProduction,
  type SolarmanProductionResponse,
  type SolarmanLatestProduction,
} from "@energyapp/shared/interfaces";
// import { TRPCError } from "@trpc/server";

const zodDay = z.custom<Dayjs>(
  (val: unknown) => dayjs(val as string).isValid(),
  "Invalid date",
);
const zodTimePeriod = z.nativeEnum(TimePeriod);

// TODO: Add actual permission checks, now only checks for login
export const solarmanRouter = createTRPCRouter({
  getLatest: protectedProcedure.query(
    async ({ ctx }): Promise<SolarmanLatestProduction | null> => {
      return await ctx.db.solarman_inverter_data
        .findFirst({
          orderBy: { time: "desc" },
        })
        .then((production: solarman_inverter_data | null) => {
          if (!production) return null;

          return {
            plant_id: production.plant_id,
            device_id: production.device_id,
            output_power_active: production.output_power_active,
            solar_production_total: production.solar_production_total,
            solar_production_today: production.solar_production_today,
            solar_time_total: production.solar_time_total,
            solar_time_today: production.solar_time_today,
            time: dayjs(production.time),
          } as SolarmanLatestProduction;
        });
    },
  ),
  getProductions: protectedProcedure
    .input(
      z.object({
        timePeriod: zodTimePeriod,
        startTime: zodDay,
        endTime: zodDay.optional(),
      }),
    )
    .query(async ({ input, ctx }): Promise<SolarmanProductionResponse> => {
      const startTime = dayjs(input.startTime).toDate();
      const endTime = input.endTime ? dayjs(input.endTime).toDate() : undefined;

      switch (input.timePeriod) {
        case TimePeriod.PT15M: {
          // await refreshViewByTimePeriod(ctx, input.timePeriod);
          const [productions, summary] = await Promise.all([
            getPT15MProductions(ctx, startTime, endTime),
            get15MinuteProductionSummary(ctx, startTime, endTime),
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            productions,
          } as SolarmanProductionResponse;
        }
        case TimePeriod.PT1H: {
          // await refreshViewByTimePeriod(ctx, input.timePeriod);
          const [productions, summary] = await Promise.all([
            getHourlyProductions(ctx, startTime, endTime),
            getHourlyProductionSummary(ctx, startTime, endTime),
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            productions,
          } as SolarmanProductionResponse;
        }
        case TimePeriod.P1D: {
          // await refreshViewByTimePeriod(ctx, input.timePeriod);
          const [productions, summary] = await Promise.all([
            getDailyProductions(ctx, startTime, endTime),
            getDailyProductionSummary(ctx, startTime, endTime),
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            productions,
          } as SolarmanProductionResponse;
        }
        case TimePeriod.P1M: {
          // await refreshViewByTimePeriod(ctx, input.timePeriod);
          const [productions, summary] = await Promise.all([
            getMonthlyProductions(ctx, startTime, endTime),
            getMonthlyProductionSummary(ctx, startTime, endTime),
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            productions,
          } as SolarmanProductionResponse;
        }
        /* Not implemented fully, the summary is tricky */
        case TimePeriod.P1Y: {
          // await refreshViewByTimePeriod(ctx, input.timePeriod);
          const [productions, summary] = await Promise.all([
            getYearlyProductions(ctx, startTime, endTime),
            getYearlyProductionSummary(ctx, startTime, endTime),
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            productions,
          } as SolarmanProductionResponse;
        }
        default:
          return Promise.reject("Not implemented");
      }
    }),
  update: protectedProcedure
    .input(z.object({ timePeriod: zodTimePeriod }))
    .mutation(async (_input) => {
      //await refreshViewByTimePeriod(ctx, _input.timePeriod);
    }),
});

const getProductionsByTimePeriod = async (
  ctx: IContext,
  timePeriod: TimePeriod,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProduction[]> => {
  // Determine table name based on timePeriod
  let timeBucket = "";
  switch (timePeriod) {
    case TimePeriod.PT15M:
      timeBucket = "15 minutes";
      break;
    case TimePeriod.PT1H:
      timeBucket = "1 hour";
      break;
    case TimePeriod.P1D:
      timeBucket = "1 day";
      break;
    case TimePeriod.P1M:
      timeBucket = "1 month";
      break;
    case TimePeriod.P1Y:
      timeBucket = "1 year";
      break;
    default:
      throw new Error("Unsupported time period");
  }

  // Build the query with GROUP BY and ORDER BY on time, plant_id, device_id, and time filter
  let query = `SELECT time_bucket('${timeBucket}', "time") AS time, plant_id, device_id, sum(production) AS production FROM solarman_production_15m_live WHERE time >= $1`;
  const params: any[] = [startTime];
  if (endTime) {
    query += " AND time <= $2";
    params.push(endTime);
  }
  query += ` GROUP BY 1,2,3 ORDER BY 1,2,3`;

  const productions = await ctx.db.$queryRawUnsafe(query, ...params);
  return (productions as Array<{ time: Date; plant_id: number; device_id: number; production: number }>).map((production) => ({
    ...production,
    time: dayjs(production.time),
  }));
};

// Productions
const getPT15MProductions = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProduction[]> => {
  return getProductionsByTimePeriod(ctx, TimePeriod.PT15M, startTime, endTime);
};

const getHourlyProductions = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProduction[]> => {
  return getProductionsByTimePeriod(ctx, TimePeriod.PT1H, startTime, endTime);
};

const getDailyProductions = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProduction[]> => {
  return getProductionsByTimePeriod(ctx, TimePeriod.P1D, startTime, endTime);
};

const getMonthlyProductions = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProduction[]> => {
  return getProductionsByTimePeriod(ctx, TimePeriod.P1M, startTime, endTime);
};

const getYearlyProductions = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProduction[]> => {
  return getProductionsByTimePeriod(ctx, TimePeriod.P1Y, startTime, endTime);
};

// Summary
const get15MinuteProductionSummary = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProductionSummary | null> => {
  let totalQuery = `SELECT MIN(time) as time, plant_id, device_id, SUM(production) as production FROM solarman_production_15m_live WHERE time >= $1`;
  let bestQuery = `SELECT time, plant_id, device_id, SUM(production) as production FROM solarman_production_15m_live WHERE time >= $1`;
  const params: Date[] = [startTime];
  if (endTime) {
    totalQuery += " AND time <= $2";
    bestQuery += " AND time <= $2";
    params.push(endTime);
  }
  totalQuery += " GROUP BY 2, 3";
  bestQuery += " GROUP BY 1, 2, 3 ORDER BY production DESC LIMIT 1";

  const [totalResult, bestResult] = await Promise.all([
    ctx.db.$queryRawUnsafe(totalQuery, ...params) as Promise<Array<{ time: Date; plant_id: number; device_id: number; production: number }>>,
    ctx.db.$queryRawUnsafe(bestQuery, ...params) as Promise<Array<{ time: Date; plant_id: number; device_id: number; production: number }>>,
  ]);

  const total = totalResult?.[0]
    ? { ...totalResult[0], time: dayjs(totalResult[0].time) }
    : undefined;
  const best = bestResult?.[0]
    ? { ...bestResult[0], time: dayjs(bestResult[0].time) }
    : undefined;

  return { total, best };
};

const getHourlyProductionSummary = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProductionSummary | null> => {
  let totalQuery = `SELECT MIN(time) as time, plant_id, device_id, SUM(production) as production FROM solarman_production_15m_live WHERE time >= $1`;
  let bestQuery = `SELECT time_bucket('1 hour', "time") as time, plant_id, device_id, SUM(production) as production FROM solarman_production_15m_live WHERE time >= $1`;
  const params: Date[] = [startTime];
  if (endTime) {
    totalQuery += " AND time <= $2";
    bestQuery += " AND time <= $2";
    params.push(endTime);
  }
  totalQuery += " GROUP BY 2, 3";
  bestQuery += " GROUP BY 1, 2, 3 ORDER BY production DESC LIMIT 1";

  const [totalResult, bestResult] = await Promise.all([
    ctx.db.$queryRawUnsafe(totalQuery, ...params) as Promise<Array<{ time: Date; plant_id: number; device_id: number; production: number }>>,
    ctx.db.$queryRawUnsafe(bestQuery, ...params) as Promise<Array<{ time: Date; plant_id: number; device_id: number; production: number }>>,
  ]);

  const total = totalResult?.[0]
    ? { ...totalResult[0], time: dayjs(totalResult[0].time) }
    : undefined;
  const best = bestResult?.[0]
    ? { ...bestResult[0], time: dayjs(bestResult[0].time) }
    : undefined;

  return { total, best };
};

const getDailyProductionSummary = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProductionSummary | null> => {
  let totalQuery = `SELECT MIN(time) as time, plant_id, device_id, SUM(production) as production FROM solarman_production_15m_live WHERE time >= $1`;
  let bestQuery = `SELECT time_bucket('1 day', "time") as time, plant_id, device_id, SUM(production) as production FROM solarman_production_15m_live WHERE time >= $1`;
  const params: Date[] = [startTime];
  if (endTime) {
    totalQuery += " AND time <= $2";
    bestQuery += " AND time <= $2";
    params.push(endTime);
  }
  totalQuery += " GROUP BY 2, 3";
  bestQuery += " GROUP BY 1, 2, 3 ORDER BY production DESC LIMIT 1";

  const [totalResult, bestResult] = await Promise.all([
    ctx.db.$queryRawUnsafe(totalQuery, ...params) as Promise<Array<{ time: Date; plant_id: number; device_id: number; production: number }>>,
    ctx.db.$queryRawUnsafe(bestQuery, ...params) as Promise<Array<{ time: Date; plant_id: number; device_id: number; production: number }>>,
  ]);

  const total = totalResult?.[0]
    ? { ...totalResult[0], time: dayjs(totalResult[0].time) }
    : undefined;
  const best = bestResult?.[0]
    ? { ...bestResult[0], time: dayjs(bestResult[0].time) }
    : undefined;

  return { total, best };
};

const getMonthlyProductionSummary = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProductionSummary | null> => {
  let totalQuery = `SELECT MIN(time) as time, plant_id, device_id, SUM(production) as production FROM solarman_production_15m_live WHERE time >= $1`;
  let bestQuery = `SELECT time_bucket('1 month', "time") as time, plant_id, device_id, SUM(production) as production FROM solarman_production_15m_live WHERE time >= $1`;
  const params: Date[] = [startTime];
  if (endTime) {
    totalQuery += " AND time <= $2";
    bestQuery += " AND time <= $2";
    params.push(endTime);
  }
  totalQuery += " GROUP BY 2, 3";
  bestQuery += " GROUP BY 1, 2, 3 ORDER BY production DESC LIMIT 1";

  const [totalResult, bestResult] = await Promise.all([
    ctx.db.$queryRawUnsafe(totalQuery, ...params) as Promise<Array<{ time: Date; plant_id: number; device_id: number; production: number }>>,
    ctx.db.$queryRawUnsafe(bestQuery, ...params) as Promise<Array<{ time: Date; plant_id: number; device_id: number; production: number }>>,
  ]);

  const total = totalResult?.[0]
    ? { ...totalResult[0], time: dayjs(totalResult[0].time) }
    : undefined;
  const best = bestResult?.[0]
    ? { ...bestResult[0], time: dayjs(bestResult[0].time) }
    : undefined;

  return { total, best };
};

const getYearlyProductionSummary = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProductionSummary | null> => {
  let totalQuery = `SELECT MIN(time) as time, plant_id, device_id, SUM(production) as production FROM solarman_production_15m_live WHERE time >= $1`;
  let bestQuery = `SELECT time_bucket('1 year', "time") as time, plant_id, device_id, SUM(production) as production FROM solarman_production_15m_live WHERE time >= $1`;
  const params: Date[] = [startTime];
  if (endTime) {
    totalQuery += " AND time <= $2";
    bestQuery += " AND time <= $2";
    params.push(endTime);
  }
  totalQuery += " GROUP BY 2, 3";
  bestQuery += " GROUP BY 1, 2, 3 ORDER BY production DESC LIMIT 1";

  const [totalResult, bestResult] = await Promise.all([
    ctx.db.$queryRawUnsafe(totalQuery, ...params) as Promise<Array<{ time: Date; plant_id: number; device_id: number; production: number }>>,
    ctx.db.$queryRawUnsafe(bestQuery, ...params) as Promise<Array<{ time: Date; plant_id: number; device_id: number; production: number }>>,
  ]);

  const total = totalResult?.[0]
    ? { ...totalResult[0], time: dayjs(totalResult[0].time) }
    : undefined;
  const best = bestResult?.[0]
    ? { ...bestResult[0], time: dayjs(bestResult[0].time) }
    : undefined;

  return { total, best };
};

const refreshTimestamps = new Map<TimePeriod, number>();

const refreshViewByTimePeriod = async (
  ctx: IContext,
  timePeriod: TimePeriod,
): Promise<void> => {
  const now = Date.now();
  const lastRefresh = refreshTimestamps.get(timePeriod);

  // Check if the last refresh was within the last 10 seconds
  if (lastRefresh && now - lastRefresh < 10 * 1000) {
    console.log(`Skipping refresh for ${timePeriod}, last refresh was too recent.`);
    return;
  }

  // Update the timestamp for the current timePeriod
  refreshTimestamps.set(timePeriod, now);

  switch (timePeriod) {
    case TimePeriod.PT15M:
      await ctx.db
        .$executeRaw`REFRESH MATERIALIZED VIEW solarman_production_15_minutes`;
      await ctx.db
        .$executeRaw`REFRESH MATERIALIZED VIEW solarman_production_day_by_day`;
      break;
    case TimePeriod.PT1H:
      await ctx.db
        .$executeRaw`REFRESH MATERIALIZED VIEW solarman_production_hour_by_hour`;
      await ctx.db
        .$executeRaw`REFRESH MATERIALIZED VIEW solarman_production_day_by_day`;
      break;
    case TimePeriod.P1D:
      await ctx.db
        .$executeRaw`REFRESH MATERIALIZED VIEW solarman_production_day_by_day`;
      await ctx.db
        .$executeRaw`REFRESH MATERIALIZED VIEW solarman_production_month_by_month`;
      break;
    case TimePeriod.P1M:
      await ctx.db
        .$executeRaw`REFRESH MATERIALIZED VIEW solarman_production_month_by_month`;
      await ctx.db
        .$executeRaw`REFRESH MATERIALIZED VIEW solarman_production_year_by_year`;
      break;
    case TimePeriod.P1Y:
      await ctx.db
        .$executeRaw`REFRESH MATERIALIZED VIEW solarman_production_year_by_year`;
      await ctx.db
        .$executeRaw`REFRESH MATERIALIZED VIEW solarman_production_year_by_year`;
      break;
  }
};
