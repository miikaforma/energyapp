-- CreateTable
CREATE TABLE "melcloud_hourly_energy_consumption" (
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_id" INTEGER NOT NULL,
    "heating" REAL NOT NULL,
    "cooling" REAL NOT NULL,
    "auto" REAL NOT NULL,
    "dry" REAL NOT NULL,
    "fan" REAL NOT NULL,
    "other" REAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "melcloud_daily_energy_consumption" (
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_id" INTEGER NOT NULL,
    "heating" REAL NOT NULL,
    "cooling" REAL NOT NULL,
    "auto" REAL NOT NULL,
    "dry" REAL NOT NULL,
    "fan" REAL NOT NULL,
    "other" REAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "melcloud_hourly_energy_consumption_time_idx" ON "melcloud_hourly_energy_consumption"("time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "melcloud_hourly_energy_consumption_time_device_id_key" ON "melcloud_hourly_energy_consumption"("time", "device_id");

-- CreateIndex
CREATE INDEX "melcloud_daily_energy_consumption_time_idx" ON "melcloud_daily_energy_consumption"("time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "melcloud_daily_energy_consumption_time_device_id_key" ON "melcloud_daily_energy_consumption"("time", "device_id");
