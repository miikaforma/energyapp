-- Run in local
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER prod_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (
  host 'host.docker.internal',
  port '16432',
  dbname 'electricity'
);

-- Run in production
CREATE USER remote_sync_reader WITH PASSWORD '<replaceWithYourPassword>';

GRANT CONNECT ON DATABASE electricity TO remote_sync_reader;
GRANT USAGE ON SCHEMA public TO remote_sync_reader;

GRANT SELECT ON TABLE public.electricity_observations TO remote_sync_reader;
GRANT SELECT ON TABLE public.energies TO remote_sync_reader;
GRANT SELECT ON TABLE public.ruuvi_measurements TO remote_sync_reader;
GRANT SELECT ON TABLE public.ruuvi_measurements_downsampled_5min TO remote_sync_reader;
GRANT SELECT ON TABLE public.ruuvi_measurements_downsampled_15min TO remote_sync_reader;
GRANT SELECT ON TABLE public.shelly_historical_consumption_data TO remote_sync_reader;
GRANT SELECT ON TABLE public.shelly_historical_data TO remote_sync_reader;
GRANT SELECT ON TABLE public.solarman_inverter_data TO remote_sync_reader;

-- Run in local
CREATE USER MAPPING FOR CURRENT_USER
SERVER prod_server
OPTIONS (
  user 'remote_sync_reader',
  password '<replaceWithYourPassword>'
);

CREATE SCHEMA IF NOT EXISTS prod_fdw;

IMPORT FOREIGN SCHEMA public
LIMIT TO (
  electricity_observations,
  energies,
  ruuvi_measurements,
  ruuvi_measurements_downsampled_5min,
  ruuvi_measurements_downsampled_15min,
  shelly_historical_consumption_data,
  shelly_historical_data,
  solarman_inverter_data
)
FROM SERVER prod_server
INTO prod_fdw;


-- Import data from remote
SET statement_timeout = 0;
INSERT INTO public.shelly_historical_data
SELECT *
FROM prod_fdw.shelly_historical_data
WHERE time >= '2026-03-01'
  AND time < '2026-03-19'
ON CONFLICT DO NOTHING;

SET statement_timeout = 0;
INSERT INTO public.shelly_historical_consumption_data
SELECT *
FROM prod_fdw.shelly_historical_consumption_data
WHERE time >= '2026-03-01'
  AND time < '2026-03-19'
ON CONFLICT DO NOTHING;

-- Once caught up, you can switch to incremental updates by using the latest timestamp in the local database as the starting point for the next import. For example:
INSERT INTO public.shelly_historical_data
SELECT *
FROM prod_fdw.shelly_historical_data p
WHERE p."time" > (
  SELECT COALESCE(MAX(l."time") - INTERVAL '1 day', '-infinity'::timestamptz)
  FROM public.shelly_historical_data l
)
ON CONFLICT ("time", "device_id") DO NOTHING;




-- If adding a new table in the future

-- Run in production
GRANT SELECT ON TABLE public.new_table TO remote_sync_reader;

-- Run in local
IMPORT FOREIGN SCHEMA public
LIMIT TO (new_table)
FROM SERVER prod_server
INTO prod_fdw;

-- In case of schema changes in the future, you can drop and re-import the affected table:
-- Run in local
DROP FOREIGN TABLE IF EXISTS prod_fdw.shelly_historical_data;
IMPORT FOREIGN SCHEMA public
LIMIT TO (shelly_historical_data)
FROM SERVER prod_server
INTO prod_fdw;

