import {
  createTRPCRouter,
  publicProcedure,
} from "@energyapp/server/api/trpc";
import { type fingrid_time_series_data, type fingrid_latest_data } from "@prisma/client";
import dayjs, { type Dayjs } from "dayjs";
import { z } from "zod";

const zodDay = z.custom<Dayjs>(
  (val: unknown) => dayjs(val as string).isValid(),
  "Invalid date",
);

export const fingridRouter = createTRPCRouter({
  getLatest: publicProcedure
    .input(z.object({ datasetIds: z.array(z.number()) }))
    .query(async ({ input, ctx }): Promise<fingrid_latest_data[]> => {
      return await ctx.db.fingrid_latest_data
        .findMany({
          where: {
            dataset_id: {
              in: input.datasetIds,
            },
          },
        });
    }),
  getDataset: publicProcedure
    .input(z.object({ datasetIds: z.array(z.number()), startTime: zodDay, endTime: zodDay.optional() }))
    .query(async ({ input, ctx }): Promise<fingrid_time_series_data[]> => {
      const whereClause: { dataset_id: { in: number[] }, time: { gte: Date; lte?: Date } } = {
        dataset_id: {
          in: input.datasetIds,
        },
        time: {
          gte: dayjs(input.startTime).toDate(),
        },
      };

      if (input.endTime) {
        whereClause.time.lte = dayjs(input.endTime).toDate();
      }

      return await ctx.db.fingrid_time_series_data
        .findMany({
          orderBy: { time: "asc" },
          where: whereClause,
        });
    }),
});
