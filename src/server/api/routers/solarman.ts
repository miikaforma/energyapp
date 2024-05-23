import {
  createTRPCRouter,
  protectedProcedure,
} from "@energyapp/server/api/trpc";
import dayjs, { type Dayjs } from "dayjs";
import { z } from "zod";

import {
  type solarman_production_15_minutes,
  type solarman_production_hour_by_hour,
  type solarman_production_day_by_day,
  type solarman_production_month_by_month,
  type solarman_production_year_by_year,
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
          await refreshViewByTimePeriod(ctx, input.timePeriod);
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
          await refreshViewByTimePeriod(ctx, input.timePeriod);
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
          await refreshViewByTimePeriod(ctx, input.timePeriod);
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
          await refreshViewByTimePeriod(ctx, input.timePeriod);
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
          await refreshViewByTimePeriod(ctx, input.timePeriod);
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
});

// Productions
const getPT15MProductions = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProduction[]> => {
  const whereClause: { time: { gte: Date; lte?: Date } } = {
    time: {
      gte: dayjs(startTime).toDate(),
    },
  };

  if (endTime) {
    whereClause.time.lte = dayjs(endTime).toDate();
  }

  return await ctx.db.solarman_production_15_minutes
    .findMany({
      orderBy: { time: "asc" },
      where: whereClause,
    })
    .then((productions: solarman_production_15_minutes[]) => {
      return productions.map((production: solarman_production_15_minutes) => {
        return {
          ...production,
          time: dayjs(production.time),
        } as SolarmanProduction;
      });
    });
};

const getHourlyProductions = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProduction[]> => {
  const whereClause: { time: { gte: Date; lte?: Date } } = {
    time: {
      gte: dayjs(startTime).toDate(),
    },
  };

  if (endTime) {
    whereClause.time.lte = dayjs(endTime).toDate();
  }

  return await ctx.db.solarman_production_hour_by_hour
    .findMany({
      orderBy: { time: "asc" },
      where: whereClause,
    })
    .then((productions: solarman_production_hour_by_hour[]) => {
      return productions.map((production: solarman_production_hour_by_hour) => {
        return {
          ...production,
          time: dayjs(production.time),
        } as SolarmanProduction;
      });
    });
};

const getDailyProductions = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProduction[]> => {
  const whereClause: { time: { gte: Date; lte?: Date } } = {
    time: {
      gte: dayjs(startTime).toDate(),
    },
  };

  if (endTime) {
    whereClause.time.lte = dayjs(endTime).toDate();
  }

  return await ctx.db.solarman_production_day_by_day
    .findMany({
      orderBy: { time: "asc" },
      where: whereClause,
    })
    .then((productions: solarman_production_day_by_day[]) => {
      return productions.map((production: solarman_production_day_by_day) => {
        return {
          ...production,
          time: dayjs(production.time),
        } as SolarmanProduction;
      });
    });
};

const getMonthlyProductions = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProduction[]> => {
  const whereClause: { time: { gte: Date; lte?: Date } } = {
    time: {
      gte: dayjs(startTime).toDate(),
    },
  };

  if (endTime) {
    whereClause.time.lte = dayjs(endTime).toDate();
  }

  return await ctx.db.solarman_production_month_by_month
    .findMany({
      orderBy: { time: "asc" },
      where: whereClause,
    })
    .then((productions: solarman_production_month_by_month[]) => {
      return productions.map(
        (production: solarman_production_month_by_month) => {
          return {
            ...production,
            time: dayjs(production.time),
          } as SolarmanProduction;
        },
      );
    });
};

const getYearlyProductions = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProduction[]> => {
  const whereClause: { time: { gte: Date; lte?: Date } } = {
    time: {
      gte: dayjs(startTime).toDate(),
    },
  };

  if (endTime) {
    whereClause.time.lte = dayjs(endTime).toDate();
  }

  return await ctx.db.solarman_production_year_by_year
    .findMany({
      orderBy: { time: "asc" },
      where: whereClause,
    })
    .then((productions: solarman_production_year_by_year[]) => {
      return productions.map((production: solarman_production_year_by_year) => {
        return {
          ...production,
          time: dayjs(production.time),
        } as SolarmanProduction;
      });
    });
};

