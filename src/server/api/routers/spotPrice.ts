import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@energyapp/server/api/trpc";
import dayjs, { type Dayjs } from "dayjs";
import { type IContext, type ISpotPrice, type ISpotPriceResponse, type ISpotPriceSummary } from "@energyapp/shared/interfaces";
import { TimePeriod } from "@energyapp/shared/enums";
import { updateFromEntsoe } from "@energyapp/server/integration/entsoe";
import { updateFromElring } from "@energyapp/server/integration/elring";
import { TRPCError } from "@trpc/server";

export type DatePickerRange = {
  min?: Dayjs,
  max?: Dayjs,
}

const zodDay = z.custom<Dayjs>((val: unknown) => dayjs(val as string).isValid(), 'Invalid date');
const zodTimePeriod = z.nativeEnum(TimePeriod);

export const spotPriceRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ timePeriod: zodTimePeriod, startTime: zodDay, endTime: zodDay, additionalHour: z.boolean().optional() }))
    .query(({ input, ctx }) => {
      const startTime = dayjs(input.startTime).toDate();
      const endTime = dayjs(input.endTime).toDate();

      if (input.timePeriod === TimePeriod.PT1H && input.additionalHour) {
        endTime.setHours(endTime.getHours() + 1);
      }
      
      if (startTime > endTime) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Start time must be before end time',
        });
      }

      switch (input.timePeriod) {
        case TimePeriod.PT15M:
          return get15MinuteSpotPrices(ctx, startTime, endTime).then((prices) => {
            return spotPricesToResponse(input.timePeriod, prices, input.additionalHour);
          });
        case TimePeriod.PT1H:
          return getHourlySpotPrices(ctx, startTime, endTime).then((prices) => {
            return spotPricesToResponse(input.timePeriod, prices, input.additionalHour);
          });
        case TimePeriod.P1D:
          return getDailySpotPrices(ctx, startTime, endTime).then((prices) => {
            return spotPricesToResponse(input.timePeriod, prices);
          });
        case TimePeriod.P1M:
          return getMonthlySpotPrices(ctx, startTime, endTime).then((prices) => {
            return spotPricesToResponse(input.timePeriod, prices);
          });
        case TimePeriod.P1Y:
          return getYearlySpotPrices(ctx, startTime, endTime).then((prices) => {
            return spotPricesToResponse(input.timePeriod, prices);
          });
        default:
          return Promise.reject("Not implemented");
      }
    }),
  getCurrentPrice: publicProcedure
    .query(({ ctx }) => {
      return getCurrentSpotPrices(ctx)
    }),
  getRange: publicProcedure
    .input(z.object({ timePeriod: zodTimePeriod }))
    .query(({ input, ctx }) => {
      return getRange(ctx, input.timePeriod)
    }),
  update: protectedProcedure
    .input(z.object({ timePeriod: zodTimePeriod, startTime: zodDay, endTime: zodDay }))
    .mutation(async ({ input }) => {
      // Attempt updating from ENTSO-E first
      try {
        const entsoeResult = await updateFromEntsoe({ startDate: input.startTime, endDate: input.endTime });
        console.info('ENTSO-E update result', entsoeResult)
        if (entsoeResult) {
          return "ok";
        }
      }
      catch (error) {
        console.error('Error updating from ENTSO-E', error);
      }

      // Only update Elring hourly prices
      const elringResult = await updateFromElring({ startDate: input.startTime, endDate: input.endTime });
      console.info('Elring update result', elringResult)
      if (elringResult) {
        return "ok";
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unknown error occurred while updating',
      });
    }),
});

const getCurrentSpotPrices = (ctx: IContext): Promise<ISpotPrice | null> => {
  return ctx.db.day_ahead_prices.findFirst({
    orderBy: { time: "desc" },
    where: {
      time: {
        lte: new Date(),
      },
    },
    // orderBy: { time: "asc" },
    // where: {
    //   time: {
    //     gte: startTime,
    //     lte: endTime,
    //   },
    // },
  }).then((price) => {
    if (!price) {
      return null;
    }

    const time = dayjs(price.time);
    const tzTime = time.tz('Europe/Helsinki');

    return {
      time: time,
      currency: 'EUR',
      price: parseFloat((price.price / 10).toFixed(2)),
      price_with_tax: parseFloat(((price.price * (1 + price.tax_percentage / 100)) / 10).toFixed(2)),
      year: tzTime.year(),
      month: tzTime.month() + 1,
      day: tzTime.date(),
      hour: tzTime.hour(),
    } as ISpotPrice;
  })
}

