SELECT
  _materialized_hypertable_51."time",
  _materialized_hypertable_51.metering_point_code,
  _materialized_hypertable_51.measure_type,
  _materialized_hypertable_51.contract_type,
  _materialized_hypertable_51.source,
  _materialized_hypertable_51.measure_unit,
  _materialized_hypertable_51.tax_percentage,
  _materialized_hypertable_51.night,
  _materialized_hypertable_51.spot_price,
  _materialized_hypertable_51.spot_price_tax,
  _materialized_hypertable_51.spot_price_with_tax,
  _materialized_hypertable_51.energy_basic_fee,
  _materialized_hypertable_51.transfer_basic_fee,
  _materialized_hypertable_51.energy_consumption,
  _materialized_hypertable_51.energy_consumption_night,
  _materialized_hypertable_51.energy_consumption_day,
  _materialized_hypertable_51.energy_consumption_avg,
  _materialized_hypertable_51.energy_fee,
  _materialized_hypertable_51.energy_fee_night,
  _materialized_hypertable_51.energy_fee_day,
  _materialized_hypertable_51.energy_fee_avg,
  _materialized_hypertable_51.energy_margin,
  _materialized_hypertable_51.energy_margin_night,
  _materialized_hypertable_51.energy_margin_day,
  _materialized_hypertable_51.energy_margin_avg,
  _materialized_hypertable_51.transfer_fee,
  _materialized_hypertable_51.transfer_fee_night,
  _materialized_hypertable_51.transfer_fee_day,
  _materialized_hypertable_51.transfer_fee_avg,
  _materialized_hypertable_51.transfer_tax_fee,
  _materialized_hypertable_51.transfer_tax_fee_night,
  _materialized_hypertable_51.transfer_tax_fee_day,
  _materialized_hypertable_51.transfer_tax_fee_avg,
  _materialized_hypertable_51.price,
  _materialized_hypertable_51.price_night,
  _materialized_hypertable_51.price_day,
  _materialized_hypertable_51.price_avg,
  _materialized_hypertable_51.energy_fee_spot_no_margin,
  _materialized_hypertable_51.price_spot_no_margin
FROM
  _timescaledb_internal._materialized_hypertable_51;