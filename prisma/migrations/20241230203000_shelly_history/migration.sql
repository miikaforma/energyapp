CREATE TABLE shelly_historical_consumption_data (
    time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    device_id TEXT NOT NULL,
    energy_mw DOUBLE PRECISION,
	UNIQUE (time, device_id)
);

-- Make it a hypertable for TimescaleDB
SELECT CREATE_HYPERTABLE('shelly_historical_consumption_data', BY_RANGE('time'));


CREATE TABLE shelly_historical_data (
    time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    device_id TEXT NOT NULL,
    aenergy DOUBLE PRECISION,        -- Total consumption in Watts at the time of recording
    apower DOUBLE PRECISION,         -- Power in Watts at the time of recording
    voltage DOUBLE PRECISION,        -- Voltage at the time of recording
    temperature_c DOUBLE PRECISION,  -- Temperature in Celsius at the time of recording
    temperature_f DOUBLE PRECISION,  -- Temperature in Fahrenheit at the time of recording
    freq DOUBLE PRECISION,           -- Frequency in Hz at the time of recording
    current DOUBLE PRECISION,        -- Current in Amperes at the time of recording
	UNIQUE (time, device_id)
);

-- Make it a hypertable for TimescaleDB
SELECT CREATE_HYPERTABLE('shelly_historical_data', BY_RANGE('time'));

-- Add a new access type for Shelly devices
ALTER TYPE "accessType" ADD VALUE 'SHELLY';
