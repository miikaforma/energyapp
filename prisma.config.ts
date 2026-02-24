import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: env("DATABASE_URL"),
    // Uncomment if you use a shadow database:
    // shadowDatabaseUrl: env('SHADOW_DATABASE_URL'),
  },
});