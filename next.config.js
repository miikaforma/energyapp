/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");
import withPWAInit from "@ducanh2912/next-pwa";

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

// Configuration object tells the next-pwa plugin 
const withPWA = withPWAInit({
    dest: "public", // Destination directory for the PWA files
    // disable: process.env.NODE_ENV === "development", // Disable PWA in development mode
    register: true, // Register the PWA service worker
});

export default withPWA(config);
