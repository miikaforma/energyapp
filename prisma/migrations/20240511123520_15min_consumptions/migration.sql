ALTER TABLE "energies"
ADD COLUMN "resolution_duration" VARCHAR(10);

DROP INDEX IF EXISTS energies_time_metering_point_code_measure_type_key;

ALTER TABLE "energies"
ADD CONSTRAINT energies_unique_key UNIQUE (time, metering_point_code, measure_type, resolution_duration);

UPDATE "energies"
SET "resolution_duration" = 'PT1H'
WHERE "resolution_duration" IS NULL;

ALTER TABLE "energies"
ALTER COLUMN "resolution_duration" SET NOT NULL;
