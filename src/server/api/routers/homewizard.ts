import { z } from "zod";
import { observable } from '@trpc/server/observable';
import { protectedProcedure, createTRPCRouter } from '../trpc';
import { notificationEmitter } from '../../homewizardListener';
import {
  type IContext,
} from "@energyapp/shared/interfaces";
import { TRPCError } from "@trpc/server";
import {
  type homewizard_measurements,
} from "@energyapp/generated/client";

const getFirstDevice = async (ctx: IContext) => {
  const userAccess = await ctx.db.userAccess.findFirst({
    where: {
      userId: ctx.session?.user?.id ?? "",
      type: "HOMEWIZARD",
    },
    orderBy: {
      serviceAccess: {
        accessName: "asc",
      },
    },
    select: {
      accessId: true,
      serviceAccess: {
        select: {
          accessName: true,
          customData: true,
        },
      },
    },
  });

  return userAccess;
};

const checkDeviceAccess = async (ctx: IContext, deviceId: string) => {
  const device = await ctx.db.serviceAccess.findFirst({
    where: {
      accessId: deviceId,
      userAccesses: {
        some: {
          userId: ctx.session?.user?.id ?? "",
          type: "HOMEWIZARD",
        },
      },
    },
    select: { accessId: true },
  });
  if (!device) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this device",
    });
  }
  return device;
};

export const homewizardRouter = createTRPCRouter({
  onNewMeasurement: protectedProcedure
    .input(z.object({ deviceId: z.string().optional() }).optional())
    .subscription(async ({ input, ctx }) => {
      console.log("Subscribing to Homewizard measurements with input", input);
      // Determine deviceId: use input.deviceId or fetch first device for user
      let deviceId = input?.deviceId;
      if (!deviceId) {
        const firstDevice = await getFirstDevice(ctx);
        if (!firstDevice) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No devices found for this user",
          });
        }

        deviceId = firstDevice.accessId;
      }
      else {
        await checkDeviceAccess(ctx, deviceId);
      }
      return observable<homewizard_measurements>((emit) => {
        const handler = (data: homewizard_measurements) => {
          // Only emit if deviceId matches (assume data.unique_id is the device id)
          if (!deviceId || data.unique_id === deviceId) {
            emit.next(data);
          }
        };
        notificationEmitter.on('homewizard_measurements_insert', handler);
        return () => notificationEmitter.off('homewizard_measurements_insert', handler);
      });
    }),
});
