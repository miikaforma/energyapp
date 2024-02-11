import { z } from "zod";
import { getEnergyReport } from "@energyapp/server/integration/melcloud";
import dayjs, { type Dayjs } from 'dayjs';

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@energyapp/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { info } from "console";
import { type IContext, type IUserAccess, type IUserAccessResponse } from "@energyapp/shared/interfaces";

const zodDay = z.custom<Dayjs>((val: unknown) => dayjs(val as string).isValid(), 'Invalid date');

async function hasDeviceAccess(ctx: IContext, deviceId: string) {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  }

  const access = await ctx.db.userAccess.findFirst({
    where: {
      accessId: deviceId,
      userId: ctx.session.user.id,
      type: 'MELCLOUD',
    },
    select: {
      accessId: true,
    }
  })

  if (!access) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Forbidden',
    });
  }
}

export const melcloudRouter = createTRPCRouter({
  getDevices: protectedProcedure
    .query(async ({ input, ctx }) => {
      const userAccesses = await ctx.db.userAccess.findMany({
        where: {
          userId: ctx.session.user.id,
          type: 'MELCLOUD',
        },
        select: {
          accessId: true,
          serviceAccess: {
            select: {
              accessName: true,
              availableFrom: true,
              availableTo: true,
            },
          },
        },
      })  as unknown as IUserAccess[];

      // Map over userAccesses and restructure each object
      return userAccesses.map(userAccess => ({
        accessId: userAccess.accessId,
        accessName: userAccess.serviceAccess.accessName,
        availableFrom: userAccess.serviceAccess.availableFrom,
        availableTo: userAccess.serviceAccess.availableTo,
      } as IUserAccessResponse));
    }),
  getConsumptions: protectedProcedure
    .input(z.object({ deviceId: z.string(), startTime: zodDay, endTime: zodDay }))
    .query(async ({ input, ctx }) => {
      // Check if the user has access to the device
      await hasDeviceAccess(ctx, input.deviceId);

      info(`Fetching energy report for ${input.deviceId} from ${dayjs(input.startTime).toISOString()} to ${dayjs(input.endTime).toISOString()}`);

      return getEnergyReport(input.deviceId, input.startTime, input.endTime);
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
