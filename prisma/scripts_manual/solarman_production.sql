CREATE MATERIALIZED VIEW solarman_today_end_15m
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('15 minutes', "time") AS bucket,
  plant_id,
  device_id,
  last(solar_production_today, "time") AS end_val
FROM solarman_inverter_data
GROUP BY 1,2,3;

-- Refresh policy
SELECT add_continuous_aggregate_policy('solarman_today_end_15m',
  start_offset => INTERVAL '2 days',
  end_offset   => INTERVAL '5 minutes',
  schedule_interval => INTERVAL '5 minutes'
);

-- Production per 15m view
CREATE VIEW solarman_production_15m_live AS
WITH params AS (
  SELECT now() - interval '30 minutes' AS cutoff
),

-- A) materialized-ish: compute deltas from cagg end values (stable, fast)
cagg_prod AS (
  SELECT
    e.bucket,
    e.plant_id,
    e.device_id,
    CASE
      WHEN lag(e.end_val) OVER (PARTITION BY e.plant_id, e.device_id ORDER BY e.bucket) IS NULL THEN 0
      WHEN e.end_val < lag(e.end_val) OVER (PARTITION BY e.plant_id, e.device_id ORDER BY e.bucket) THEN e.end_val
      ELSE e.end_val - lag(e.end_val) OVER (PARTITION BY e.plant_id, e.device_id ORDER BY e.bucket)
    END AS production
  FROM solarman_today_end_15m e, params p
  WHERE e.bucket < p.cutoff
),

-- B) raw: recompute end values for the recent window and do the same delta logic
raw_end AS (
  SELECT
    time_bucket('15 minutes', d."time") AS bucket,
    d.plant_id,
    d.device_id,
    last(d.solar_production_today, d."time") AS end_val
  FROM solarman_inverter_data d, params p
  WHERE d."time" >= p.cutoff - interval '15 minutes'  -- include one bucket back for correct delta
  GROUP BY 1,2,3
),
raw_prod AS (
  SELECT
    r.bucket,
    r.plant_id,
    r.device_id,
    CASE
      WHEN lag(r.end_val) OVER (PARTITION BY r.plant_id, r.device_id ORDER BY r.bucket) IS NULL THEN 0
      WHEN r.end_val < lag(r.end_val) OVER (PARTITION BY r.plant_id, r.device_id ORDER BY r.bucket) THEN r.end_val
      ELSE r.end_val - lag(r.end_val) OVER (PARTITION BY r.plant_id, r.device_id ORDER BY r.bucket)
    END AS production
  FROM raw_end r, params p
  WHERE r.bucket >= p.cutoff
)

SELECT bucket AS "time", plant_id, device_id, production FROM cagg_prod
UNION ALL
SELECT bucket AS "time", plant_id, device_id, production FROM raw_prod;

--Fetch query
-- SELECT
--   time_bucket('1 month', "time") AS "time",
--   plant_id,
--   device_id,
--   sum(production) AS production
-- FROM solarman_production_15m_live
-- GROUP BY 1,2,3
-- ORDER BY 1,2,3;

-- Test aggregate manually
-- CALL refresh_continuous_aggregate(
--   'solarman_today_end_15m',
--   now() - interval '2 days',
--   now() - interval '5 minutes'
-- );