const get15MinuteSpotPrices = (ctx: IContext, startTime: Date, endTime: Date): Promise<ISpotPrice[]> => {
  return ctx.db.day_ahead_prices.findMany({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((prices) => {
    const result: ISpotPrice[] = [];
    let i = 0;
    while (i < prices.length) {
      const price = prices[i];
      if (!price) {
        i++;
        continue;
      }
      const time = dayjs(price.time);
      const tzTime = time.tz('Europe/Helsinki');
      const next = prices[i + 1];
      const isHourly = next && dayjs(next.time).diff(time, 'minute') === 60;
      if (isHourly) {
        for (let j = 0; j < 4; j++) {
          const intervalTime = time.add(j * 15, 'minute');
          const intervalTzTime = intervalTime.tz('Europe/Helsinki');
          result.push({
            time: intervalTime,
            currency: 'EUR',
            price: parseFloat((price.price / 10).toFixed(2)),
            price_with_tax: parseFloat(((price.price * (1 + price.tax_percentage / 100)) / 10).toFixed(2)),
            year: intervalTzTime.year(),
            month: intervalTzTime.month() + 1,
            day: intervalTzTime.date(),
            hour: intervalTzTime.hour(),
          } as ISpotPrice);
        }
        i++;
        continue;
      }
      // Otherwise, treat as native 15min interval
      result.push({
        time: time,
        currency: 'EUR',
        price: parseFloat((price.price / 10).toFixed(2)),
        price_with_tax: parseFloat(((price.price * (1 + price.tax_percentage / 100)) / 10).toFixed(2)),
        year: tzTime.year(),
        month: tzTime.month() + 1,
        day: tzTime.date(),
        hour: tzTime.hour(),
      } as ISpotPrice);
      i++;
    }
    return result;
  })
}

const getHourlySpotPrices = (ctx: IContext, startTime: Date, endTime: Date): Promise<ISpotPrice[]> => {
  return ctx.db.average_kwh_price_hour_by_hour.findMany({
    orderBy: { date: "asc" },
    where: {
      date: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((prices) => {
    return prices.map((price) => {
      const time = dayjs(price.date);
      const tzTime = time.tz('Europe/Helsinki');

      return {
        time: time,
        currency: 'EUR',
        price: parseFloat((price.avg_price ?? 0).toFixed(2)),
        price_with_tax: parseFloat((price.avg_price_with_tax ?? 0).toFixed(2)),
        year: tzTime.year(),
        month: tzTime.month() + 1,
        day: tzTime.date(),
        hour: tzTime.hour(),
      } as ISpotPrice;
    });
  })
}

const getDailySpotPrices = (ctx: IContext, startTime: Date, endTime: Date): Promise<ISpotPrice[]> => {
  return ctx.db.average_kwh_price_day_by_day.findMany({
    orderBy: { date: "asc" },
    where: {
      date: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((prices) => {
    return prices.map((price) => {
      const time = dayjs(price.date);
      const tzTime = time.tz('Europe/Helsinki');

      return {
        time: time,
        currency: 'EUR',
        price: parseFloat((price.avg_price ?? 0).toFixed(2)),
        price_with_tax: parseFloat((price.avg_price_with_tax ?? 0).toFixed(2)),
        year: tzTime.year(),
        month: tzTime.month() + 1,
        day: tzTime.date(),
        hour: tzTime.hour(),
      } as ISpotPrice;
    });
  })
}

const getMonthlySpotPrices = (ctx: IContext, startTime: Date, endTime: Date): Promise<ISpotPrice[]> => {
  return ctx.db.average_kwh_price_month_by_month.findMany({
    orderBy: { date: "asc" },
    where: {
      date: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((prices) => {
    return prices.map((price) => {
      const time = dayjs(price.date);
      const tzTime = time.tz('Europe/Helsinki');

      return {
        time: time,
        currency: 'EUR',
        price: parseFloat((price.avg_price ?? 0).toFixed(2)),
        price_with_tax: parseFloat((price.avg_price_with_tax ?? 0).toFixed(2)),
        year: tzTime.year(),
        month: tzTime.month() + 1,
        day: tzTime.date(),
        hour: tzTime.hour(),
      } as ISpotPrice;
    });
  })
}

const getYearlySpotPrices = (ctx: IContext, startTime: Date, endTime: Date): Promise<ISpotPrice[]> => {
  return ctx.db.average_kwh_price_year_by_year.findMany({
    orderBy: { date: "asc" },
    where: {
      date: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((prices) => {
    return prices.map((price) => {
      const time = dayjs(price.date);
      const tzTime = time.tz('Europe/Helsinki');

      return {
        time: time,
        currency: 'EUR',
        price: parseFloat((price.avg_price ?? 0).toFixed(2)),
        price_with_tax: parseFloat((price.avg_price_with_tax ?? 0).toFixed(2)),
        year: tzTime.year(),
        month: tzTime.month() + 1,
        day: tzTime.date(),
        hour: tzTime.hour(),
      } as ISpotPrice;
    });
  })
}

const getRange = async (ctx: IContext, timePeriod: TimePeriod): Promise<DatePickerRange> => {
  switch (timePeriod) {
    case TimePeriod.PT15M:
    case TimePeriod.PT1H: {
      const minMaxTime = await ctx.db.average_kwh_price_day_by_day.aggregate({
        _min: {
          date: true,
        },
        _max: {
          date: true,
        },
      })

      return {
        min: dayjs(minMaxTime._min.date),
        max: dayjs(minMaxTime._max.date),
      }
    }
    case TimePeriod.P1D: {
      const minMaxTime = await ctx.db.average_kwh_price_month_by_month.aggregate({
        _min: {
          date: true,
        },
        _max: {
          date: true,
        },
      })

      return {
        min: dayjs(minMaxTime._min.date),
        max: dayjs(minMaxTime._max.date),
      }
    }
    case TimePeriod.P1M: {
      const minMaxTime = await ctx.db.average_kwh_price_year_by_year.aggregate({
        _min: {
          date: true,
        },
        _max: {
          date: true,
        },
      })

      return {
        min: dayjs(minMaxTime._min.date),
        max: dayjs(minMaxTime._max.date),
      }
    }
    case TimePeriod.P1Y: {
      const minMaxTime = await ctx.db.average_kwh_price_year_by_year.aggregate({
        _min: {
          date: true,
        },
        _max: {
          date: true,
        },
      })

      console.log(minMaxTime);

      return {
        min: dayjs(minMaxTime._min.date),
        max: dayjs(minMaxTime._max.date),
      }
    }
    default:
      return Promise.reject("Not implemented");
  }
}

const spotPricesToResponse = (timePeriod: TimePeriod, prices: ISpotPrice[], additionalHour = false): ISpotPriceResponse => {
  if (!prices.length) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'No prices found for the given time period',
    });
  }

  // Create a filtered array for summary calculations if additionalHour is true
  const summaryPrices =
    additionalHour &&
    timePeriod === TimePeriod.PT1H &&
    prices.length > 1 &&
    prices[prices.length - 1] &&
    prices[prices.length - 2] &&
    dayjs(prices[prices.length - 1]?.time).isAfter(
      dayjs(prices[prices.length - 2]?.time).startOf("day"),
      "day"
    )
      ? prices.slice(0, -1) // Exclude the last hour
      : prices;

  const summary = {
    cheapest: summaryPrices.reduce((prev, curr) => {
      return prev.price < curr.price ? prev : curr;
    }),
    mostExpensive: summaryPrices.reduce((prev, curr) => {
      return prev.price > curr.price ? prev : curr;
    }),
    average: {
      time: undefined,
      currency: "EUR",
      price: parseFloat((summaryPrices.reduce((prev, curr) => {
        return prev + curr.price;
      }, 0) / summaryPrices.length).toFixed(2)),
      price_with_tax: parseFloat((summaryPrices.reduce((prev, curr) => {
        return prev + curr.price_with_tax;
      }, 0) / summaryPrices.length).toFixed(2)),
      year: dayjs().year(),
      month: dayjs().month() + 1,
      day: dayjs().date(),
      hour: dayjs().hour(),
    },
  } as ISpotPriceSummary;

  return {
    timePeriod,
    summary,
    prices,
  };
}
