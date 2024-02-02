import { type IEnergyCostReport } from "@energyapp/shared/interfaces";
import { Table, Tag } from "antd";

const { Column } = Table;

declare global {
  interface Number {
    toFinnishDecimal(
      num: number | undefined,
      minDigits?: number,
      maxDigits?: number,
    ): string;
  }
}

interface EnergyCostReportTableProps {
  energyCostReport: IEnergyCostReport;
}

export default function DailyEnergyCostReportTable({
  energyCostReport,
}: EnergyCostReportTableProps) {
  Number.prototype.toFinnishDecimal = function (
    decimals = 2,
  ) {
    return this.toLocaleString("fi-FI", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const consumptions = energyCostReport.Labels.map((label, index) => {
    return {
      time: label,
      heating: energyCostReport.Heating[index],
      cooling: energyCostReport.Cooling[index],
      fan: energyCostReport.Fan[index],
      dry: energyCostReport.Dry[index],
      auto: energyCostReport.Auto[index],
      other: energyCostReport.Other[index],
    };
  });

  const showHeating = energyCostReport.TotalHeatingConsumed > 0;
  const showCooling = energyCostReport.TotalCoolingConsumed > 0;
  const showFan = energyCostReport.TotalFanConsumed > 0;
  const showDry = energyCostReport.TotalDryConsumed > 0;
  const showAuto = energyCostReport.TotalAutoConsumed > 0;
  const showOther = energyCostReport.TotalOtherConsumed > 0;

  if (!showHeating && !showCooling && !showFan && !showDry && !showAuto && !showOther) {
    return <></>;
  }

  return (
    <div>
      <Table
        rowKey={"time"}
        size={"small"}
        dataSource={consumptions}
        pagination={false}
      >
        <Column
          title="Päivä"
          dataIndex="time"
          key="time"
          render={(time: number) => <>{time}</>}
        />
        {showHeating && (
          <Column
            title="Lämmitys"
            dataIndex="heating"
            key="heating"
            render={(heating: number) => (
              <Tag
                color="volcano"
                key={heating}
                style={{ width: "100%", textAlign: "center" }}
              >
                {heating.toFinnishDecimal(2)} kWh
              </Tag>
            )}
          />
        )}
        {showCooling && (
          <Column
            title="Jäähdytys"
            dataIndex="cooling"
            key="cooling"
            render={(cooling: number) => (
              <Tag
                color="geekblue"
                key={cooling}
                style={{ width: "100%", textAlign: "center" }}
              >
                {cooling.toFinnishDecimal(2)} kWh
              </Tag>
            )}
          />
        )}
        {showFan && (
          <Column
            title="Tuuletus"
            dataIndex="fan"
            key="fan"
            render={(fan: number) => (
              <Tag
                color="blue"
                key={fan}
                style={{ width: "100%", textAlign: "center" }}
              >
                {fan.toFinnishDecimal(2)} kWh
              </Tag>
            )}
          />
        )}
        {showDry && (
          <Column
            title="Kuivaus"
            dataIndex="dry"
            key="dry"
            render={(dry: number) => (
              <Tag
                color="gold"
                key={dry}
                style={{ width: "100%", textAlign: "center" }}
              >
                {dry.toFinnishDecimal(2)} kWh
              </Tag>
            )}
          />
        )}
        {showAuto && (
          <Column
            title="Auto"
            dataIndex="auto"
            key="auto"
            render={(auto: number) => (
              <Tag
                color="purple"
                key={auto}
                style={{ width: "100%", textAlign: "center" }}
              >
                {auto.toFinnishDecimal(2)} kWh
              </Tag>
            )}
          />
        )}
        {showOther && (
          <Column
            title="Muu"
            dataIndex="other"
            key="other"
            render={(other: number) => (
              <Tag
                color=""
                key={other}
                style={{ width: "100%", textAlign: "center" }}
              >
                {other.toFinnishDecimal(2)} kWh
              </Tag>
            )}
          />
        )}
      </Table>
    </div>
  );
}
