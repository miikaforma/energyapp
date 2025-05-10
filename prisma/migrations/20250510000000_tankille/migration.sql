CREATE TABLE "tankille_gas_stations"
(
    "station_id" VARCHAR(24) NOT NULL,
    "name"      TEXT        NOT NULL,
    "chain"     TEXT NULL DEFAULT NULL,
    "brand"     TEXT NULL DEFAULT NULL,
    PRIMARY KEY ("station_id")
);

CREATE TABLE "tankille_gas_prices"
(
    "time"      TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "station_id" VARCHAR(24)   NOT NULL,
    "fuel"      VARCHAR(6)    NOT NULL,
    "price"     NUMERIC(4, 3) NOT NULL,
    UNIQUE ("time", "station_id", "fuel"),
    CONSTRAINT "FK_tankille_gas_prices_tankille_gas_stations" FOREIGN KEY ("station_id") REFERENCES "tankille_gas_stations" ("station_id") ON UPDATE CASCADE ON DELETE RESTRICT
);

SELECT CREATE_HYPERTABLE('tankille_gas_prices', BY_RANGE('time'));
