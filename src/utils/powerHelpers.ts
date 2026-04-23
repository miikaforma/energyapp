import { isValueDefined } from "./valueHelpers";
import { formatNumberToFI } from "./wattivahtiHelpers";

export const kwhOrWattsString = (value?: number | null) => {
  if (!isValueDefined(value)) {
    return "N/A";
  }

  return Math.abs(value) > 1000
    ? formatNumberToFI(value / 1000) + " kWh"
    : formatNumberToFI(value) + " W";
};

export const kwhOrWattsShortString = (value?: number | null) => {
  if (!isValueDefined(value)) {
    return "N/A";
  }

  return Math.abs(value) > 1000
    ? formatNumberToFI(Math.abs(value) / 1000, 2, 2) + " kWh"
    : formatNumberToFI(Math.abs(value), 0, 0) + " W";
};

export const wattsString = (value?: number | null) => {
  if (!isValueDefined(value)) {
    return "N/A";
  }

  return Math.abs(value) + " W";
};

// Convert watts to kilowatts
export const convertWatts = (value?: number) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }

  return Math.abs(value) > 1000
    ? formatNumberToFI(value / 1000, 1) + " kW"
    : formatNumberToFI(value, 1) + " W";
};

// Convert milliwatts to watts or kilowatts
export const convertMilliwatts = (value?: number) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }

  return Math.abs(value) > 1000000
    ? formatNumberToFI(value / 1000000, 1) + " kW"
    : formatNumberToFI(value / 1000, 1) + " W";
};

// Convert voltage to volts or kilovolts
export const convertVoltage = (value?: number) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }

  return Math.abs(value) > 1000
    ? formatNumberToFI(value / 1000, 1) + " kV"
    : formatNumberToFI(value, 1) + " V";
};

// Convert frequency to hertz or kilohertz
export const convertFrequency = (value?: number) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }
  return Math.abs(value) > 1000
    ? formatNumberToFI(value / 1000, 1) + " kHz"
    : formatNumberToFI(value, 1) + " Hz";
};

// Get temperature in Celsius
export const getTemperatureC = (value?: number) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }
  return formatNumberToFI(value, 1) + " °C";
};

// Get temperature in Fahrenheit
export const getTemperatureF = (value?: number) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }
  return formatNumberToFI(value, 1) + " °F";
};

// Convert amps to milliamps or amps
export const convertAmps = (value?: number) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }
  return Math.abs(value) > 1000
    ? formatNumberToFI(value / 1000, 1) + " kA"
    : formatNumberToFI(value, 1) + " A";
};

// Returns a color string for Tag based on watts value
export function getTagColorForWatts(watts?: number | null): string {
  if (typeof watts !== "number" || isNaN(watts)) return "default";
  // Negative: exporting to grid
  if (watts < 0) {
    const abs = Math.abs(watts);
    if (abs < 1000) return "lime";
    if (abs < 3500) return "green";
    return "cyan";
  }
  // Positive: drawing from grid
  if (watts > 0) {
    if (watts < 1000) return "blue";
    if (watts < 2000) return "geekblue";
    return "purple";
  }
  // Zero or unknown
  return "default";
}

// Returns a color string for Tag based on watts value
export function getColorForTotalPower(watts?: number | null): string {
  if (typeof watts !== "number" || isNaN(watts)) return "default";

  // Negative: exporting to grid
  if (watts < 0) {
    return "cyan";
  }

  // Positive: drawing from grid
  if (watts > 0) {
    return "purple";
  }

  // Zero or unknown
  return "default";
}

