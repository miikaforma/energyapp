-- CreateEnum
CREATE TYPE "accountingPointType" AS ENUM ('AG01', 'AG02');

-- CreateTable
CREATE TABLE "meteringPoint" (
    "metering_point_ean" TEXT NOT NULL,
    "type" "accountingPointType" NOT NULL,
    "street_name" TEXT,
    "building_number" TEXT,
    "postal_code" TEXT,
    "post_office" TEXT,
    "start_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meteringPoint_pkey" PRIMARY KEY ("metering_point_ean")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" SERIAL NOT NULL,
    "metering_point_ean" TEXT NOT NULL,
    "contract_type" SMALLINT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "night_start_hour" INTEGER DEFAULT 22,
    "night_end_hour" INTEGER DEFAULT 7,
    "basic_fee" REAL NOT NULL,
    "day_fee" REAL,
    "night_fee" REAL,
    "margin" REAL,
    "negative_no_tax" BOOLEAN DEFAULT false,
    "night_start_hour_transfer" INTEGER DEFAULT 22,
    "night_end_hour_transfer" INTEGER DEFAULT 7,
    "basic_fee_transfer" REAL NOT NULL,
    "day_fee_transfer" REAL NOT NULL,
    "night_fee_transfer" REAL NOT NULL,
    "tax_fee_transfer" REAL NOT NULL,
    "negative_no_tax_transfer" BOOLEAN DEFAULT false,
    "tax_percentage" REAL NOT NULL DEFAULT 25.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meteringPoint_metering_point_ean_idx" ON "meteringPoint"("metering_point_ean");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_metering_point_ean_fkey" FOREIGN KEY ("metering_point_ean") REFERENCES "meteringPoint"("metering_point_ean") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electricity_observations" ADD CONSTRAINT "electricity_observations_metering_point_ean_fkey" FOREIGN KEY ("metering_point_ean") REFERENCES "meteringPoint"("metering_point_ean") ON DELETE RESTRICT ON UPDATE CASCADE;
