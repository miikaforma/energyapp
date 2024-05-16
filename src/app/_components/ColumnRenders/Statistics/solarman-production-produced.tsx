import { Tag, Tooltip } from "antd";

export function SolarmanProductionProduced({
  time,
  produced,
}: {
  time: Date;
  produced?: number;
}) {
  let color = "none";

  if (!produced) {
    produced = 0;
  }

  if (produced > 0) {
    color =
      produced < 1000
        ? "yellow"
        : produced < 2000
          ? "gold"
          : produced < 4000
            ? "orange"
            : "volcano";
  }

  return (
    <Tooltip
      placement={"left"}
      title={`${produced?.toLocaleString("fi-FI", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} W`}
      trigger={"click"}
    >
      <Tag color={color} key={time.toUTCString()}>
        {`${(produced !== null && produced > 0
          ? produced / 1000
          : 0
        ).toLocaleString("fi-FI", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} kWh`}
      </Tag>
    </Tooltip>
  );
}
