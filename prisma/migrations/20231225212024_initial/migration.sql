CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE; 

-- CreateTable
CREATE TABLE "day_ahead_prices" (
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL,
    "in_domain" TEXT NOT NULL,
    "out_domain" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "measure_unit" VARCHAR(3) NOT NULL,
    "source" TEXT,
    "tax_percentage" REAL NOT NULL DEFAULT 24
);

-- CreateTable
CREATE TABLE "energies" (
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metering_point_code" TEXT NOT NULL,
    "measure_type" INTEGER NOT NULL,
    "contract_type" SMALLINT NOT NULL,
    "source" TEXT,
    "measure_unit" VARCHAR(3) NOT NULL,
    "value" REAL,
    "energy_basic_fee" REAL,
    "energy_fee" REAL,
    "energy_margin" REAL,
    "transfer_basic_fee" REAL,
    "transfer_fee" REAL,
    "transfer_tax_fee" REAL,
    "tax_percentage" REAL NOT NULL DEFAULT 24,
    "night" BOOLEAN NOT NULL DEFAULT false,
    "spot_price" REAL
);

-- CreateIndex
CREATE INDEX "day_ahead_prices_time_idx" ON "day_ahead_prices"("time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "day_ahead_prices_time_in_domain_out_domain_key" ON "day_ahead_prices"("time", "in_domain", "out_domain");

-- CreateIndex
CREATE INDEX "energies_time_idx" ON "energies"("time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "energies_time_metering_point_code_measure_type_key" ON "energies"("time", "metering_point_code", "measure_type");

SELECT CREATE_HYPERTABLE('day_ahead_prices', BY_RANGE('time'));

SELECT CREATE_HYPERTABLE('energies', BY_RANGE('time'));
