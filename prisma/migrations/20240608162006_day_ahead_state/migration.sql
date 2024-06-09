/*
  Warnings:

  - You are about to drop the column `modified_at_utc` on the `fingrid_time_series_data` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "dayAheadState" AS ENUM ('Missing', 'Preliminary', 'Final', 'Cancelled');

-- AlterTable
ALTER TABLE "day_ahead_prices" ADD COLUMN     "state" "dayAheadState" NOT NULL DEFAULT 'Final';

-- AlterTable
ALTER TABLE "fingrid_time_series_data" DROP COLUMN "modified_at_utc";
