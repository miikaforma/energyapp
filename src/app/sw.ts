/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { registerPushNotifications } from "./sw/push-notification-sw";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
    importScripts: [
        // If you are using Next.js versions older than 15.0.0, add the
        // `nextConfig` option to the `createSerwistRoute` call in `src/app/serwist/[path]/route.ts` so that Serwist can configure the service worker according to your options. Serwist 10 and newer will only support Next.js 15.0.0 and above.
        // "next.config.mjs",
    ]
});

// register modular handlers
registerPushNotifications(self);

serwist.addEventListeners();
