/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");
import { withSerwist } from "@serwist/turbopack";

/** @type {import("next").NextConfig} */

const config = {
    reactStrictMode: true, // Enable React strict mode for improved error handling
    // swcMinify: true,      // Removed for Next.js 16 compatibility
    compiler: {
        removeConsole: process.env.NODE_ENV !== "development" ? { exclude: ["error", "warn"] } : false,
    },
    output: "standalone", // Output PWA as a standalone app (no browser chrome)
    turbopack: {}, // Added for Next.js 16 to silence Turbopack/webpack warning
    allowedDevOrigins: ["localhost", "10.0.5.97"], // Allow localhost for development
};


export default withSerwist(config);
