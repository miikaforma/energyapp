SELECT
  _materialized_hypertable_4.date,
  _materialized_hypertable_4.avg_price,
  _materialized_hypertable_4.avg_price_with_tax
FROM
  _timescaledb_internal._materialized_hypertable_4
ORDER BY
  _materialized_hypertable_4.date;