// Summary
const get15MinuteProductionSummary = (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProductionSummary | null> => {
  const whereClause: { time: { gte: Date; lte?: Date } } = {
    time: {
      gte: dayjs(startTime).toDate(),
    },
  };

  if (endTime) {
    whereClause.time.lte = dayjs(endTime).toDate();
  }

  const total = ctx.db.solarman_production_day_by_day
    .findFirst({
      orderBy: { time: "asc" },
      where: whereClause,
    })
    .then((production) => {
      if (!production) return Promise.resolve(null);

      return {
        ...production,
        time: dayjs(production.time),
      };
    });

  const best = ctx.db.solarman_production_15_minutes
    .findFirst({
      orderBy: { production: "desc" },
      where: whereClause,
    })
    .then((production) => {
      if (!production) return Promise.resolve(null);

      return {
        ...production,
        time: dayjs(production.time),
      };
    });

  return Promise.all([total, best]).then(([total, best]) => {
    return {
      total,
      best,
    } as SolarmanProductionSummary;
  });
};

const getHourlyProductionSummary = (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProductionSummary | null> => {
  const whereClause: { time: { gte: Date; lte?: Date } } = {
    time: {
      gte: dayjs(startTime).toDate(),
    },
  };

  if (endTime) {
    whereClause.time.lte = dayjs(endTime).toDate();
  }

  const total = ctx.db.solarman_production_day_by_day
    .findFirst({
      orderBy: { time: "asc" },
      where: whereClause,
    })
    .then((production) => {
      if (!production) return Promise.resolve(null);

      return {
        ...production,
        time: dayjs(production.time),
      };
    });

  const best = ctx.db.solarman_production_hour_by_hour
    .findFirst({
      orderBy: { production: "desc" },
      where: whereClause,
    })
    .then((production) => {
      if (!production) return Promise.resolve(null);

      return {
        ...production,
        time: dayjs(production.time),
      };
    });

  return Promise.all([total, best]).then(([total, best]) => {
    return {
      total,
      best,
    } as SolarmanProductionSummary;
  });
};

const getDailyProductionSummary = (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProductionSummary | null> => {
  const whereClause: { time: { gte: Date; lte?: Date } } = {
    time: {
      gte: dayjs(startTime).toDate(),
    },
  };

  if (endTime) {
    whereClause.time.lte = dayjs(endTime).toDate();
  }

  const total = ctx.db.solarman_production_month_by_month
    .findFirst({
      orderBy: { time: "asc" },
      where: whereClause,
    })
    .then((production) => {
      if (!production) return Promise.resolve(null);

      return {
        ...production,
        time: dayjs(production.time),
      };
    });

  const best = ctx.db.solarman_production_day_by_day
    .findFirst({
      orderBy: { production: "desc" },
      where: whereClause,
    })
    .then((production) => {
      if (!production) return Promise.resolve(null);

      return {
        ...production,
        time: dayjs(production.time),
      };
    });

  return Promise.all([total, best]).then(([total, best]) => {
    return {
      total,
      best,
    } as SolarmanProductionSummary;
  });
};

const getMonthlyProductionSummary = (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProductionSummary | null> => {
  const whereClause: { time: { gte: Date; lte?: Date } } = {
    time: {
      gte: dayjs(startTime).toDate(),
    },
  };

  if (endTime) {
    whereClause.time.lte = dayjs(endTime).toDate();
  }

  const total = ctx.db.solarman_production_year_by_year
    .findFirst({
      orderBy: { time: "asc" },
      where: whereClause,
    })
    .then((production) => {
      if (!production) return Promise.resolve(null);

      return {
        ...production,
        time: dayjs(production.time),
      };
    });

  const best = ctx.db.solarman_production_month_by_month
    .findFirst({
      orderBy: { production: "desc" },
      where: whereClause,
    })
    .then((production) => {
      if (!production) return Promise.resolve(null);

      return {
        ...production,
        time: dayjs(production.time),
      };
    });

  return Promise.all([total, best]).then(([total, best]) => {
    return {
      total,
      best,
    } as SolarmanProductionSummary;
  });
};

const getYearlyProductionSummary = (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<SolarmanProductionSummary | null> => {
  const whereClause: { time: { gte: Date; lte?: Date } } = {
    time: {
      gte: dayjs(startTime).toDate(),
    },
  };

  if (endTime) {
    whereClause.time.lte = dayjs(endTime).toDate();
  }

  const total = ctx.db.solarman_production_year_by_year
    .findFirst({
      orderBy: { time: "asc" },
      where: whereClause,
    })
    .then((production) => {
      if (!production) return Promise.resolve(null);

      return {
        ...production,
        time: dayjs(production.time),
      };
    });

  const best = ctx.db.solarman_production_year_by_year
    .findFirst({
      orderBy: { production: "desc" },
      where: whereClause,
    })
    .then((production) => {
      if (!production) return Promise.resolve(null);

      return {
        ...production,
        time: dayjs(production.time),
      };
    });

  return Promise.all([total, best]).then(([total, best]) => {
    return {
      total,
      best,
    } as SolarmanProductionSummary;
  });
};

const refreshViewByTimePeriod = async (
  ctx: IContext,
  timePeriod: TimePeriod,
): Promise<void> => {
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
