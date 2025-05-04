import { formatNumberToFI } from "./wattivahtiHelpers";

export const kwhOrWattsString = (value: number) => {
  return value > 1000
    ? formatNumberToFI(value / 1000) + " kWh"
    : formatNumberToFI(value) + " W";
};

// Convert watts to kilowatts
export const convertWatts = (value?: number) => {
  if (!value) {
    return "Ei tiedossa";
  }

  return value > 1000
    ? formatNumberToFI(value / 1000, 1) + " kW"
    : formatNumberToFI(value, 1) + " W";
};

// Convert milliwatts to watts or kilowatts
export const convertMilliwatts = (value?: number) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }

  return value > 1000000
    ? formatNumberToFI(value / 1000000, 1) + " kW"
    : formatNumberToFI(value / 1000, 1) + " W";
};

// Convert voltage to volts or kilovolts
export const convertVoltage = (value?: number) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }

  return value > 1000
    ? formatNumberToFI(value / 1000, 1) + " kV"
    : formatNumberToFI(value, 1) + " V";
};

// Convert frequency to hertz or kilohertz
export const convertFrequency = (value?: number) => {
  if (!value && value !== 0) {
    return "Ei tiedossa";
  }
  return value > 1000
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
  return value > 1000
    ? formatNumberToFI(value / 1000, 1) + " kA"
    : formatNumberToFI(value, 1) + " A";
};
