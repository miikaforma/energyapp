CREATE TABLE electricity_observations (
    period_start TIMESTAMPTZ NOT NULL,
    metering_point_ean TEXT NOT NULL,
    resolution_duration TEXT NOT NULL,
    product_type TEXT NOT NULL,
    unit_type TEXT NOT NULL,
    reading_type TEXT NOT NULL,
    measurement_source TEXT,
    quantity FLOAT,
    quality TEXT,
    UNIQUE (period_start, metering_point_ean, resolution_duration, product_type, unit_type, reading_type)
);

SELECT CREATE_HYPERTABLE('electricity_observations', BY_RANGE('period_start'));
