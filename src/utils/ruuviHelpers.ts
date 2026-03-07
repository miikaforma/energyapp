import { JsonValue } from "next-auth/adapters";
import { formatNumberToFI } from "./wattivahtiHelpers";
import { ruuvi_measurements } from "@energyapp/generated/client";

// Get humidity as a percentage string
export const getHumidityString = (value?: number | null) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }

  return formatNumberToFI(value, 2) + " %";
};

// Get air pressure as a string (converts from Pa to hPa)
export const getAirPressureString = (value?: number | null) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }

  return formatNumberToFI(value / 100, 2) + " hPa";
};

// Get temperature in Celsius
export const getTemperatureC = (value?: number) => {
  if (!value && value !== 0) {
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
  const AQI_MAX = 100;

  const PM25_MAX = 60;
  const PM25_MIN = 0;
  const PM25_SCALE = AQI_MAX / (PM25_MAX - PM25_MIN); // ≈ 1.6667

  const CO2_MAX = 2300;
  const CO2_MIN = 420;
  const CO2_SCALE = AQI_MAX / (CO2_MAX - CO2_MIN); // ≈ 0.05319

  const clamp = (x: number, lo: number, hi: number): number =>
    Math.min(Math.max(x, lo), hi);

  if (!measurement?.pm2_5 || !measurement?.co2) {
    return NaN;
  }

  const pm25 = clamp(measurement.pm2_5, PM25_MIN, PM25_MAX);
  const co2 = clamp(measurement.co2, CO2_MIN, CO2_MAX);

  const dx = (pm25 - PM25_MIN) * PM25_SCALE; // 0..100
  const dy = (co2 - CO2_MIN) * CO2_SCALE; // 0..100

  const r = Math.hypot(dx, dy); // sqrt(dx*dx + dy*dy)
  return clamp(AQI_MAX - r, 0, AQI_MAX);
};

// Get CO2 as a ppm string
export const getCO2String = (value?: number | null) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }

  return value + " ppm";
};

// Get PM2.5 as a µg/m³ string
export const getPM25String = (value?: number | null) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }

  return value + " µg/m³";
};

// Get VOC index as a string
export const getVocIndexString = (value?: number | null) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }

  return value;
};

// Get NOx index as a string
export const getNOxIndexString = (value?: number | null) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }

  return value;
};
