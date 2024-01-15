import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@energyapp/server/api/trpc";

const dateSchema = z.string().refine(value => !isNaN(Date.parse(value)), {
  message: "Invalid date format",
});

export const spotPriceRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ startTime: dateSchema, endTime: dateSchema }))
    .query(({ input, ctx }) => {
      return ctx.db.day_ahead_prices.findMany({
        orderBy: { time: "asc" },
        where: {
          time: {
            gte: new Date(input.startTime),
            lte: new Date(input.endTime)
          },
        },
      });
    }),

  // getLatest: protectedProcedure.query(({ ctx }) => {
  //   return ctx.db.post.findFirst({
  //     orderBy: { createdAt: "desc" },
  //     where: { createdBy: { id: ctx.session.user.id } },
  //   });
  // }),

  // getSecretMessage: protectedProcedure.query(() => {
  //   return "you can now see this secret message!";
  // }),
});
