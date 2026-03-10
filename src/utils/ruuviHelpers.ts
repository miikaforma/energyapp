import { JsonValue } from "next-auth/adapters";
import { formatNumberToFI } from "./wattivahtiHelpers";
import { ruuvi_measurements, ruuvi_measurements_downsampled_15min, ruuvi_measurements_downsampled_5min } from "@energyapp/generated/client";
import { TimePeriod } from "@energyapp/shared/enums";
import dayjs from "dayjs";
import type { IRuuviChartResponse } from "@energyapp/app/_components/Charts/ruuvi-chart";
import { isValueDefined } from "./valueHelpers";

// Get humidity as a percentage string
export const getHumidityString = (value?: number | null) => {
  if (!isValueDefined(value)) {
    return "Ei tiedossa";
  }

  return formatNumberToFI(value, 2) + " %";
};

// Get air pressure as a string (converts from Pa to hPa)
export const getAirPressureString = (value?: number | null) => {
  if (!isValueDefined(value)) {
    return "Ei tiedossa";
  }

  return formatNumberToFI(value / 100, 2) + " hPa";
};

// Get temperature in Celsius
export const getTemperatureC = (value?: number) => {
  if (!isValueDefined(value)) {
    return "Ei tiedossa";
  }
  return formatNumberToFI(value, 1) + " °C";
};

// Get picture URL from customData
export const getPictureUrl = (customData?: JsonValue | null) => {
  if (!customData) {
    return null;
  }

  try {
    return (customData as any).picture || null;
  } catch (error) {
    console.error("Error parsing customData:", error);
    return null;
  }
};

// https://docs.ruuvi.com/ruuvi-air-firmware/ruuvi-indoor-air-quality-score-iaqs
export const getIAQS = (measurement?: ruuvi_measurements | null) => {
  return getIAQSByValues(measurement?.co2, measurement?.pm2_5);
};

export const getIAQSByValues = (co2?: number | null, pm2_5?: number | null) => {
  const AQI_MAX = 100;

  const PM25_MAX = 60;
  const PM25_MIN = 0;
  const PM25_SCALE = AQI_MAX / (PM25_MAX - PM25_MIN); // ≈ 1.6667

  const CO2_MAX = 2300;
  const CO2_MIN = 420;
  const CO2_SCALE = AQI_MAX / (CO2_MAX - CO2_MIN); // ≈ 0.05319

  const clamp = (x: number, lo: number, hi: number): number =>
    Math.min(Math.max(x, lo), hi);

  if (!isValueDefined(pm2_5) || !isValueDefined(co2)) {
    return NaN;
  }

  const pm25 = clamp(pm2_5, PM25_MIN, PM25_MAX);
  const co2_clamped = clamp(co2, CO2_MIN, CO2_MAX);

  const dx = (pm25 - PM25_MIN) * PM25_SCALE; // 0..100
  const dy = (co2_clamped - CO2_MIN) * CO2_SCALE; // 0..100

  const r = Math.hypot(dx, dy); // sqrt(dx*dx + dy*dy)
  return clamp(AQI_MAX - r, 0, AQI_MAX);
};

// Get CO2 as a ppm string
export const getCO2String = (value?: number | null) => {
  if (!isValueDefined(value)) {
    return "Ei tiedossa";
  }

  return value + " ppm";
};

// Get PM2.5 as a µg/m³ string
export const getPM25String = (value?: number | null) => {
  if (!isValueDefined(value)) {
    return "Ei tiedossa";
  }

  return formatNumberToFI(value, 1) + " µg/m³";
};

// Get VOC index as a string
export const getVocIndexString = (value?: number | null) => {
  if (!isValueDefined(value)) {
    return "Ei tiedossa";
  }

  return value;
};

// Get NOx index as a string
export const getNOxIndexString = (value?: number | null) => {
  if (!isValueDefined(value)) {
    return "Ei tiedossa";
  }

  return value;
};

// Get battery status based on voltage and temperature
export function isBatteryLow(voltage: number, temperature: number): boolean {
  console.log(`Checking battery status with voltage: ${voltage} mV and temperature: ${temperature} °C`);
    if (temperature < -20) {
        return voltage < 2.000
    } else if (temperature < 0) {
        return voltage < 2.300
    } else {
        return voltage < 2.500
    }
}

// Transform downsampled ruuvi measurements to chart format
export const transformRuuviDataToChartResponse = (
  measurements: ruuvi_measurements_downsampled_15min[] | ruuvi_measurements_downsampled_5min[] | undefined,
  timePeriod: TimePeriod,
  deviceName?: string
): IRuuviChartResponse | undefined => {
  if (!measurements || measurements.length === 0) {
    return undefined;
  }

  const mac = measurements[0]?.mac ?? '';

  return {
    timePeriod,
    mac,
    deviceName,
    measurements: measurements.map((m) => ({
      time: dayjs(m.time),
      temperature: m.avg_temperature ?? null,
      humidity: m.avg_humidity ?? null,
      pressure: m.avg_pressure == null ? null : m.avg_pressure / 100, // Convert from Pa to hPa
      movement_counter: m.max_movement_counter ?? null,
      co2: m.avg_co2 ?? null,
      pm2_5: m.avg_pm2_5 ?? null,
      voc: m.avg_voc ? Math.round(m.avg_voc) : null,
      nox: m.avg_nox ? Math.round(m.avg_nox) : null,
    }))
  };
};
