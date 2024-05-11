import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@energyapp/server/api/trpc";
import dayjs, { type Dayjs } from "dayjs";
import { type IWattiVahtiConsumption, type IContext, type IWattiVahtiConsumptionResponse, type IWattiVahtiProductionResponse, type IWattiVahtiProduction, } from "@energyapp/shared/interfaces";
import { TimePeriod } from "@energyapp/shared/enums";
import { TRPCError } from "@trpc/server";
import { updateFromWattiVahti } from "@energyapp/server/integration/wattivahti";
import { type energies_production_15min_by_15min, type energies_production_day_by_day, type energies_production_hour_by_hour, type energies_production_month_by_month, type energies_production_year_by_year, type energies_consumption_15min_by_15min, type energies_consumption_day_by_day, type energies_consumption_hour_by_hour, type energies_consumption_month_by_month, type energies_consumption_year_by_year } from '@prisma/client';

const zodDay = z.custom<Dayjs>((val: unknown) => dayjs(val as string).isValid(), 'Invalid date');
const zodTimePeriod = z.nativeEnum(TimePeriod);

export const wattivahtiRouter = createTRPCRouter({
  getConsumptions: protectedProcedure
    .input(z.object({ timePeriod: zodTimePeriod, startTime: zodDay, endTime: zodDay }))
    .query(async ({ input, ctx }) => {

      switch (input.timePeriod) {
        case TimePeriod.PT15M: {
          const [consumptions, summary] = await Promise.all([
            getPT15MConsumptions(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate()),
            getHourlyConsumptionSummary(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate())
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            consumptions,
          } as IWattiVahtiConsumptionResponse;
        }
        case TimePeriod.PT1H: {
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
        case TimePeriod.P1D: {
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
        case TimePeriod.P1M: {
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
        case TimePeriod.P1Y: {
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
  getProductions: protectedProcedure
    .input(z.object({ timePeriod: zodTimePeriod, startTime: zodDay, endTime: zodDay }))
    .query(async ({ input, ctx }) => {

      switch (input.timePeriod) {
        case TimePeriod.PT15M: {
          const [productions, summary] = await Promise.all([
            getPT15MProductions(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate()),
            getHourlyProductionSummary(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate())
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            productions,
          } as IWattiVahtiProductionResponse;
        }
        case TimePeriod.PT1H: {
          const [productions, summary] = await Promise.all([
            getHourlyProductions(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate()),
            getHourlyProductionSummary(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate())
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            productions,
          } as IWattiVahtiProductionResponse;
        }
        case TimePeriod.P1D: {
          const [productions, summary] = await Promise.all([
            getDailyProductions(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate()),
            getDailyProductionSummary(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate())
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            productions,
          } as IWattiVahtiProductionResponse;
        }
        case TimePeriod.P1M: {
          const [productions, summary] = await Promise.all([
            getMonthlyProductions(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate()),
            getMonthlyProductionSummary(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate())
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            productions,
          } as IWattiVahtiProductionResponse;
        }
        /* Not implemented fully, the summary is tricky */
        case TimePeriod.P1Y: {
          const [productions, summary] = await Promise.all([
            getYearlyProductions(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate()),
            getYearlyProductionSummary(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate())
          ]);

          return {
            timePeriod: input.timePeriod,
            summary,
            productions,
          } as IWattiVahtiProductionResponse;
        }
        default:
          return Promise.reject("Not implemented");
      }
    }),
  update: protectedProcedure
    .input(z.object({ timePeriod: zodTimePeriod, startTime: zodDay, endTime: zodDay }))
    .mutation(async ({ input }) => {
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

// Consumptions
const getPT15MConsumptions = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiConsumption[]> => {
  return ctx.db.energies_consumption_15min_by_15min.findMany({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((consumptions: energies_consumption_15min_by_15min[]) => {
    return consumptions.map((consumption: energies_consumption_15min_by_15min) => {
      return {
        ...consumption,
        time: dayjs(consumption.time),
      } as IWattiVahtiConsumption;
    });
  })
}

const getHourlyConsumptions = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiConsumption[]> => {
  return ctx.db.energies_consumption_hour_by_hour.findMany({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((consumptions: energies_consumption_hour_by_hour[]) => {
    return consumptions.map((consumption: energies_consumption_hour_by_hour) => {
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
  }).then((consumptions: energies_consumption_day_by_day[]) => {
    return consumptions.map((consumption: energies_consumption_day_by_day) => {
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
  }).then((consumptions: energies_consumption_month_by_month[]) => {
    return consumptions.map((consumption: energies_consumption_month_by_month) => {
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
  }).then((consumptions: energies_consumption_year_by_year[]) => {
    return consumptions.map((consumption: energies_consumption_year_by_year) => {
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

// Productions
const getPT15MProductions = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiProduction[]> => {
  return ctx.db.energies_production_15min_by_15min.findMany({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((productions: energies_production_15min_by_15min[]) => {
    return productions.map((production: energies_production_15min_by_15min) => {
      return {
        ...production,
        time: dayjs(production.time),
      } as IWattiVahtiProduction;
    });
  })
}

const getHourlyProductions = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiProduction[]> => {
  return ctx.db.energies_production_hour_by_hour.findMany({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((productions: energies_production_hour_by_hour[]) => {
    return productions.map((production: energies_production_hour_by_hour) => {
      return {
        ...production,
        time: dayjs(production.time),
      } as IWattiVahtiProduction;
    });
  })
}

const getDailyProductions = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiProduction[]> => {
  return ctx.db.energies_production_day_by_day.findMany({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((productions: energies_production_day_by_day[]) => {
    return productions.map((production: energies_production_day_by_day) => {
      return {
        ...production,
        time: dayjs(production.time),
      } as IWattiVahtiProduction;
    });
  })
}

const getMonthlyProductions = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiProduction[]> => {
  return ctx.db.energies_production_month_by_month.findMany({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((productions: energies_production_month_by_month[]) => {
    return productions.map((production: energies_production_month_by_month) => {
      return {
        ...production,
        time: dayjs(production.time),
      } as IWattiVahtiProduction;
    });
  })
}

const getYearlyProductions = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiProduction[]> => {
  return ctx.db.energies_production_year_by_year.findMany({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((productions: energies_production_year_by_year[]) => {
    return productions.map((production: energies_production_year_by_year) => {
      return {
        ...production,
        time: dayjs(production.time),
      } as IWattiVahtiProduction;
    });
  })
}


const getHourlyProductionSummary = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiProduction | null> => {
  return ctx.db.energies_production_day_by_day.findFirst({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((production) => {
    if (!production) return Promise.resolve(null);

    return {
      ...production,
      time: dayjs(production.time),
    } as IWattiVahtiProduction;
  })
}

const getDailyProductionSummary = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiProduction | null> => {
  return ctx.db.energies_production_month_by_month.findFirst({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((production) => {
    if (!production) return Promise.resolve(null);

    return {
      ...production,
      time: dayjs(production.time),
    } as IWattiVahtiProduction;
  })
}

const getMonthlyProductionSummary = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiProduction | null> => {
  return ctx.db.energies_production_year_by_year.findFirst({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((production) => {
    if (!production) return Promise.resolve(null);

    return {
      ...production,
      time: dayjs(production.time),
    } as IWattiVahtiProduction;
  })
}

const getYearlyProductionSummary = (ctx: IContext, startTime: Date, endTime: Date): Promise<IWattiVahtiProduction | null> => {
  return ctx.db.energies_production_year_by_year.findFirst({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((production) => {
    if (!production) return Promise.resolve(null);

    return {
      ...production,
      time: dayjs(production.time),
    } as IWattiVahtiProduction;
  })
}

