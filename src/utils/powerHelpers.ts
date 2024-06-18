import { formatNumberToFI } from "./wattivahtiHelpers";

export const kwhOrWattsString = (value: number) => {
  return value > 1000
    ? formatNumberToFI(value / 1000) + " kWh"
    : formatNumberToFI(value) + " W";
};
