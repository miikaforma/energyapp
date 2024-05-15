import { Tag, Tooltip } from "antd";
import { type cbase_pv_forecast } from "@prisma/client";

export function CBaseForecastProduction({
  forecast,
}: {
  forecast: cbase_pv_forecast;
}) {
  let color = "none";

  if (forecast.pv_po !== null && forecast.pv_po > 0) {
    color =
      forecast.pv_po < 1000
        ? "yellow"
        : forecast.pv_po < 2000
          ? "gold"
          : forecast.pv_po < 4000
            ? "orange"
            : "volcano";
  }

  return (
    <Tooltip
      placement={"left"}
      title={`${forecast.pv_po?.toLocaleString("fi-FI", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} W`}
      trigger={"click"}
    >
      <Tag color={color} key={forecast.time.toUTCString()}>
        {`${(forecast.pv_po !== null && forecast.pv_po > 0
          ? forecast.pv_po / 1000
          : 0
        ).toLocaleString("fi-FI", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} kWh`}
      </Tag>
    </Tooltip>
  );
}
