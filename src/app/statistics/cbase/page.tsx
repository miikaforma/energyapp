"use client";

import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useState } from "react";
import useGetPvForecast from "@energyapp/app/_hooks/queries/useGetPvForecast";
import CBasePvForecast from "@energyapp/app/_components/Charts/cbase-pv-forecast";
import { Space, Table } from "antd";
import { dateToTableString, isCurrentHour } from "@energyapp/utils/timeHelpers";
import { TimePeriod } from "@energyapp/shared/enums";
import { type cbase_pv_forecast } from "@prisma/client";
import { CBaseForecastProduction } from "@energyapp/app/_components/ColumnRenders/Statistics/cbase-forecast-production";
import { CaretRightFilled } from "@ant-design/icons";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Page() {
  const [startDate, setStartDate] = useState(
    dayjs().hour(1).minute(0).second(0).millisecond(0),
  );

  const { data: forecast } = useGetPvForecast({ startTime: startDate });

  console.log(forecast);

  const columns = [
    {
      title: "",
      dataIndex: "time",
      key: "current",
      width: 30,
      render: (data: string | number | Date) => (
        <>{isCurrentHour(data) && <CaretRightFilled />}</>
      ),
    },
    {
      title: "Aika",
      dataIndex: "time",
      key: "time",
      render: (data: Dayjs) => dateToTableString(data, TimePeriod.PT1H),
    },
    {
      title: "Ennuste",
      dataIndex: "pv_po",
      key: "pv_po",
      render: (_data: number, row: cbase_pv_forecast) =>
        CBaseForecastProduction({ forecast: row }),
    },
  ];

  return (
    <Space
      direction="vertical"
      className="text-center"
      style={{ width: "calc(100vw - 32px)" }}
    >
      <CBasePvForecast hourlyForecast={forecast} />
      <Table
        rowClassName={(record, _index) =>
          isCurrentHour(record.time) ? "table-row-current" : ""
        }
        rowKey={"time"}
        size={"small"}
        dataSource={forecast}
        columns={columns}
        pagination={false}
      />
      <hr />
      <a href="https://cbase.fi/" rel="noopener noreferrer">
        Aurinkotuotantoennuste (CBase)
      </a>
    </Space>
  );
}
