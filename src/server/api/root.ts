import { accessRouter } from "@energyapp/server/api/routers/access";
import { createTRPCRouter } from "@energyapp/server/api/trpc";
import { spotPriceRouter } from "@energyapp/server/api/routers/spotPrice";
import { melcloudRouter } from "@energyapp/server/api/routers/melcloud";
import { wattivahtiRouter } from "@energyapp/server/api/routers/wattivahti";
import { cbaseRouter } from "@energyapp/server/api/routers/cbase";
import { solarmanRouter } from "@energyapp/server/api/routers/solarman";
import { fingridRouter } from "@energyapp/server/api/routers/fingrid";
import { pushSubscriptionRouter } from "@energyapp/server/api/routers/pushSubscription";
import { shellyRouter } from "@energyapp/server/api/routers/shelly";
import { tankilleRouter } from "@energyapp/server/api/routers/tankille";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  access: accessRouter,
  spotPrice: spotPriceRouter,
  melCloud: melcloudRouter,
  wattivahti: wattivahtiRouter,
  cbase: cbaseRouter,
  solarman: solarmanRouter,
  fingrid: fingridRouter,
  pushSubscription: pushSubscriptionRouter,
  shelly: shellyRouter,
  tankille: tankilleRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
