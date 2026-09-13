CREATE TABLE homewizard_measurements (
   unique_id TEXT,
   protocol_version DOUBLE PRECISION,
   meter_model TEXT,
   timestamp TIMESTAMPTZ NOT NULL,
   tariff DOUBLE PRECISION,
   energy_import_kwh DOUBLE PRECISION,
   energy_import_t1_kwh DOUBLE PRECISION,
   energy_import_t2_kwh DOUBLE PRECISION,
   energy_import_t3_kwh DOUBLE PRECISION,
   energy_import_t4_kwh DOUBLE PRECISION,
   energy_export_kwh DOUBLE PRECISION,
   energy_export_t1_kwh DOUBLE PRECISION,
   energy_export_t2_kwh DOUBLE PRECISION,
   energy_export_t3_kwh DOUBLE PRECISION,
   energy_export_t4_kwh DOUBLE PRECISION,
   power_w DOUBLE PRECISION,
   power_l1_w DOUBLE PRECISION,
   power_l2_w DOUBLE PRECISION,
   power_l3_w DOUBLE PRECISION,
   voltage_v DOUBLE PRECISION,
   voltage_l1_v DOUBLE PRECISION,
   voltage_l2_v DOUBLE PRECISION,
   voltage_l3_v DOUBLE PRECISION,
   current_a DOUBLE PRECISION,
   current_l1_a DOUBLE PRECISION,
   current_l2_a DOUBLE PRECISION,
   current_l3_a DOUBLE PRECISION,
   frequency_hz DOUBLE PRECISION,
   voltage_sag_l1_count DOUBLE PRECISION,
   voltage_sag_l2_count DOUBLE PRECISION,
   voltage_sag_l3_count DOUBLE PRECISION,
   voltage_swell_l1_count DOUBLE PRECISION,
   voltage_swell_l2_count DOUBLE PRECISION,
   voltage_swell_l3_count DOUBLE PRECISION,
   any_power_fail_count DOUBLE PRECISION,
   long_power_fail_count DOUBLE PRECISION,
   average_power_15m_w DOUBLE PRECISION,
   monthly_power_peak_w DOUBLE PRECISION,
   monthly_power_peak_timestamp TIMESTAMPTZ,
   UNIQUE (timestamp, unique_id)
);

SELECT create_hypertable('homewizard_measurements', 'timestamp');

-- Add a new access type for Homewizard devices
ALTER TYPE "accessType" ADD VALUE 'HOMEWIZARD';

-- Function: Notify when a new row is inserted into homewizard_measurements
CREATE OR REPLACE FUNCTION notify_homewizard_measurements_insert() RETURNS trigger AS $$
BEGIN
  -- Sends a notification with the new row as JSON
  PERFORM pg_notify('homewizard_measurements_insert', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Calls the above function after each insert
CREATE TRIGGER homewizard_measurements_insert_trigger
AFTER INSERT ON homewizard_measurements
FOR EACH ROW EXECUTE FUNCTION notify_homewizard_measurements_insert();
