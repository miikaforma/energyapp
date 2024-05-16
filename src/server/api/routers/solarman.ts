import {
  createTRPCRouter,
  protectedProcedure,
} from "@energyapp/server/api/trpc";
import dayjs, { type Dayjs } from "dayjs";
import { z } from "zod";

import { type solarman_production_hour_by_hour } from "@prisma/client";


const zodDay = z.custom<Dayjs>(
  (val: unknown) => dayjs(val as string).isValid(),
  "Invalid date",
);

export const solarmanRouter = createTRPCRouter({
  getProductions: protectedProcedure
    .input(z.object({ startTime: zodDay, endTime: zodDay.optional() }))
    .query(async ({ input, ctx }): Promise<solarman_production_hour_by_hour[]> => {
      const whereClause: { time: { gte: Date; lte?: Date } } = {
        time: {
          gte: dayjs(input.startTime).toDate(),
        },
      };

      if (input.endTime) {
        whereClause.time.lte = dayjs(input.endTime).toDate();
      }

      await ctx.db.$executeRaw`REFRESH MATERIALIZED VIEW solarman_production_hour_by_hour`;

      return await ctx.db.solarman_production_hour_by_hour
        .findMany({
          orderBy: { time: "asc" },
          where: whereClause,
        })
    }),
});
