import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";

import { appRouter } from "@energyapp/server/api/root";
import { getSessionFromHeaders } from "@energyapp/server/auth";
import { db } from "@energyapp/server/db";

const port = Number(process.env.TRPC_WS_PORT ?? 3001);

const wss = new WebSocketServer({ port });

const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: async ({ req }) => {
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          headers.append(key, item);
        }
      } else if (typeof value === "string") {
        headers.set(key, value);
      }
    }

    const session = await getSessionFromHeaders(headers);

    return {
      db,
      session,
      headers,
    };
  },
});

console.log(`tRPC WebSocket server listening on ws://0.0.0.0:${port}`);

const shutdown = () => {
  handler.broadcastReconnectNotification();
  wss.close();
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);