import { JsonValue } from "next-auth/adapters";
import { formatNumberToFI } from "./wattivahtiHelpers";

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
