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
