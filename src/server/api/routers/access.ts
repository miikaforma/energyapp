import {
  createTRPCRouter,
  protectedProcedure,
} from "@energyapp/server/api/trpc";

export const accessRouter = createTRPCRouter({
  getUserAccesses: protectedProcedure
    .query(async ({ input, ctx }) => {
      const userAccesses = await ctx.db.userAccess.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        select: {
          accessId: true,
          type: true,
          serviceAccess: {
            select: {
              accessName: true,
            },
          },
        },
      });

      // Map over userAccesses and restructure each object
      return userAccesses.map(userAccess => ({
        accessId: userAccess.accessId,
        type: userAccess.type,
        accessName: userAccess.serviceAccess.accessName,
      }));
    }),
});
