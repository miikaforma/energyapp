import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@energyapp/server/api/trpc";
import dayjs, { type Dayjs } from "dayjs";
import { type IContext } from "@energyapp/shared/interfaces";
import { type api } from "@energyapp/trpc/server";
// import { TRPCError } from "@trpc/server";

const zodDay = z.custom<Dayjs>(
  (val: unknown) => dayjs(val as string).isValid(),
  "Invalid date",
);

export type DatePickerRange = {
  min?: Dayjs;
  max?: Dayjs;
};

export type PriceHistory = Awaited<
  ReturnType<typeof api.tankille.getPriceHistory.query>
>[number];

export const tankilleRouter = createTRPCRouter({
  getStations: protectedProcedure
    .input(z.object({ startTime: zodDay, endTime: zodDay.optional() }))
    .query(async ({ input, ctx }) => {
      return getStations(
        ctx,
        dayjs(input.startTime).toDate(),
        input.endTime ? dayjs(input.endTime).toDate() : undefined,
      );
    }),
  getPriceHistory: protectedProcedure
    .input(z.object({ startTime: zodDay, endTime: zodDay }))
    .query(async ({ input, ctx }) => {
      const startTime = dayjs(input.startTime).toDate();
      const endTime = dayjs(input.endTime).toDate();

      const results = await ctx.db.tankille_gas_prices.findMany({
        where: {
          time: {
            gte: startTime,
            lte: endTime,
          },
        },
        include: {
          tankille_gas_stations: true,
        },
        orderBy: {
          time: "asc",
        },
      });

      return results;
    }),
  getRange: protectedProcedure.query(({ ctx }) => {
    return getRange(ctx);
  }),
  // update: protectedProcedure
  //   .input(z.object({ startTime: zodDay, endTime: zodDay }))
  //   .mutation(async ({ input }) => {
  //     const updateResult = await updateFromWattiVahti({ startDate: input.startTime, endDate: input.endTime });
  //     console.info('Update result', updateResult)
  //     if (updateResult) {
  //       return "ok";
  //     }

  //     throw new TRPCError({
  //       code: 'INTERNAL_SERVER_ERROR',
  //       message: 'An unknown error occurred while updating',
  //     });
  //   }),
});

const getStations = async (
  ctx: IContext,
  startTime: Date,
  endTime?: Date,
): Promise<
  {
    station_id: string;
    name: string;
    fuels: {
      fuel: string;
      price_volatility: number;
      price_max: number;
      price_min: number;
      time_max: Date;
      time_min: Date;
    }[];
  }[]
> => {
  if (!endTime) {
    endTime = dayjs().toDate();
  }

  // Fetch grouped data with station details
  const results = await ctx.db.$queryRaw<
    {
      station_id: string;
      name: string;
      fuel: string;
      price_max: number;
      price_min: number;
      time_max: Date;
      time_min: Date;
    }[]
  >`
  WITH price_data AS (
    SELECT
      gp.station_id,
      gs.name,
      gp.fuel,
      gp.price,
      gp.time,
      ROW_NUMBER() OVER (PARTITION BY gp.station_id, gp.fuel ORDER BY gp.price DESC) AS max_row,
      ROW_NUMBER() OVER (PARTITION BY gp.station_id, gp.fuel ORDER BY gp.price ASC) AS min_row
    FROM tankille_gas_prices AS gp
    INNER JOIN tankille_gas_stations AS gs
      ON gp.station_id = gs.station_id
    WHERE gp.time >= ${startTime} AND gp.time <= ${endTime}
  )
  SELECT
    pd.station_id,
    pd.name,
    pd.fuel,
    MAX(pd.price) AS price_max,
    MIN(pd.price) AS price_min,
    MAX(CASE WHEN pd.max_row = 1 THEN pd.time END) AS time_max,
    MAX(CASE WHEN pd.min_row = 1 THEN pd.time END) AS time_min
  FROM price_data AS pd
  GROUP BY pd.station_id, pd.fuel, pd.name
`;

  // Group results by station
  const stationMap = new Map<
    string,
    {
      station_id: string;
      name: string;
      fuels: {
        fuel: string;
        price_volatility: number;
        price_max: number;
        price_min: number;
        time_max: Date;
        time_min: Date;
      }[];
    }
  >();

  results.forEach((result) => {
    const station = stationMap.get(result.station_id);

    const fuelData = {
      fuel: result.fuel,
      price_volatility: result.price_max - result.price_min,
      price_max: Number(result.price_max),
      price_min: Number(result.price_min),
      time_max: result.time_max,
      time_min: result.time_min,
    };

    if (station) {
      station.fuels.push(fuelData);
      // Sort the fuels array alphabetically by fuel name
      station.fuels.sort((a, b) => a.fuel.localeCompare(b.fuel));
    } else {
      stationMap.set(result.station_id, {
        station_id: result.station_id,
        name: result.name,
        fuels: [fuelData],
      });
    }
  });

  // Convert the map to an array
  return Array.from(stationMap.values());
};

const getRange = async (ctx: IContext): Promise<DatePickerRange> => {
  const minMaxTime = await ctx.db.tankille_gas_prices.aggregate({
    _min: {
      time: true,
    },
    _max: {
      time: true,
    },
  });

  const minDate = dayjs(minMaxTime._min.time);
  const maxDate = dayjs(minMaxTime._max.time);

  return {
    min: minDate,
    max: maxDate,
  };
};
