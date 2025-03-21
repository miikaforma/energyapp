"use client";

import { DayDatePicker } from "@energyapp/app/_components/FormItems/antd-day-datepicker";
import { api } from "@energyapp/trpc/react";
import { Button, Col, Row, Space, Table } from "antd";
import dayjs, { type Dayjs } from "dayjs";

import { useEffect, useState } from "react";

import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { TimePeriod } from "@energyapp/shared/enums";
import { type SolarmanProduction } from "@energyapp/shared/interfaces";
import { dateToTableString } from "@energyapp/utils/timeHelpers";
import { YearDatePicker } from "@energyapp/app/_components/FormItems/antd-year-datepicker";
import { MonthDatePicker } from "@energyapp/app/_components/FormItems/antd-month-datepicker";
import useGetSolarmanProductions from "@energyapp/app/_hooks/queries/useGetSolarmanProductions";
import SolarmanProductionsChart from "@energyapp/app/_components/Charts/solarman-productions-chart";
import SolarmanProductionSummary from "@energyapp/app/_components/Descriptions/solarman-production-summary";
import { SolarmanProductionColumn } from "@energyapp/app/_components/ColumnRenders/Solarman/solarman-production";
import useGetLatestSolarmanProduction from "@energyapp/app/_hooks/queries/useGetLatestSolarmanProduction";
import SolarmanLatestProductionSummary from "@energyapp/app/_components/Descriptions/solarman-latest-production-summary";
import useUpdateSolarman from "@energyapp/app/_hooks/mutations/useUpdateSolarman";
import { RedoOutlined } from "@ant-design/icons";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

type SolarmanPageProps = {
  timePeriod: TimePeriod;
};

const getDefaultStartDate = (timePeriod: TimePeriod) => {
  switch (timePeriod) {
    case TimePeriod.PT15M:
      return dayjs().hour(0).minute(0).second(0).millisecond(0);
    case TimePeriod.PT1H:
      return dayjs().hour(0).minute(0).second(0).millisecond(0);
    case TimePeriod.P1D:
      return dayjs()
        .startOf("month")
        .hour(0)
        .minute(0)
        .second(0)
        .millisecond(0);
    case TimePeriod.P1M:
      return dayjs().startOf("year").hour(0).minute(0).second(0).millisecond(0);
    default:
      return dayjs().hour(0).minute(0).second(0).millisecond(0);
  }
};

const getDefaultEndDate = (timePeriod: TimePeriod) => {
  switch (timePeriod) {
    case TimePeriod.PT15M:
      return dayjs().hour(23).minute(59).second(59).millisecond(999);
    case TimePeriod.PT1H:
      return dayjs().hour(23).minute(59).second(59).millisecond(999);
    case TimePeriod.P1D:
      return dayjs()
        .endOf("month")
        .hour(23)
        .minute(59)
        .second(59)
        .millisecond(999);
    case TimePeriod.P1M:
      return dayjs()
        .endOf("year")
        .hour(23)
        .minute(59)
        .second(59)
        .millisecond(999);
    default:
      return dayjs().hour(23).minute(59).second(59).millisecond(999);
  }
};

