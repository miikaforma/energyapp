import {
  createTRPCRouter,
  protectedProcedure,
} from "@energyapp/server/api/trpc";
import dayjs, { type Dayjs } from "dayjs";
import { z } from "zod";

const zodDay = z.custom<Dayjs>(
  (val: unknown) => dayjs(val as string).isValid(),
  "Invalid date",
);

export const cbaseRouter = createTRPCRouter({
  getPvForecast: protectedProcedure
    .input(z.object({ startTime: zodDay, endTime: zodDay.optional() }))
    .query(async ({ input, ctx }) => {
      const whereClause: { time: { gte: Date; lte?: Date } } = {
        time: {
          gte: dayjs(input.startTime).toDate(),
        },
      };

      if (input.endTime) {
        whereClause.time.lte = dayjs(input.endTime).toDate();
      }

      return await ctx.db.cbase_pv_forecast
        .findMany({
          orderBy: { time: "asc" },
          where: whereClause,
        })
        .then((data) =>
          data.map((d) => ({
            ...d,
            time: dayjs(d.time).subtract(1, 'hour').toDate(),
          })),
        );
    }),
});
