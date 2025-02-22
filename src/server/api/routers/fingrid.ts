import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@energyapp/server/api/trpc";
import {
  recalculateWithContract,
  refreshContinuousAggregates,
  updateFromDatahub,
} from "@energyapp/server/integration/datahub";
import { TimePeriod } from "@energyapp/shared/enums";
import { type IContext } from "@energyapp/shared/interfaces";
import {
  type fingrid_time_series_data,
  type fingrid_latest_data,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import dayjs, { type Dayjs } from "dayjs";
import { z } from "zod";

const zodDay = z.custom<Dayjs>(
  (val: unknown) => dayjs(val as string).isValid(),
  "Invalid date",
);
const zodTimePeriod = z.nativeEnum(TimePeriod);

export const fingridRouter = createTRPCRouter({
  getLatest: publicProcedure
    .input(z.object({ datasetIds: z.array(z.number()) }))
    .query(async ({ input, ctx }): Promise<fingrid_latest_data[]> => {
      return await ctx.db.fingrid_latest_data.findMany({
        where: {
          dataset_id: {
            in: input.datasetIds,
          },
        },
      });
    }),
  getDataset: publicProcedure
    .input(
      z.object({
        datasetIds: z.array(z.number()),
        startTime: zodDay,
        endTime: zodDay.optional(),
      }),
    )
    .query(async ({ input, ctx }): Promise<fingrid_time_series_data[]> => {
      const whereClause: {
        dataset_id: { in: number[] };
        time: { gte: Date; lte?: Date };
      } = {
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

      return await ctx.db.fingrid_time_series_data.findMany({
        orderBy: { time: "asc" },
        where: whereClause,
      });
    }),
  updateDatahub: protectedProcedure
    .input(
      z.object({
        timePeriod: zodTimePeriod,
        startTime: zodDay,
        endTime: zodDay,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const meteringPoints = await ctx.db.meteringPoint.findMany();

      // Attempt updating from Datahub concurrently with PT1H
      const updatePromisesPT1H = meteringPoints.map((meteringPoint) =>
        updateFromDatahub({
          timePeriod: TimePeriod.PT1H,
          meteringPointEAN: meteringPoint.metering_point_ean,
          startDate: input.startTime,
          endDate: input.endTime,
        }),
      );

      const updateResultsPT1H = await Promise.all(updatePromisesPT1H);

      console.info("Datahub update results PT1H", updateResultsPT1H);

      // If all PT1H updates succeed, proceed with PT15M
      if (updateResultsPT1H.every((result) => result)) {
        const updatePromisesPT15M = meteringPoints.map((meteringPoint) =>
          updateFromDatahub({
            timePeriod: TimePeriod.PT15M,
            meteringPointEAN: meteringPoint.metering_point_ean,
            startDate: input.startTime,
            endDate: input.endTime,
          }),
        );

        const updateResultsPT15M = await Promise.all(updatePromisesPT15M);

        console.info("Datahub update results PT15M", updateResultsPT15M);

        if (updateResultsPT15M.every((result) => result)) {
          return _recalculateWithContract({
            startTime: dayjs(input.startTime),
            endTime: dayjs(input.endTime),
            ctx,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unknown error occurred while updating with PT15M",
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unknown error occurred while updating with PT1H",
      });
    }),
  recalculateWithContract: protectedProcedure
    .input(
      z.object({
        startTime: zodDay,
        endTime: zodDay,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return _recalculateWithContract({
        startTime: dayjs(input.startTime),
        endTime: dayjs(input.endTime),
        ctx,
      });
    }),
});

async function _recalculateWithContract({
  startTime,
  endTime,
  ctx,
}: {
  startTime: Dayjs;
  endTime: Dayjs;
  ctx: IContext;
}) {
  const meteringPoints = await ctx.db.meteringPoint.findMany();

  // Attempt recalculating from Datahub concurrently with PT1H
  const recalculatePromisesPT1H = meteringPoints.map((meteringPoint) =>
    recalculateWithContract({
      timePeriod: TimePeriod.PT1H,
      meteringPointEAN: meteringPoint.metering_point_ean,
      startDate: startTime,
      endDate: endTime,
    }),
  );

  const recalculateResultsPT1H = await Promise.all(recalculatePromisesPT1H);

  console.info("Datahub recalculate results PT1H", recalculateResultsPT1H);

  // If all PT1H recalculations succeed, proceed with PT15M
  if (recalculateResultsPT1H.every((result) => result)) {
    const recalculatePromisesPT15M = meteringPoints.map((meteringPoint) =>
      recalculateWithContract({
        timePeriod: TimePeriod.PT15M,
        meteringPointEAN: meteringPoint.metering_point_ean,
        startDate: startTime,
        endDate: endTime,
      }),
    );

    const recalculateResultsPT15M = await Promise.all(
      recalculatePromisesPT15M,
    );

    console.info(
      "Datahub recalculate results PT15M",
      recalculateResultsPT15M,
    );

    // Refresh continuous aggregates
    await refreshContinuousAggregates();

    if (recalculateResultsPT15M.every((result) => result)) {
      return "ok";
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unknown error occurred while recalculating with PT15M",
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unknown error occurred while recalculating with PT1H",
  });
}
