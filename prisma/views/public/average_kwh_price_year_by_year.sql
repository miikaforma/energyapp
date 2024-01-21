SELECT
  _materialized_hypertable_6.date,
  _materialized_hypertable_6.avg_price,
  _materialized_hypertable_6.avg_price_with_tax
FROM
  _timescaledb_internal._materialized_hypertable_6
ORDER BY
  _materialized_hypertable_6.date;