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
import { updateFromNordpool } from "@energyapp/server/integration/nordpool";
import { TRPCError } from "@trpc/server";

const zodDay = z.custom<Dayjs>((val: unknown) => dayjs(val as string).isValid(), 'Invalid date');
const zodTimePeriod = z.nativeEnum(TimePeriod);

export const spotPriceRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ timePeriod: zodTimePeriod, startTime: zodDay, endTime: zodDay }))
    .query(({ input, ctx }) => {

      switch (input.timePeriod) {
        case TimePeriod.Hour:
          return getHourlySpotPrices(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate()).then((prices) => {
            return spotPricesToResponse(input.timePeriod, prices);
          });
        case TimePeriod.Day:
          return getDailySpotPrices(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate()).then((prices) => {
            return spotPricesToResponse(input.timePeriod, prices);
          });
        case TimePeriod.Month:
          return getMonthlySpotPrices(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate()).then((prices) => {
            return spotPricesToResponse(input.timePeriod, prices);
          });
        case TimePeriod.Year:
          return getYearlySpotPrices(ctx, dayjs(input.startTime).toDate(), dayjs(input.endTime).toDate()).then((prices) => {
            return spotPricesToResponse(input.timePeriod, prices);
          });
        default:
          return Promise.reject("Not implemented");
      }
    }),
  update: protectedProcedure
    .input(z.object({ timePeriod: zodTimePeriod, startTime: zodDay, endTime: zodDay }))
    .mutation(async ({ input, ctx }) => {
      // Attempt updating from ENTSO-E first
      const entsoeResult = await updateFromEntsoe({ startDate: input.startTime, endDate: input.endTime });
      console.info('ENTSO-E update result', entsoeResult)
      if (entsoeResult) {
        return "ok";
      }

      // Only update Nordpool hourly prices
      if (input.timePeriod === TimePeriod.Hour) {
        const nordpoolResult = await updateFromNordpool({ startDate: input.startTime, endDate: input.endTime });
        console.info('Nordpool update result', nordpoolResult)
        if (nordpoolResult) {
          return "ok";
        }
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unknown error occurred while updating',
      });
    }),
});

const getHourlySpotPrices = (ctx: IContext, startTime: Date, endTime: Date): Promise<ISpotPrice[]> => {
  return ctx.db.day_ahead_prices.findMany({
    orderBy: { time: "asc" },
    where: {
      time: {
        gte: startTime,
        lte: endTime,
      },
    },
  }).then((prices) => {
    return prices.map((price) => {
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

const spotPricesToResponse = (timePeriod: TimePeriod, prices: ISpotPrice[]): ISpotPriceResponse => {
  if (!prices.length) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'No prices found for the given time period',
    });
  }

  const summary = {
    cheapest: prices.reduce((prev, curr) => {
      return prev.price < curr.price ? prev : curr;
    }),
    mostExpensive: prices.reduce((prev, curr) => {
      return prev.price > curr.price ? prev : curr;
    }),
    average: {
      time: undefined,
      currency: "EUR",
      price: parseFloat((prices.reduce((prev, curr) => {
        return prev + curr.price;
      }, 0) / prices.length).toFixed(2)),
      price_with_tax: parseFloat((prices.reduce((prev, curr) => {
        return prev + curr.price_with_tax;
      }, 0) / prices.length).toFixed(2)),
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
