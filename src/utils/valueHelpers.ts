import { formatNumberToFI } from "./wattivahtiHelpers";

export const displayFuelType = (fuelType: string) => {
  switch (fuelType) {
    case "95":
      return "95 E10";
    case "98":
      return "98 E5";
    case "98+":
      return "98+ E5";
    case "99":
      return "99 E5";
    case "dsl":
      return "Diesel";
    case "dsl+":
      return "Diesel+";
    // case "":
    //   return "Renewable diesel";
    case "85":
      return "E85";
    // case "":
    //   return "Biogas";
    // case "":
    //   return "Natural gas";
    default:
      return fuelType;
  }
}

export function isValueDefined(value: number | null | undefined): value is number {
  return value !== undefined && value !== null;
}

export type MeasurementType =
  | "power"
  | "voltage"
  | "frequency"
  | "temperatureC"
  | "temperatureF"
  | "current"
  | "humidity"
  | "pressure"
  | "co2"
  | "pm25"
  | "voc"
  | "nox";

type FormattedMeasurement = {
  value: string;
  unit?: string;
};

export const formatMeasurement = (
  type: MeasurementType,
  value?: number
): FormattedMeasurement | undefined => {
  if (!isValueDefined(value)) {
    return undefined;
  }

  switch (type) {
    case "power":
      return value >= 1000
        ? { value: formatNumberToFI(value / 1000, 1), unit: "kWh" }
        : { value: formatNumberToFI(value, 1), unit: "W" };

    case "voltage":
      return value >= 1000
        ? { value: formatNumberToFI(value / 1000, 1), unit: "kV" }
        : { value: formatNumberToFI(value, 1), unit: "V" };

    case "frequency":
      return value >= 1000
        ? { value: formatNumberToFI(value / 1000, 1), unit: "kHz" }
        : { value: formatNumberToFI(value, 1), unit: "Hz" };

    case "temperatureC":
      return { value: formatNumberToFI(value, 1), unit: "°C" };

    case "temperatureF":
      return { value: formatNumberToFI(value, 1), unit: "°F" };

    case "current":
      return value >= 1000
        ? { value: formatNumberToFI(value / 1000, 1), unit: "kA" }
        : { value: formatNumberToFI(value, 1), unit: "A" };

    case "humidity":
      return { value: formatNumberToFI(value, 2), unit: "%" };

    case "pressure":
      return value >= 100
        ? { value: formatNumberToFI(value / 100, 1), unit: "hPa" }
        : { value: formatNumberToFI(value, 0, 0), unit: "Pa" };

    case "co2":
      return { value: formatNumberToFI(value, 0, 0), unit: "ppm" };

    case "pm25":
      return { value: formatNumberToFI(value, 1), unit: "µg/m³" };

    case "voc":
      return { value: formatNumberToFI(value, 0, 0), unit: undefined };

    case "nox":
      return { value: formatNumberToFI(value, 0, 0), unit: undefined };

    default:
      return undefined;
  }
};

type PowerUnit = "mW" | "W" | "kW";

export const normalizePower = (
  value: number,
  unit: PowerUnit
): number => {
  switch (unit) {
    case "mW":
      return value / 1000;

    case "W":
      return value;

    case "kW":
      return value * 1000;
  }
};
