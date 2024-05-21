"use client";

import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useEffect, useRef, useState } from "react";
import useGetPvForecast from "@energyapp/app/_hooks/queries/useGetPvForecast";
import CBasePvForecast from "@energyapp/app/_components/Charts/cbase-pv-forecast";
import { Space, Table, type TableProps } from "antd";
import { dateToTableString, isCurrentHour } from "@energyapp/utils/timeHelpers";
import { TimePeriod } from "@energyapp/shared/enums";
import { type cbase_pv_forecast } from "@prisma/client";
import { CBaseForecastProduction } from "@energyapp/app/_components/ColumnRenders/Statistics/cbase-forecast-production";
import { CaretRightFilled } from "@ant-design/icons";
import useGetSolarmanProductions from "@energyapp/app/_hooks/queries/useGetSolarmanProductions";
import { SolarmanProductionProduced } from "@energyapp/app/_components/ColumnRenders/Statistics/solarman-production-produced";
import { DayDatePicker } from "@energyapp/app/_components/FormItems/antd-day-datepicker";
import useGetPvForecastRange from "@energyapp/app/_hooks/queries/useGetPvForecastRange";

dayjs.extend(utc);
dayjs.extend(timezone);

type ForecastWithProduction = cbase_pv_forecast & { production?: number };

export default function Page() {
  const tableRef: Parameters<typeof Table>[0]["ref"] = useRef(null);

  const [startDate, setStartDate] = useState<Dayjs>(
    dayjs().hour(1).minute(0).second(0).millisecond(0),
  );
  const [endDate, setEndDate] = useState<Dayjs | undefined>(undefined);

  const { data: datePickerRange } = useGetPvForecastRange();
  const { data: forecast, isLoading: forecastLoading } = useGetPvForecast({
    startTime: startDate,
    endTime: endDate?.endOf("day").add(1, "hour"),
  });
  const { data: productions, isLoading: productionLoading } =
    useGetSolarmanProductions({
      startTime: startDate.hour(0),
      endTime: endDate?.endOf("day").add(1, "hour"),
    });

  const combinedData = forecast?.map((forecastItem) => {
    const productionItem = productions?.find((productionItem) =>
      dayjs(productionItem.time).isSame(forecastItem.time),
    );

    return productionItem
      ? { ...forecastItem, production: productionItem.production }
      : forecastItem;
  }) as ForecastWithProduction[] | undefined;

  useEffect(() => {
    if (!forecastLoading && combinedData) {
      const currentHourIndex = combinedData.findIndex((record) =>
        isCurrentHour(record.time),
      );

      if (currentHourIndex !== -1 && tableRef.current) {
        setTimeout(() => {
          tableRef.current?.scrollTo({ index: currentHourIndex + 2 });
        }, 1);
      }
    }
  }, [combinedData, forecastLoading, productionLoading]);

  const onDateChange = (
    date: string | number | dayjs.Dayjs | Date | null | undefined,
  ) => {
    if (date) {
      setStartDate(dayjs(date).hour(1).minute(0).second(0).millisecond(0));
      setEndDate(dayjs(date));
    } else {
      setStartDate(dayjs().hour(1).minute(0).second(0).millisecond(0));
      setEndDate(undefined);
    }
  };

  const columns: TableProps<ForecastWithProduction>["columns"] = [
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
      align: "left",
      render: (data: Dayjs) => dateToTableString(data, TimePeriod.PT1H),
    },
    {
      title: "Ennuste",
      dataIndex: "pv_po",
      key: "pv_po",
      align: "left",
      render: (_data: number, row: ForecastWithProduction) =>
        CBaseForecastProduction({ forecast: row }),
    },
    {
      title: "Toteutunut",
      dataIndex: "production",
      key: "production",
      align: "left",
      render: (data: number, row: ForecastWithProduction) =>
        SolarmanProductionProduced({ time: row.time, produced: data }),
    },
  ];

  return (
    <Space
      direction="vertical"
      className="text-center"
      style={{ width: "calc(100vw - 32px)" }}
    >
      <DayDatePicker
        value={endDate}
        onChange={onDateChange}
        minDate={datePickerRange?.min}
        maxDate={datePickerRange?.max}
        allowClear={true}
      ></DayDatePicker>
      <CBasePvForecast hourlyForecast={forecast} produced={productions} />
      <Table
        ref={tableRef}
        rowClassName={(record, _index) =>
          isCurrentHour(record.time) ? "table-row-current" : ""
        }
        virtual
        scroll={{ x: 380, y: 400 }}
        rowKey="time"
        size="small"
        dataSource={combinedData}
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
