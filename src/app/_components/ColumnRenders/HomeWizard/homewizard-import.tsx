import { Tag } from "antd";
import { TimePeriod } from "@energyapp/shared/enums";

export function HomewizardImport({ value, timePeriod }: { value: number; timePeriod: TimePeriod }) {
  if (value <= 0) {
    return <Tag color="default">0,00 kWh</Tag>;
  }

  let color: string;
  switch (timePeriod) {
    case TimePeriod.PT15M:
      color = value < 0.5 ? "green" : value < 1.25 ? "orange" : "red";
      break;
    case TimePeriod.PT1H:
      color = value < 2 ? "green" : value < 5 ? "orange" : "red";
      break;
    case TimePeriod.P1D:
      color = value < 20 ? "green" : value < 40 ? "orange" : "red";
      break;
    case TimePeriod.P1M:
      color = value < 300 ? "green" : value < 600 ? "orange" : "red";
      break;
    case TimePeriod.P1Y:
      color = value < 4000 ? "green" : value < 8000 ? "orange" : "red";
      break;
    default:
      color = "blue";
  }

  return (
    <Tag color={color}>
      {value.toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh
    </Tag>
  );
}
