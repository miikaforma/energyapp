import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@energyapp/server/api/trpc";
import dayjs, { type Dayjs } from "dayjs";
import {
  type IContext,
} from "@energyapp/shared/interfaces";
import { TimePeriod } from "@energyapp/shared/enums";
import { TRPCError } from "@trpc/server";
import { Prisma, ruuvi_measurements } from "@energyapp/generated/client";
import { accountingPointType } from "@energyapp/generated/enums";

export type DatePickerRange = {
  min?: Dayjs;
  max?: Dayjs;
};

const zodDay = z.custom<Dayjs>(
  (val: unknown) => dayjs(val as string).isValid(),
  "Invalid date",
);
const zodTimePeriod = z.nativeEnum(TimePeriod);

const getMeteringPoints = async (ctx: IContext) => {
  const userAccesses = await ctx.db.userAccess.findMany({
    where: {
      userId: ctx.session?.user?.id ?? "",
      type: "METERING_POINT",
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

  const meteringPoints = await ctx.db.meteringPoint.findMany({
    where: {
      metering_point_ean: {
        in: userAccesses.map((ua) => ua.accessId),
      },
    },
  });

  return meteringPoints;
};

const getMeteringPoint = async (ctx: IContext, id: string) => {
  const meteringPointAccess = await ctx.db.serviceAccess.findFirst({
    where: {
      accessId: id,
      userAccesses: {
        some: {
          userId: ctx.session?.user?.id ?? "",
          type: "METERING_POINT",
        },
      },
    },
    select: {
      accessId: true,
      accessName: true,
      customData: true,
    },
  });

  const meteringPoint = await ctx.db.meteringPoint.findUnique({
    where: { metering_point_ean: meteringPointAccess?.accessId },
  });

  if (!meteringPoint) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Metering point not found or you don't have access to it",
    });
  }

  return meteringPoint;
};

const getMeteringPointAccess = async (ctx: IContext, meteringPointId: string) => {
  const meteringPointAccess = await ctx.db.serviceAccess.findFirst({
    where: {
      accessId: meteringPointId,
      userAccesses: {
        some: {
          type: "METERING_POINT",
        },
      },
    },
    select: { accessId: true, userAccesses: { where: { userId: ctx.session?.user?.id ?? "" } } },
  });


  return meteringPointAccess;
};

const checkMeteringPointAccess = async (ctx: IContext, meteringPointId: string) => {
  const meteringPointAccess = await ctx.db.serviceAccess.findFirst({
    where: {
      accessId: meteringPointId,
      userAccesses: {
        some: {
          userId: ctx.session?.user?.id ?? "",
          type: "METERING_POINT",
        },
      },
    },
    select: { accessId: true },
  });
  if (!meteringPointAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this metering point",
    });
  }
  return meteringPointAccess;
};

