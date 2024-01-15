import { postRouter } from "@energyapp/server/api/routers/post";
import { createTRPCRouter } from "@energyapp/server/api/trpc";
import { spotPriceRouter } from "./routers/spotPrice";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  spotPrice: spotPriceRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
