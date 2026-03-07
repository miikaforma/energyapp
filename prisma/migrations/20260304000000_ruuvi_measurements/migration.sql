-- Create enum type for measurement status
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'measurement_status') THEN
        CREATE TYPE measurement_status AS ENUM ('raw', 'downsampled');
    END IF;
END $$;

-- Create the ruuvi_measurements table in TimescaleDB
CREATE TABLE ruuvi_measurements (
    time TIMESTAMPTZ NOT NULL,
    mac TEXT NOT NULL,
    data_format TEXT,
    temperature REAL,
    humidity REAL,
    pressure REAL,
    acceleration_x REAL,
    acceleration_y REAL,
    acceleration_z REAL,
    movement_counter INTEGER,
    battery_voltage REAL,
    tx_power INTEGER,
    measurement_sequence_number INTEGER,
    rssi INTEGER,
    pm1_0 REAL,
    pm2_5 REAL,
    pm4_0 REAL,
    pm10_0 REAL,
    co2 REAL,
    voc INTEGER,
    nox INTEGER,
    luminosity REAL,
    flags INTEGER,
    status measurement_status DEFAULT 'raw',
    PRIMARY KEY (time, mac)
);

-- Indexes for ruuvi_measurements
CREATE INDEX idx_ruuvi_measurements_data_format ON ruuvi_measurements (data_format);
CREATE INDEX idx_ruuvi_measurements_status ON ruuvi_measurements (status);
CREATE INDEX ON ruuvi_measurements (status, time);
CREATE INDEX ON ruuvi_measurements (data_format, time);

-- Enable TimescaleDB hypertable functionality
SELECT create_hypertable('ruuvi_measurements', 'time');

-- Add a new access type for Ruuvi devices
ALTER TYPE "accessType" ADD VALUE 'RUUVI';
