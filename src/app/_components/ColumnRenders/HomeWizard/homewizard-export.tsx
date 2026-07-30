import { Tag } from "antd";
import { TimePeriod } from "@energyapp/shared/enums";

export function HomewizardExport({ value, timePeriod }: { value: number; timePeriod: TimePeriod }) {
  if (value <= 0) {
    return <Tag color="default">0,00 kWh</Tag>;
  }

  let color: string;
  switch (timePeriod) {
    case TimePeriod.PT15M:
      color = value < 0.25 ? "yellow" : value < 0.5 ? "gold" : value < 1 ? "orange" : "volcano";
      break;
    case TimePeriod.PT1H:
      color = value < 1 ? "yellow" : value < 2 ? "gold" : value < 4 ? "orange" : "volcano";
      break;
    case TimePeriod.P1D:
      color = value < 5 ? "yellow" : value < 15 ? "gold" : value < 30 ? "orange" : "volcano";
      break;
    case TimePeriod.P1M:
      color = value < 50 ? "yellow" : value < 150 ? "gold" : value < 300 ? "orange" : "volcano";
      break;
    case TimePeriod.P1Y:
      color = value < 600 ? "yellow" : value < 1500 ? "gold" : value < 3000 ? "orange" : "volcano";
      break;
    default:
      color = "green";
  }

  return (
    <Tag color={color}>
      {value.toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh
    </Tag>
  );
}
