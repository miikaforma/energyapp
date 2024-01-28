import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@energyapp/server/api/trpc";
import dayjs, { type Dayjs } from "dayjs";
import { type IWattiVahtiConsumption, type IContext, type IWattiVahtiConsumptionResponse, } from "@energyapp/shared/interfaces";
import { TimePeriod } from "@energyapp/shared/enums";
import { TRPCError } from "@trpc/server";
import { updateFromWattiVahti } from "@energyapp/server/integration/wattivahti";

const zodDay = z.custom<Dayjs>((val: unknown) => dayjs(val as string).isValid(), 'Invalid date');
const zodTimePeriod = z.nativeEnum(TimePeriod);

export const wattivahtiRouter = createTRPCRouter({
  getConsumptions: protectedProcedure
    .input(z.object({ timePeriod: zodTimePeriod, startTime: zodDay, endTime: zodDay }))
    .query(async ({ input, ctx }) => {

      switch (input.timePeriod) {
        case TimePeriod.Hour: {
          const [consumptions, summary] = await Promise.all([
            getHourlyConsumptions(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate()),
            getHourlyConsumptionSummary(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate())
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            consumptions,
          } as IWattiVahtiConsumptionResponse;
        }
        case TimePeriod.Day: {
          const [consumptions, summary] = await Promise.all([
            getDailyConsumptions(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate()),
            getDailyConsumptionSummary(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate())
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            consumptions,
          } as IWattiVahtiConsumptionResponse;
        }
        case TimePeriod.Month: {
          const [consumptions, summary] = await Promise.all([
            getMonthlyConsumptions(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate()),
            getMonthlyConsumptionSummary(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate())
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            consumptions,
          } as IWattiVahtiConsumptionResponse;
        }
        /* Not implemented fully, the summary is tricky */
        case TimePeriod.Year: {
          const [consumptions, summary] = await Promise.all([
            getYearlyConsumptions(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate()),
            getYearlyConsumptionSummary(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate())
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            consumptions,
          } as IWattiVahtiConsumptionResponse;
        }
        default:
          return Promise.reject("Not implemented");
      }
    }),
    update: protectedProcedure
    .input(z.object({ timePeriod: zodTimePeriod, startTime: zodDay, endTime: zodDay }))
    .mutation(async ({ input, ctx }) => {
      // Attempt updating from WattiVahti
      const updateResult = await updateFromWattiVahti({ startDate: input.startTime, endDate: input.endTime });
      console.info('WatiVahti update result', updateResult)
      if (updateResult) {
        return "ok";
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unknown error occurred while updating',
      });
    }),
});

const getHourlyConsumptions = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiConsumption[]> => {
  return ctx.db.energies_consumption_hour_by_hour.findMany({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((consumptions) => {
    return consumptions.map((consumption) => {
      return {
        ...consumption,
        time: dayjs(consumption.time),
      } as IWattiVahtiConsumption;
    });
  })
}

const getDailyConsumptions = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiConsumption[]> => {
  return ctx.db.energies_consumption_day_by_day.findMany({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((consumptions) => {
    return consumptions.map((consumption) => {
      return {
        ...consumption,
        time: dayjs(consumption.time),
      } as IWattiVahtiConsumption;
    });
  })
}

const getMonthlyConsumptions = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiConsumption[]> => {
  return ctx.db.energies_consumption_month_by_month.findMany({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((consumptions) => {
    return consumptions.map((consumption) => {
      return {
        ...consumption,
        time: dayjs(consumption.time),
      } as IWattiVahtiConsumption;
    });
  })
}

const getYearlyConsumptions = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiConsumption[]> => {
  return ctx.db.energies_consumption_year_by_year.findMany({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((consumptions) => {
    return consumptions.map((consumption) => {
      return {
        ...consumption,
        time: dayjs(consumption.time),
      } as IWattiVahtiConsumption;
    });
  })
}


const getHourlyConsumptionSummary = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiConsumption | null> => {
  return ctx.db.energies_consumption_day_by_day.findFirst({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((consumption) => {
    if (!consumption) return Promise.resolve(null);

    return {
      ...consumption,
      time: dayjs(consumption.time),
    } as IWattiVahtiConsumption;
  })
}

const getDailyConsumptionSummary = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiConsumption | null> => {
  return ctx.db.energies_consumption_month_by_month.findFirst({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((consumption) => {
    if (!consumption) return Promise.resolve(null);

    return {
      ...consumption,
      time: dayjs(consumption.time),
    } as IWattiVahtiConsumption;
  })
}

const getMonthlyConsumptionSummary = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiConsumption | null> => {
  return ctx.db.energies_consumption_year_by_year.findFirst({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((consumption) => {
    if (!consumption) return Promise.resolve(null);

    return {
      ...consumption,
      time: dayjs(consumption.time),
    } as IWattiVahtiConsumption;
  })
}

const getYearlyConsumptionSummary = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiConsumption | null> => {
  return ctx.db.energies_consumption_year_by_year.findFirst({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((consumption) => {
    if (!consumption) return Promise.resolve(null);

    return {
      ...consumption,
      time: dayjs(consumption.time),
    } as IWattiVahtiConsumption;
  })
}
