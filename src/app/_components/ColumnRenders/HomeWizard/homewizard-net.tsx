import { Tag } from "antd";
import { type HomewizardMeasurementDirection } from "@energyapp/shared/interfaces";

export function HomewizardNet({
  value,
  direction,
}: {
  value: number;
  direction: HomewizardMeasurementDirection;
}) {
  const color =
    direction === "import" ? "blue" : direction === "export" ? "green" : "default";

  const prefix = value > 0 ? "+" : "";

  return (
    <Tag color={color}>
      {prefix}
      {value.toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh
    </Tag>
  );
}
