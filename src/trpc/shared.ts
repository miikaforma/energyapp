import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";

import { type AppRouter } from "@energyapp/server/api/root";

export const transformer = superjson;

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function getUrl() {
  return getBaseUrl() + "/api/trpc";
}

export function getWsUrl(runtimeConfiguredUrl?: string, runtimeConfiguredPort?: string) {
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const configuredUrl = runtimeConfiguredUrl ?? process.env.NEXT_PUBLIC_TRPC_WS_URL;

    if (configuredUrl) {
      return configuredUrl;
    }

    const configuredPort = runtimeConfiguredPort ?? process.env.NEXT_PUBLIC_TRPC_WS_PORT ?? "3001";
    return `${protocol}://${window.location.hostname}:${configuredPort}`;
  }

  return runtimeConfiguredUrl ?? process.env.NEXT_PUBLIC_TRPC_WS_URL ?? "ws://127.0.0.1:3001";
}

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
