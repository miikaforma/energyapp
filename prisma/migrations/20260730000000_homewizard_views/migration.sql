-- Production HomeWizard continuous aggregates
--
-- For TimescaleDB 2.13+.
--
-- ISO 8601 duration names:
--   PT15M, PT1H, P1D, P1M, P1Y
--
-- Bucket alignment:
--   PT15M and PT1H use fixed UTC intervals. Europe/Helsinki has a whole-hour
--   UTC offset, so these still align with local quarter-hour/hour boundaries.
--   P1D, P1M and P1Y use Europe/Helsinki calendar boundaries and handle DST.
--

DROP MATERIALIZED VIEW IF EXISTS homewizard_pt15m CASCADE;
DROP MATERIALIZED VIEW IF EXISTS homewizard_pt1h CASCADE;
DROP MATERIALIZED VIEW IF EXISTS homewizard_p1d CASCADE;
DROP MATERIALIZED VIEW IF EXISTS homewizard_p1m CASCADE;
DROP MATERIALIZED VIEW IF EXISTS homewizard_p1y CASCADE;

BEGIN;


CREATE MATERIALIZED VIEW homewizard_pt15m
WITH (
    timescaledb.continuous,
    timescaledb.materialized_only = false
)
AS
SELECT
    unique_id,
    time_bucket(INTERVAL '15 minutes', timestamp) AS bucket,

    last(energy_import_kwh, timestamp)
        - first(energy_import_kwh, timestamp) AS grid_import_kwh,

    last(energy_export_kwh, timestamp)
        - first(energy_export_kwh, timestamp) AS grid_export_kwh,

    AVG(power_w) AS power_avg_w,
    MIN(power_w) AS power_min_w,
    MAX(power_w) AS power_max_w,

    MAX(GREATEST(power_w, 0)) AS peak_import_power_w,
    MAX(GREATEST(-power_w, 0)) AS peak_export_power_w,

    AVG(power_l1_w) AS l1_power_avg_w,
    MIN(power_l1_w) AS l1_power_min_w,
    MAX(power_l1_w) AS l1_power_max_w,

    AVG(power_l2_w) AS l2_power_avg_w,
    MIN(power_l2_w) AS l2_power_min_w,
    MAX(power_l2_w) AS l2_power_max_w,

    AVG(power_l3_w) AS l3_power_avg_w,
    MIN(power_l3_w) AS l3_power_min_w,
    MAX(power_l3_w) AS l3_power_max_w,

    AVG(GREATEST(power_l1_w, 0))
        FILTER (WHERE power_l1_w IS NOT NULL)
        / 4000.0 AS l1_import_estimate_kwh,

    AVG(GREATEST(-power_l1_w, 0))
        FILTER (WHERE power_l1_w IS NOT NULL)
        / 4000.0 AS l1_export_estimate_kwh,

    AVG(GREATEST(power_l2_w, 0))
        FILTER (WHERE power_l2_w IS NOT NULL)
        / 4000.0 AS l2_import_estimate_kwh,

    AVG(GREATEST(-power_l2_w, 0))
        FILTER (WHERE power_l2_w IS NOT NULL)
        / 4000.0 AS l2_export_estimate_kwh,

    AVG(GREATEST(power_l3_w, 0))
        FILTER (WHERE power_l3_w IS NOT NULL)
        / 4000.0 AS l3_import_estimate_kwh,

    AVG(GREATEST(-power_l3_w, 0))
        FILTER (WHERE power_l3_w IS NOT NULL)
        / 4000.0 AS l3_export_estimate_kwh,

    AVG(voltage_l1_v) AS l1_voltage_avg_v,
    MIN(voltage_l1_v) AS l1_voltage_min_v,
    MAX(voltage_l1_v) AS l1_voltage_max_v,

    AVG(voltage_l2_v) AS l2_voltage_avg_v,
    MIN(voltage_l2_v) AS l2_voltage_min_v,
    MAX(voltage_l2_v) AS l2_voltage_max_v,

    AVG(voltage_l3_v) AS l3_voltage_avg_v,
    MIN(voltage_l3_v) AS l3_voltage_min_v,
    MAX(voltage_l3_v) AS l3_voltage_max_v,

    AVG(ABS(current_l1_a)) AS l1_current_avg_a,
    MAX(ABS(current_l1_a)) AS l1_current_max_a,

    AVG(ABS(current_l2_a)) AS l2_current_avg_a,
    MAX(ABS(current_l2_a)) AS l2_current_max_a,

    AVG(ABS(current_l3_a)) AS l3_current_avg_a,
    MAX(ABS(current_l3_a)) AS l3_current_max_a,

    AVG(frequency_hz) AS frequency_avg_hz,
    COUNT(*)::bigint AS sample_count
