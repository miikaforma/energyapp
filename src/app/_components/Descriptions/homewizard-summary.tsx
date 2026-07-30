import { Col, Descriptions, Row, Tag, Tooltip } from "antd";
import ImportExportIcon from "@mui/icons-material/ImportExport";
import SouthWestIcon from "@mui/icons-material/SouthWest";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import BalanceIcon from "@mui/icons-material/Balance";
import { type HomewizardMeasurement } from "@energyapp/shared/interfaces";
import { TimePeriod } from "@energyapp/shared/enums";
import ConsumptionDescriptionSkeleton from "@energyapp/app/_components/Skeletons/consumption-description-skeleton";

type HomewizardSummaryProps = {
  timePeriod: TimePeriod;
  measurements: HomewizardMeasurement[];
  isLoading: boolean;
};

const fmt = (value: number, decimals = 2) =>
  value.toLocaleString("fi-FI", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const importColor = (kwh: number, timePeriod: TimePeriod): string => {
  switch (timePeriod) {
    case TimePeriod.PT15M: return kwh < 0.5 ? "green" : kwh < 1.25 ? "orange" : "red";
    case TimePeriod.PT1H:  return kwh < 2    ? "green" : kwh < 5    ? "orange" : "red";
    case TimePeriod.P1D:   return kwh < 20   ? "green" : kwh < 40   ? "orange" : "red";
    case TimePeriod.P1M:   return kwh < 300  ? "green" : kwh < 600  ? "orange" : "red";
    case TimePeriod.P1Y:   return kwh < 4000 ? "green" : kwh < 8000 ? "orange" : "red";
    default: return "blue";
  }
};

const exportColor = (kwh: number, timePeriod: TimePeriod): string => {
  switch (timePeriod) {
    case TimePeriod.PT15M: return kwh < 0.25 ? "yellow" : kwh < 0.5  ? "gold" : kwh < 1   ? "orange" : "volcano";
    case TimePeriod.PT1H:  return kwh < 1    ? "yellow" : kwh < 2    ? "gold" : kwh < 4   ? "orange" : "volcano";
    case TimePeriod.P1D:   return kwh < 5    ? "yellow" : kwh < 15   ? "gold" : kwh < 30  ? "orange" : "volcano";
    case TimePeriod.P1M:   return kwh < 50   ? "yellow" : kwh < 150  ? "gold" : kwh < 300 ? "orange" : "volcano";
    case TimePeriod.P1Y:   return kwh < 600  ? "yellow" : kwh < 1500 ? "gold" : kwh < 3000? "orange" : "volcano";
    default: return "green";
  }
};

export default function HomewizardSummary({
  timePeriod,
  measurements,
  isLoading,
}: HomewizardSummaryProps) {
  if (isLoading || measurements.length === 0) {
    return <ConsumptionDescriptionSkeleton isPulsing={isLoading} />;
  }

  const totalImport = measurements.reduce((s, m) => s + m.grid_import_kwh, 0);
  const totalExport = measurements.reduce((s, m) => s + m.grid_export_kwh, 0);
  const totalNet    = totalImport - totalExport;

  const maxImport = measurements.reduce(
    (max, m) => (m.grid_import_kwh > max.grid_import_kwh ? m : max),
    measurements[0]!,
  );
  const maxExport = measurements.reduce(
    (max, m) => (m.grid_export_kwh > max.grid_export_kwh ? m : max),
    measurements[0]!,
  );

  const nonZeroImport = measurements.filter((m) => m.grid_import_kwh > 0);
  const nonZeroExport = measurements.filter((m) => m.grid_export_kwh > 0);
  const avgImport = nonZeroImport.length
    ? nonZeroImport.reduce((s, m) => s + m.grid_import_kwh, 0) / nonZeroImport.length
    : 0;
  const avgExport = nonZeroExport.length
    ? nonZeroExport.reduce((s, m) => s + m.grid_export_kwh, 0) / nonZeroExport.length
    : 0;

  const netColor =
    totalNet > 0 ? "blue" : totalNet < 0 ? "green" : "default";
  const netLabel =
    totalNet > 0 ? "Netto-osto" : totalNet < 0 ? "Netto-myynti" : "Tasapainossa";

  return (
    <Descriptions size="small" title="" layout="vertical" bordered>
      {/* Import row */}
      <Descriptions.Item
        key="import"
        label={
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <SouthWestIcon fontSize="small" /> Osto verkosta
          </span>
        }
        style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}
      >
        <Row align="middle" gutter={4}>
          <Col span={8}>
            <Tooltip title="Yhteensä" trigger="click">
              <Tag color={importColor(totalImport, timePeriod)}>
                {fmt(totalImport)} kWh
              </Tag>
            </Tooltip>
          </Col>
          <Col span={8}>
            <Tooltip title="Keskiarvo" trigger="click">
              <span style={{ whiteSpace: "nowrap" }}>
                ø {fmt(avgImport)} kWh
              </span>
            </Tooltip>
          </Col>
          <Col span={8}>
            <Tooltip
              title={`Korkein: ${maxImport.grid_import_kwh.toLocaleString("fi-FI", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kWh`}
              trigger="click"
            >
              <span style={{ whiteSpace: "nowrap" }}>
                max {fmt(maxImport.grid_import_kwh)} kWh
              </span>
            </Tooltip>
          </Col>
        </Row>
      </Descriptions.Item>

      {/* Export row */}
      <Descriptions.Item
        key="export"
        label={
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <NorthEastIcon fontSize="small" /> Myynti verkkoon
          </span>
        }
        style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}
      >
        <Row align="middle" gutter={4}>
          <Col span={8}>
            <Tooltip title="Yhteensä" trigger="click">
              <Tag color={exportColor(totalExport, timePeriod)}>
                {fmt(totalExport)} kWh
              </Tag>
            </Tooltip>
          </Col>
          <Col span={8}>
            <Tooltip title="Keskiarvo" trigger="click">
              <span style={{ whiteSpace: "nowrap" }}>
                ø {fmt(avgExport)} kWh
              </span>
            </Tooltip>
          </Col>
          <Col span={8}>
            <Tooltip
              title={`Korkein: ${maxExport.grid_export_kwh.toLocaleString("fi-FI", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kWh`}
              trigger="click"
            >
              <span style={{ whiteSpace: "nowrap" }}>
                max {fmt(maxExport.grid_export_kwh)} kWh
              </span>
            </Tooltip>
          </Col>
        </Row>
      </Descriptions.Item>

      {/* Net row */}
      <Descriptions.Item
        key="net"
        label={
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <BalanceIcon fontSize="small" /> {netLabel}
          </span>
        }
        style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}
      >
        <Row align="middle" gutter={4}>
          <Col span={8}>
            <Tag color={netColor}>
              {totalNet > 0 ? "+" : ""}
              {fmt(Math.abs(totalNet))} kWh
            </Tag>
          </Col>
          <Col span={8}>
            <Tooltip title="Osto / Myynti -suhde" trigger="click">
              <span style={{ whiteSpace: "nowrap" }}>
                {totalExport > 0
                  ? `${fmt((totalImport / totalExport) * 100, 0)} % suhde`
                  : "—"}
              </span>
            </Tooltip>
          </Col>
          <Col span={8}>
            <Tooltip title="Omavaraisuusaste (myynti / osto)" trigger="click">
              <span style={{ whiteSpace: "nowrap" }}>
                {totalImport > 0
                  ? `${fmt(Math.min((totalExport / totalImport) * 100, 100), 0)} % omav.`
                  : "—"}
              </span>
            </Tooltip>
          </Col>
        </Row>
      </Descriptions.Item>
    </Descriptions>
  );
}
