import { type IEnergyCostReport } from "@energyapp/shared/interfaces";
import DailyEnergyCostReportTable from "./table-daily";
import { Table, Tag } from "antd";

const { Column } = Table;

interface EnergyCostReportTableProps {
  energyCostReport: IEnergyCostReport;
}

declare global {
  interface Number {
    toFinnishDecimal(
      num: number | undefined,
      minDigits?: number,
      maxDigits?: number,
    ): string;
  }
}

Number.prototype.toFinnishDecimal = function (decimals = 2) {
  return this.toLocaleString("fi-FI", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const MonthsOfYear = [
  "Tammikuu",
  "Helmikuu",
  "Maaliskuu",
  "Huhtikuu",
  "Toukokuu",
  "Kesäkuu",
  "Heinäkuu",
  "Elokuu",
  "Syyskuu",
  "Lokakuu",
  "Marraskuu",
  "Joulukuu",
];
const DaysOfWeekShort = ["Su", "Ma", "Ti", "Ke", "To", "Pe", "La"];

export default function EnergyCostReportTable({
  energyCostReport,
}: EnergyCostReportTableProps) {
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

  if (
    !showHeating &&
    !showCooling &&
    !showFan &&
    !showDry &&
    !showAuto &&
    !showOther
  ) {
    return <></>;
  }

  const getTimeLabel = (time: number) => {
    switch (energyCostReport.LabelType) {
      // Hourly
      case 0:
        return time.toString() + ":00";
      // Daily
      case 1:
        return time.toString();
      // Monthly
      case 2:
        return MonthsOfYear[time - 1]?.substr(0, 3);
      // Monthly
      case 3:
        const month = time % 100;
        const year = Math.floor(time / 100);
        return MonthsOfYear[month - 1]?.substr(0, 3) + " " + year.toString().substr(2, 2);
      // Yearly
      case 4:
        return DaysOfWeekShort[time];
      default:
        return time.toString();
    }
  }

  return (
    <div style={{ overflowX: 'auto', maxWidth: 'calc(100vw - 8px)' }}>
      <Table
        rowKey={"time"}
        size={"small"}
        dataSource={consumptions}
        pagination={false}
      >
        <Column
          title=""
          dataIndex="time"
          key="time"
          render={(time: number) => <>{getTimeLabel(time)}</>}
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

  // switch (energyCostReport.LabelType) {
  //   // Hourly
  //   case 0:
  //     // for (i = 0; i < a.Labels.length; i++)
  //     //   e.push(a.Labels[i].toString() + (b ? "" : ":00"));
  //     return <></>;
  //   // Daily
  //   case 1:
  //     return <DailyEnergyCostReportTable energyCostReport={energyCostReport} />;
  //   // Monthly
  //   case 2:
  //     // oLang.MonthsOfYear = ['Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu']
  //     // else if (2 == a.LabelType)
  //     // for (i = 0; i < a.Labels.length; i++)
  //     //     e.push(oLang.MonthsOfYear[a.Labels[i] - 1].substr(0, 3));
  //     return <></>;
  //   // Monthly
  //   case 3:
  //     // for (i = 0; i < a.Labels.length; i++) {
  //     //   var h = a.Labels[i] % 100,
  //     //     c = Math.floor(a.Labels[i] / 100),
  //     //     h = oLang.MonthsOfYear[h - 1];
  //     //   e.push(h.substr(0, 3) + " " + c.toString().substr(2, 2));
  //     // }
  //     return <></>;
  //   // Yearly
  //   case 4:
  //     // for (i = 0; i < a.Labels.length; i++)
  //     //   e.push(oLang.DaysOfWeekShort[a.Labels[i]]);
  //     return <></>;
  //   default:
  //     return <></>;
  // }
}