export default function SolarmanProductionPage({
  timePeriod,
}: SolarmanPageProps) {
  const [startDate, setStartDate] = useState(getDefaultStartDate(timePeriod));
  const [endDate, setEndDate] = useState(getDefaultEndDate(timePeriod));
  const utils = api.useUtils();

  // Get latest production
  const { data: latestProduction } = useGetLatestSolarmanProduction();

  // Get productions
  const {
    data: response,
    isLoading,
    prefetch: prefetchProductions,
  } = useGetSolarmanProductions({
    timePeriod: timePeriod,
    startTime: startDate,
    endTime: endDate,
  });
  const productions = response?.productions ?? [];

  // Update
    const { mutate: updateProductions, isLoading: isUpdating } =
      useUpdateSolarman();

  useEffect(() => {
    console.log('SolarmanProductionPage', { timePeriod, startDate, endDate });
    updateProductions({
      timePeriod: timePeriod,
    });
  }
  , [timePeriod]);

  // Prefetch productions when date changes
  useEffect(() => {
    prefetchProductions({
      utils,
      timePeriod: timePeriod,
      startTime: startDate,
      endTime: endDate,
    });
  }, [startDate, endDate]);

  // When date is changed from the date picker
  const onDateChange = (
    date: string | number | dayjs.Dayjs | Date | null | undefined,
  ) => {
    let startDate = dayjs(date);
    let endDate = dayjs(date);
    switch (timePeriod) {
      case TimePeriod.P1D: {
        startDate = startDate.startOf("month");
        endDate = endDate.endOf("month");
        break;
      }
      case TimePeriod.P1M: {
        startDate = startDate.startOf("year");
        endDate = endDate.endOf("year");
        break;
      }
    }

    setStartDate(startDate.hour(0).minute(0).second(0).millisecond(0));
    setEndDate(endDate.hour(23).minute(59).second(59).millisecond(999));
  };

  // Execute update
    const executeUpdateProductions = () => {
      updateProductions({
        timePeriod: timePeriod,
      });
    };

  const columns = [
    {
      title: "Aika",
      dataIndex: "time",
      key: "time",
      render: (data: Dayjs) => dateToTableString(data, timePeriod),
    },
    {
      title: "Tuotto",
      dataIndex: "production",
      key: "production",
      render: (_data: number, row: SolarmanProduction) =>
        SolarmanProductionColumn({
          production: row,
          timePeriod,
        }),
    },
  ];

  const filters = () => {
    switch (timePeriod) {
      case TimePeriod.PT15M:
      case TimePeriod.PT1H:
        return (
          <Row style={{ paddingBottom: 8 }}>
            <Col flex="auto">
              <DayDatePicker
                value={startDate}
                onChange={onDateChange}
              ></DayDatePicker>
            </Col>
            <Col flex="none">
              {
                <Button
                  loading={isUpdating}
                  onClick={executeUpdateProductions}
                  icon={!isUpdating && <RedoOutlined />}
                ></Button>
              }
            </Col>
          </Row>
        );
      case TimePeriod.P1D:
        return (
          <Row style={{ paddingBottom: 8 }}>
            <Col flex="auto">
              <MonthDatePicker
                value={startDate}
                onChange={onDateChange}
              ></MonthDatePicker>
            </Col>
            <Col flex="none">
              {
                <Button
                  loading={isUpdating}
                  onClick={executeUpdateProductions}
                  icon={!isUpdating && <RedoOutlined />}
                ></Button>
              }
            </Col>
          </Row>
        );
      case TimePeriod.P1M:
        return (
          <Row style={{ paddingBottom: 8 }}>
            <Col flex="auto">
              <YearDatePicker
                value={startDate}
                onChange={onDateChange}
              ></YearDatePicker>
            </Col>
            <Col flex="none">
              {
                <Button
                  loading={isUpdating}
                  onClick={executeUpdateProductions}
                  icon={!isUpdating && <RedoOutlined />}
                ></Button>
              }
            </Col>
          </Row>
        );
      default:
        return <></>;
    }
  };

  return (
    <Space
      direction="vertical"
      className="text-center"
      style={{ width: "calc(100vw - 32px)" }}
    >
      <SolarmanLatestProductionSummary summary={latestProduction} />
      {filters()}
      <SolarmanProductionSummary
        timePeriod={timePeriod}
        summary={response?.summary}
      />
      <SolarmanProductionsChart
        response={response}
        startDate={startDate}
        isLoading={isLoading}
        endDate={endDate}
      />
      <Table
        rowKey={"time"}
        size={"small"}
        dataSource={productions}
        columns={columns}
        pagination={false}
      />
    </Space>
  );
}