export const contractRouter = createTRPCRouter({
  getMeteringPoints: protectedProcedure.query(async ({ ctx }) => {
    const meteringPoints = await getMeteringPoints(ctx);
    return meteringPoints;
  }),
  getMeteringPoint: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const meteringPoint = await getMeteringPoint(ctx, input.id);
      return meteringPoint;
    }),

  getContracts: protectedProcedure
    .input(z.object({ metering_point_ean: z.string() }))
    .query(async ({ input, ctx }) => {
      // Permission check
      await checkMeteringPointAccess(ctx, input.metering_point_ean);
      const contracts = await ctx.db.contracts.findMany({
        where: { metering_point_ean: input.metering_point_ean },
        orderBy: { start_date: "desc" },
      });
      return contracts;
    }),

  getContract: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Find contract to get metering_point_ean for permission check
      const contract = await ctx.db.contracts.findUnique({
        where: { id: input.contractId },
      });
      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      await checkMeteringPointAccess(ctx, contract.metering_point_ean);
      return contract;
    }),
    
  // Add or edit a metering point
  upsertMeteringPoint: protectedProcedure
    .input(
      z.object({
        metering_point_ean: z.string(),
        type: z.nativeEnum(accountingPointType),
        street_name: z.string().optional(),
        building_number: z.string().optional(),
        postal_code: z.string().optional(),
        post_office: z.string().optional(),
        start_date: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { metering_point_ean, type, street_name, building_number, postal_code, post_office, start_date } = input;
      // Check if metering point exists
      const existing = await ctx.db.meteringPoint.findUnique({
        where: { metering_point_ean },
      });

      // Ensure serviceAccess exists for this metering point
      await ctx.db.serviceAccess.upsert({
        where: { accessId: metering_point_ean },
        update: {
          accessName: street_name || metering_point_ean,
          type: 'METERING_POINT',
        },
        create: {
          accessId: metering_point_ean,
          accessName: street_name || metering_point_ean,
          type: 'METERING_POINT',
        },
      });

      if (existing) {
        // Permission check
        const meteringPointAccess = await getMeteringPointAccess(ctx, metering_point_ean);

        if (!meteringPointAccess) {
          // Add user access for creator if no access exists (e.g. if serviceAccess was just created)
          await ctx.db.userAccess.create({
            data: {
              accessId: metering_point_ean,
              type: "METERING_POINT",
              userId: ctx.session?.user?.id ?? "",
            },
          });
        }
        else {
          // Ensure user has access to update this metering point
          const hasAccess = meteringPointAccess.userAccesses.some(ua => ua.userId === ctx.session?.user?.id);
          if (!hasAccess) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have access to update this metering point",
            });
          }
        }

        // Update
        await ctx.db.meteringPoint.update({
          where: { metering_point_ean },
          data: {
            type,
            street_name,
            building_number,
            postal_code,
            post_office,
            start_date: start_date ? new Date(start_date) : undefined,
          },
        });
      } else {
        // Create metering point
        await ctx.db.meteringPoint.create({
          data: {
            metering_point_ean,
            type,
            street_name,
            building_number,
            postal_code,
            post_office,
            start_date: start_date ? new Date(start_date) : undefined,
          },
        });
        // Add user access for creator
        await ctx.db.userAccess.create({
          data: {
            accessId: metering_point_ean,
            type: "METERING_POINT",
            userId: ctx.session?.user?.id ?? "",
          },
        });
      }
      return { success: true };
    }),

  // Add or edit a contract
  upsertContract: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        metering_point_ean: z.string(),
        contract_type: z.number(),
        start_date: z.string(),
        end_date: z.string().optional(),
        night_start_hour: z.number().optional(),
        night_end_hour: z.number().optional(),
        basic_fee: z.number(),
        day_fee: z.number().optional(),
        night_fee: z.number().optional(),
        margin: z.number().optional(),
        negative_no_tax: z.boolean().optional(),
        night_start_hour_transfer: z.number().optional(),
        night_end_hour_transfer: z.number().optional(),
        basic_fee_transfer: z.number(),
        day_fee_transfer: z.number(),
        night_fee_transfer: z.number(),
        tax_fee_transfer: z.number(),
        negative_no_tax_transfer: z.boolean().optional(),
        tax_percentage: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Permission check for metering point
      await checkMeteringPointAccess(ctx, input.metering_point_ean);
      if (input.id) {
        // Update contract
        // Get the current contract before update
        const currentContract = await ctx.db.contracts.findUnique({
          where: { id: input.id },
        });
        // If start_date is changing, update the previous contract's end_date
        if (currentContract && dayjs(currentContract.start_date).toISOString() !== dayjs(input.start_date).toISOString()) {
          // Find the previous contract (the one that ends where this one starts)
          const previousContract = await ctx.db.contracts.findFirst({
            where: {
              metering_point_ean: input.metering_point_ean,
              end_date: dayjs(currentContract.start_date).subtract(1, 'second').toDate(),
              id: { not: input.id },
            },
            orderBy: { start_date: 'desc' },
          });
          if (previousContract) {
            const newPrevEnd = dayjs(input.start_date).subtract(1, 'second').toDate();
            await ctx.db.contracts.update({
              where: { id: previousContract.id },
              data: { end_date: newPrevEnd },
            });
          }
        }
        await ctx.db.contracts.update({
          where: { id: input.id },
          data: {
            ...input,
            start_date: new Date(input.start_date),
            end_date: input.end_date ? new Date(input.end_date) : undefined,
          },
        });
      } else {
        // Create contract
        // Find the latest contract for this metering point (open-ended)
        const latestContract = await ctx.db.contracts.findFirst({
          where: {
            metering_point_ean: input.metering_point_ean,
            end_date: null,
          },
          orderBy: { start_date: 'desc' },
        });
        // If found, set its end_date to one second before the new contract's start_date
        if (latestContract) {
          const prevEnd = dayjs(input.start_date).subtract(1, 'second').toDate();
          await ctx.db.contracts.update({
            where: { id: latestContract.id },
            data: { end_date: prevEnd },
          });
        }
        await ctx.db.contracts.create({
          data: {
            ...input,
            start_date: new Date(input.start_date),
            end_date: input.end_date ? new Date(input.end_date) : undefined,
          },
        });
      }
      return { success: true };
    }),

  // Delete a metering point (and all contracts, userAccess, etc. by cascade)
  deleteMeteringPoint: protectedProcedure
    .input(z.object({ metering_point_ean: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Permission check
      await checkMeteringPointAccess(ctx, input.metering_point_ean);
      await ctx.db.meteringPoint.delete({
        where: { metering_point_ean: input.metering_point_ean },
      });
      return { success: true };
    }),

  // Delete a contract
  deleteContract: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Find contract to get metering_point_ean for permission check
      const contract = await ctx.db.contracts.findUnique({
        where: { id: input.id },
      });
      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      await checkMeteringPointAccess(ctx, contract.metering_point_ean);

      await ctx.db.$transaction(async (tx) => {
        const previousContract = await tx.contracts.findFirst({
          where: {
            metering_point_ean: contract.metering_point_ean,
            start_date: { lt: contract.start_date },
          },
          orderBy: { start_date: "desc" },
        });

        const nextContract = await tx.contracts.findFirst({
          where: {
            metering_point_ean: contract.metering_point_ean,
            start_date: { gt: contract.start_date },
          },
          orderBy: { start_date: "asc" },
        });

        await tx.contracts.delete({
          where: { id: input.id },
        });

        if (previousContract) {
          const adjustedEndDate = nextContract
            ? dayjs(nextContract.start_date).subtract(1, "second").toDate()
            : null;

          await tx.contracts.update({
            where: { id: previousContract.id },
            data: { end_date: adjustedEndDate },
          });
        }
      });

      return { success: true };
    }),
});
