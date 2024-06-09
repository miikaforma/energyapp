import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@energyapp/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const pushSubscriptionRouter = createTRPCRouter({
  addSubscription: protectedProcedure
    .input(z.object({ endpoint: z.string(), p256dh: z.string(), auth: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id

      const existingSubscription = await ctx.db.userPushSubscription.findFirst({
        where: {
          endpoint: input.endpoint,
          userId,
        },
      });

      if (existingSubscription) {
        return false;
      }

      const subscription = await ctx.db.userPushSubscription.create({
        data: {
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          userId,
          spotPrices: true,
        }
      });

      if (subscription) {
        return true;
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unknown error occurred while adding the subscription',
      });
    }),
});
