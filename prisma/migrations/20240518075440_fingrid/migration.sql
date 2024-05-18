CREATE TABLE fingrid_latest_data (
    dataset_id DOUBLE PRECISION PRIMARY KEY,
    modified_at_utc TIMESTAMP,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    UNIQUE (dataset_id)
);

CREATE TABLE fingrid_time_series_data (
    time TIMESTAMPTZ NOT NULL,
    dataset_id DOUBLE PRECISION NOT NULL,
    modified_at_utc TIMESTAMP,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    UNIQUE (time, dataset_id)
);

SELECT CREATE_HYPERTABLE('fingrid_time_series_data', BY_RANGE('time'));