FROM homewizard_measurements
GROUP BY
    unique_id,
    time_bucket(INTERVAL '15 minutes', timestamp)
WITH NO DATA;


CREATE MATERIALIZED VIEW homewizard_pt1h
WITH (
    timescaledb.continuous,
    timescaledb.materialized_only = false
)
AS
SELECT
    unique_id,
    time_bucket(INTERVAL '1 hour', bucket) AS bucket,

    SUM(grid_import_kwh) AS grid_import_kwh,

    SUM(grid_export_kwh) AS grid_export_kwh,

    SUM(power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS power_avg_w,

    MIN(power_min_w) AS power_min_w,

    MAX(power_max_w) AS power_max_w,

    MAX(peak_import_power_w) AS peak_import_power_w,

    MAX(peak_export_power_w) AS peak_export_power_w,

    SUM(l1_power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l1_power_avg_w,

    MIN(l1_power_min_w) AS l1_power_min_w,

    MAX(l1_power_max_w) AS l1_power_max_w,

    SUM(l2_power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l2_power_avg_w,

    MIN(l2_power_min_w) AS l2_power_min_w,

    MAX(l2_power_max_w) AS l2_power_max_w,

    SUM(l3_power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l3_power_avg_w,

    MIN(l3_power_min_w) AS l3_power_min_w,

    MAX(l3_power_max_w) AS l3_power_max_w,

    SUM(l1_import_estimate_kwh) AS l1_import_estimate_kwh,

    SUM(l1_export_estimate_kwh) AS l1_export_estimate_kwh,

    SUM(l2_import_estimate_kwh) AS l2_import_estimate_kwh,

    SUM(l2_export_estimate_kwh) AS l2_export_estimate_kwh,

    SUM(l3_import_estimate_kwh) AS l3_import_estimate_kwh,

    SUM(l3_export_estimate_kwh) AS l3_export_estimate_kwh,

    SUM(l1_voltage_avg_v * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l1_voltage_avg_v,

    MIN(l1_voltage_min_v) AS l1_voltage_min_v,

    MAX(l1_voltage_max_v) AS l1_voltage_max_v,

    SUM(l2_voltage_avg_v * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l2_voltage_avg_v,

    MIN(l2_voltage_min_v) AS l2_voltage_min_v,

    MAX(l2_voltage_max_v) AS l2_voltage_max_v,

    SUM(l3_voltage_avg_v * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l3_voltage_avg_v,

    MIN(l3_voltage_min_v) AS l3_voltage_min_v,

    MAX(l3_voltage_max_v) AS l3_voltage_max_v,

    SUM(l1_current_avg_a * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l1_current_avg_a,

    MAX(l1_current_max_a) AS l1_current_max_a,

    SUM(l2_current_avg_a * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l2_current_avg_a,

    MAX(l2_current_max_a) AS l2_current_max_a,

    SUM(l3_current_avg_a * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l3_current_avg_a,

    MAX(l3_current_max_a) AS l3_current_max_a,

    SUM(frequency_avg_hz * sample_count)
        / NULLIF(SUM(sample_count), 0) AS frequency_avg_hz,

    SUM(sample_count)::bigint AS sample_count
FROM homewizard_pt15m
GROUP BY
    unique_id,
    time_bucket(INTERVAL '1 hour', bucket)
WITH NO DATA;


CREATE MATERIALIZED VIEW homewizard_p1d
WITH (
    timescaledb.continuous,
    timescaledb.materialized_only = false
)
AS
SELECT
    unique_id,
    time_bucket(INTERVAL '1 day', bucket, timezone => 'Europe/Helsinki') AS bucket,

    SUM(grid_import_kwh) AS grid_import_kwh,

    SUM(grid_export_kwh) AS grid_export_kwh,

    SUM(power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS power_avg_w,

    MIN(power_min_w) AS power_min_w,

    MAX(power_max_w) AS power_max_w,

    MAX(peak_import_power_w) AS peak_import_power_w,

    MAX(peak_export_power_w) AS peak_export_power_w,

    SUM(l1_power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l1_power_avg_w,

    MIN(l1_power_min_w) AS l1_power_min_w,

    MAX(l1_power_max_w) AS l1_power_max_w,

    SUM(l2_power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l2_power_avg_w,

    MIN(l2_power_min_w) AS l2_power_min_w,

    MAX(l2_power_max_w) AS l2_power_max_w,

    SUM(l3_power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l3_power_avg_w,

    MIN(l3_power_min_w) AS l3_power_min_w,

    MAX(l3_power_max_w) AS l3_power_max_w,

    SUM(l1_import_estimate_kwh) AS l1_import_estimate_kwh,

    SUM(l1_export_estimate_kwh) AS l1_export_estimate_kwh,

    SUM(l2_import_estimate_kwh) AS l2_import_estimate_kwh,

    SUM(l2_export_estimate_kwh) AS l2_export_estimate_kwh,

    SUM(l3_import_estimate_kwh) AS l3_import_estimate_kwh,

    SUM(l3_export_estimate_kwh) AS l3_export_estimate_kwh,

    SUM(l1_voltage_avg_v * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l1_voltage_avg_v,

    MIN(l1_voltage_min_v) AS l1_voltage_min_v,

    MAX(l1_voltage_max_v) AS l1_voltage_max_v,

    SUM(l2_voltage_avg_v * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l2_voltage_avg_v,

    MIN(l2_voltage_min_v) AS l2_voltage_min_v,

    MAX(l2_voltage_max_v) AS l2_voltage_max_v,

    SUM(l3_voltage_avg_v * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l3_voltage_avg_v,

    MIN(l3_voltage_min_v) AS l3_voltage_min_v,

    MAX(l3_voltage_max_v) AS l3_voltage_max_v,

    SUM(l1_current_avg_a * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l1_current_avg_a,

    MAX(l1_current_max_a) AS l1_current_max_a,

    SUM(l2_current_avg_a * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l2_current_avg_a,

    MAX(l2_current_max_a) AS l2_current_max_a,

    SUM(l3_current_avg_a * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l3_current_avg_a,

    MAX(l3_current_max_a) AS l3_current_max_a,

    SUM(frequency_avg_hz * sample_count)
        / NULLIF(SUM(sample_count), 0) AS frequency_avg_hz,

    SUM(sample_count)::bigint AS sample_count
FROM homewizard_pt1h
GROUP BY
    unique_id,
    time_bucket(INTERVAL '1 day', bucket, timezone => 'Europe/Helsinki')
WITH NO DATA;


CREATE MATERIALIZED VIEW homewizard_p1m
WITH (
    timescaledb.continuous,
    timescaledb.materialized_only = false
)
AS
SELECT
    unique_id,
    time_bucket(INTERVAL '1 month', bucket, timezone => 'Europe/Helsinki') AS bucket,

    SUM(grid_import_kwh) AS grid_import_kwh,

    SUM(grid_export_kwh) AS grid_export_kwh,

    SUM(power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS power_avg_w,

    MIN(power_min_w) AS power_min_w,

    MAX(power_max_w) AS power_max_w,

    MAX(peak_import_power_w) AS peak_import_power_w,

    MAX(peak_export_power_w) AS peak_export_power_w,

    SUM(l1_power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l1_power_avg_w,

    MIN(l1_power_min_w) AS l1_power_min_w,

    MAX(l1_power_max_w) AS l1_power_max_w,

    SUM(l2_power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l2_power_avg_w,

    MIN(l2_power_min_w) AS l2_power_min_w,

    MAX(l2_power_max_w) AS l2_power_max_w,

    SUM(l3_power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l3_power_avg_w,

    MIN(l3_power_min_w) AS l3_power_min_w,

    MAX(l3_power_max_w) AS l3_power_max_w,

    SUM(l1_import_estimate_kwh) AS l1_import_estimate_kwh,

    SUM(l1_export_estimate_kwh) AS l1_export_estimate_kwh,

    SUM(l2_import_estimate_kwh) AS l2_import_estimate_kwh,

    SUM(l2_export_estimate_kwh) AS l2_export_estimate_kwh,

    SUM(l3_import_estimate_kwh) AS l3_import_estimate_kwh,

    SUM(l3_export_estimate_kwh) AS l3_export_estimate_kwh,

    SUM(l1_voltage_avg_v * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l1_voltage_avg_v,

    MIN(l1_voltage_min_v) AS l1_voltage_min_v,

    MAX(l1_voltage_max_v) AS l1_voltage_max_v,

    SUM(l2_voltage_avg_v * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l2_voltage_avg_v,

    MIN(l2_voltage_min_v) AS l2_voltage_min_v,

    MAX(l2_voltage_max_v) AS l2_voltage_max_v,

    SUM(l3_voltage_avg_v * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l3_voltage_avg_v,

    MIN(l3_voltage_min_v) AS l3_voltage_min_v,

    MAX(l3_voltage_max_v) AS l3_voltage_max_v,

    SUM(l1_current_avg_a * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l1_current_avg_a,

    MAX(l1_current_max_a) AS l1_current_max_a,

    SUM(l2_current_avg_a * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l2_current_avg_a,

    MAX(l2_current_max_a) AS l2_current_max_a,

    SUM(l3_current_avg_a * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l3_current_avg_a,

    MAX(l3_current_max_a) AS l3_current_max_a,

    SUM(frequency_avg_hz * sample_count)
        / NULLIF(SUM(sample_count), 0) AS frequency_avg_hz,

    SUM(sample_count)::bigint AS sample_count
FROM homewizard_p1d
GROUP BY
    unique_id,
    time_bucket(INTERVAL '1 month', bucket, timezone => 'Europe/Helsinki')
WITH NO DATA;


CREATE MATERIALIZED VIEW homewizard_p1y
WITH (
    timescaledb.continuous,
    timescaledb.materialized_only = false
)
AS
SELECT
    unique_id,
    time_bucket(INTERVAL '1 year', bucket, timezone => 'Europe/Helsinki') AS bucket,

    SUM(grid_import_kwh) AS grid_import_kwh,

    SUM(grid_export_kwh) AS grid_export_kwh,

    SUM(power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS power_avg_w,

    MIN(power_min_w) AS power_min_w,

    MAX(power_max_w) AS power_max_w,

    MAX(peak_import_power_w) AS peak_import_power_w,

    MAX(peak_export_power_w) AS peak_export_power_w,

    SUM(l1_power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l1_power_avg_w,

    MIN(l1_power_min_w) AS l1_power_min_w,

    MAX(l1_power_max_w) AS l1_power_max_w,

    SUM(l2_power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l2_power_avg_w,

    MIN(l2_power_min_w) AS l2_power_min_w,

    MAX(l2_power_max_w) AS l2_power_max_w,

    SUM(l3_power_avg_w * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l3_power_avg_w,

    MIN(l3_power_min_w) AS l3_power_min_w,

    MAX(l3_power_max_w) AS l3_power_max_w,

    SUM(l1_import_estimate_kwh) AS l1_import_estimate_kwh,

    SUM(l1_export_estimate_kwh) AS l1_export_estimate_kwh,

    SUM(l2_import_estimate_kwh) AS l2_import_estimate_kwh,

    SUM(l2_export_estimate_kwh) AS l2_export_estimate_kwh,

    SUM(l3_import_estimate_kwh) AS l3_import_estimate_kwh,

    SUM(l3_export_estimate_kwh) AS l3_export_estimate_kwh,

    SUM(l1_voltage_avg_v * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l1_voltage_avg_v,

    MIN(l1_voltage_min_v) AS l1_voltage_min_v,

    MAX(l1_voltage_max_v) AS l1_voltage_max_v,

    SUM(l2_voltage_avg_v * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l2_voltage_avg_v,

    MIN(l2_voltage_min_v) AS l2_voltage_min_v,

    MAX(l2_voltage_max_v) AS l2_voltage_max_v,

    SUM(l3_voltage_avg_v * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l3_voltage_avg_v,

    MIN(l3_voltage_min_v) AS l3_voltage_min_v,

    MAX(l3_voltage_max_v) AS l3_voltage_max_v,

    SUM(l1_current_avg_a * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l1_current_avg_a,

    MAX(l1_current_max_a) AS l1_current_max_a,

    SUM(l2_current_avg_a * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l2_current_avg_a,

    MAX(l2_current_max_a) AS l2_current_max_a,

    SUM(l3_current_avg_a * sample_count)
        / NULLIF(SUM(sample_count), 0) AS l3_current_avg_a,

    MAX(l3_current_max_a) AS l3_current_max_a,

    SUM(frequency_avg_hz * sample_count)
        / NULLIF(SUM(sample_count), 0) AS frequency_avg_hz,

    SUM(sample_count)::bigint AS sample_count
FROM homewizard_p1m
GROUP BY
    unique_id,
    time_bucket(INTERVAL '1 year', bucket, timezone => 'Europe/Helsinki')
WITH NO DATA;


COMMIT;

-- Refresh policies.
-- end_offset excludes the newest incomplete source bucket.

SELECT add_continuous_aggregate_policy(
    'homewizard_pt15m',
    start_offset      => INTERVAL '7 days',
    end_offset        => INTERVAL '15 minutes',
    schedule_interval => INTERVAL '5 minutes',
    if_not_exists     => true
);

SELECT add_continuous_aggregate_policy(
    'homewizard_pt1h',
    start_offset      => INTERVAL '30 days',
    end_offset        => INTERVAL '1 hour',
    schedule_interval => INTERVAL '15 minutes',
    if_not_exists     => true
);

SELECT add_continuous_aggregate_policy(
    'homewizard_p1d',
    start_offset      => INTERVAL '1 year',
    end_offset        => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists     => true
);

SELECT add_continuous_aggregate_policy(
    'homewizard_p1m',
    start_offset      => INTERVAL '5 years',
    end_offset        => INTERVAL '1 month',
    schedule_interval => INTERVAL '1 day',
    if_not_exists     => true
);

SELECT add_continuous_aggregate_policy(
    'homewizard_p1y',
    start_offset      => INTERVAL '20 years',
    end_offset        => INTERVAL '1 year',
    schedule_interval => INTERVAL '1 month',
    if_not_exists     => true
);

-- Initial historical backfill.
-- Refresh lower levels before the aggregates that depend on them.
-- Change NULL to a finite start timestamp if the raw history is very large.

CALL refresh_continuous_aggregate(
    'homewizard_pt15m',
    NULL,
    now() - INTERVAL '15 minutes'
);

CALL refresh_continuous_aggregate(
    'homewizard_pt1h',
    NULL,
    date_trunc('hour', now())
);

CALL refresh_continuous_aggregate(
    'homewizard_p1d',
    NULL,
    time_bucket(INTERVAL '1 day', now(), timezone => 'Europe/Helsinki')
);

CALL refresh_continuous_aggregate(
    'homewizard_p1m',
    NULL,
    time_bucket(INTERVAL '1 month', now(), timezone => 'Europe/Helsinki')
);

CALL refresh_continuous_aggregate(
    'homewizard_p1y',
    NULL,
    time_bucket(INTERVAL '1 year', now(), timezone => 'Europe/Helsinki')
);

-- Optional verification
SELECT
    view_name,
    materialized_only,
    compression_enabled
FROM timescaledb_information.continuous_aggregates
WHERE view_name IN (
    'homewizard_pt15m',
    'homewizard_pt1h',
    'homewizard_p1d',
    'homewizard_p1m',
    'homewizard_p1y'
)
ORDER BY view_name;