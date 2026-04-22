import { EventEmitter } from "events";
import { Client } from "pg";
import { env } from "@energyapp/env";

// Singleton event emitter for app-wide notifications
export const notificationEmitter = new EventEmitter();

// Only start listener once (in dev, hot reload can cause multiple)
if (!globalThis.__homewizardListenerStarted) {
  globalThis.__homewizardListenerStarted = true;

  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL ?? env.DATABASE_URL,
  });

  pgClient.connect().then(() => {
    pgClient.query("LISTEN homewizard_measurements_insert");
    pgClient.on("notification", (msg) => {
      if (msg.channel === "homewizard_measurements_insert" && msg.payload) {
        try {
          const data = JSON.parse(msg.payload);
          notificationEmitter.emit("homewizard_measurements_insert", data);
        } catch (e) {
          // Optionally log error
        }
      }
    });
  });
}
