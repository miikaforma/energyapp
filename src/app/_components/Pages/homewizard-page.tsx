"use client";

import { DayDatePicker } from "@energyapp/app/_components/FormItems/antd-day-datepicker";
import { Col, Radio, type RadioChangeEvent, Row, Space, Table } from "antd";
const { Column } = Table;
import { CaretRightFilled } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState, useCallback } from "react";
import RelativeTime from "@energyapp/app/_components/Helpers/relative-time";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { TimePeriod } from "@energyapp/shared/enums";
import { type HomewizardMeasurement } from "@energyapp/shared/interfaces";
import {
  isCurrentDay,
  isCurrentHour,
  isCurrentMonth,
  isCurrentPT15M,
  isCurrentYear,
} from "@energyapp/utils/timeHelpers";
import { YearDatePicker } from "@energyapp/app/_components/FormItems/antd-year-datepicker";
import { MonthDatePicker } from "@energyapp/app/_components/FormItems/antd-month-datepicker";
import { YearRangeDatePicker } from "@energyapp/app/_components/FormItems/antd-year-range-datepicker";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { api } from "@energyapp/trpc/react";
import useGetHomewizardMeasurements from "@energyapp/app/_hooks/queries/homewizard/useGetHomewizardMeasurements";
import useGetHomewizardRange from "@energyapp/app/_hooks/queries/homewizard/useGetHomewizardRange";
import useHomewizardSubscription from "@energyapp/app/_hooks/subscriptions/useHomewizardSubscription";
import { DateNoWrap } from "@energyapp/app/_components/ColumnRenders/date-nowrap";
import { HomewizardImport } from "@energyapp/app/_components/ColumnRenders/HomeWizard/homewizard-import";
import { HomewizardExport } from "@energyapp/app/_components/ColumnRenders/HomeWizard/homewizard-export";
import { HomewizardNet } from "@energyapp/app/_components/ColumnRenders/HomeWizard/homewizard-net";
import HomewizardSummary from "@energyapp/app/_components/Descriptions/homewizard-summary";
import HomewizardChart from "@energyapp/app/_components/Charts/homewizard-chart";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

type HomeWizardPageProps = {
  timePeriod: TimePeriod;
};

const getDefaultStartDate = (timePeriod: TimePeriod, dateQuery?: Dayjs) => {
  switch (timePeriod) {
    case TimePeriod.PT15M:
    case TimePeriod.PT1H:
      return (dateQuery ?? dayjs()).hour(0).minute(0).second(0).millisecond(0);
    case TimePeriod.P1D:
      return dayjs().startOf("month").hour(0).minute(0).second(0).millisecond(0);
    case TimePeriod.P1M:
      return dayjs().startOf("year").hour(0).minute(0).second(0).millisecond(0);
    case TimePeriod.P1Y:
      return dayjs().add(-5, "year").startOf("year").hour(0).minute(0).second(0).millisecond(0);
    default:
      return dayjs().hour(0).minute(0).second(0).millisecond(0);
  }
};

const getDefaultEndDate = (timePeriod: TimePeriod, dateQuery?: Dayjs) => {
  switch (timePeriod) {
    case TimePeriod.PT15M:
    case TimePeriod.PT1H:
      return (dateQuery ?? dayjs()).hour(23).minute(59).second(59).millisecond(999);
    case TimePeriod.P1D:
      return dayjs().endOf("month").hour(23).minute(59).second(59).millisecond(999);
    case TimePeriod.P1M:
      return dayjs().endOf("year").hour(23).minute(59).second(59).millisecond(999);
    case TimePeriod.P1Y:
      return dayjs().endOf("year").hour(23).minute(59).second(59).millisecond(999);
    default:
      return dayjs().hour(23).minute(59).second(59).millisecond(999);
  }
};

const getSelectedDate = (date: Dayjs) => {
  if (date.isSame(dayjs().subtract(1, "day"), "day")) return "yesterday";
  if (date.isSame(dayjs(), "day")) return "today";
  return "";
};

export default function HomeWizardPage({ timePeriod }: HomeWizardPageProps) {
  const searchParams = useSearchParams();
  const dateQuery = searchParams.get("date");
  const { data: session } = useSession();
  const parsedDate = dateQuery ? dayjs(dateQuery) : undefined;

  const [startDate, setStartDate] = useState(getDefaultStartDate(timePeriod, parsedDate));
  const [endDate, setEndDate] = useState(getDefaultEndDate(timePeriod, parsedDate));
  const [selectedDate, setSelectedDate] = useState(getSelectedDate(parsedDate ?? dayjs()));
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const utils = api.useUtils();

  const isViewingToday =
    (timePeriod === TimePeriod.PT15M || timePeriod === TimePeriod.PT1H) &&
    dayjs(startDate).isSame(dayjs(), "day");

  const onNewMeasurement = useCallback(() => {
    void utils.homewizard.get.invalidate({
      timePeriod,
      startTime: startDate,
      endTime: endDate,
    });
    setLastUpdated(new Date());
  }, [utils, timePeriod, startDate, endDate]);

  useHomewizardSubscription(onNewMeasurement, isViewingToday);

  const { data: hwRange } = useGetHomewizardRange();

  const { data: hwResponse, isLoading, dataUpdatedAt } = useGetHomewizardMeasurements({
    timePeriod,
    startTime: startDate,
    endTime: endDate,
  });
  const measurements = hwResponse?.measurements ?? [];

  // Track last updated from query
  useEffect(() => {
    if (dataUpdatedAt) setLastUpdated(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  // Auto-advance when the hour changes
  useEffect(() => {
    const intervalId = setInterval(() => {
      const newHour = new Date().getHours();
      if (newHour !== currentHour) {
        setCurrentHour(newHour);
        if ((timePeriod === TimePeriod.PT15M || timePeriod === TimePeriod.PT1H) &&
            !dayjs().isSame(startDate, "day")) {
          onDateChange(dayjs());
        }
      }
    }, 10 * 1000);
    return () => clearInterval(intervalId);
  }, [currentHour, startDate]);

  const onDateChange = (date: string | number | Dayjs | Date | null | undefined) => {
    let start = dayjs(date);
    let end = dayjs(date);
    switch (timePeriod) {
      case TimePeriod.P1D:
        start = start.startOf("month");
        end = end.endOf("month");
        break;
      case TimePeriod.P1M:
        start = start.startOf("year");
        end = end.endOf("year");
        break;
      case TimePeriod.PT15M:
      case TimePeriod.PT1H:
        setSelectedDate(getSelectedDate(dayjs(date)));
        break;
    }
    setStartDate(start.hour(0).minute(0).second(0).millisecond(0));
    setEndDate(end.hour(23).minute(59).second(59).millisecond(999));
  };

  const changeSelectedDate = (e: RadioChangeEvent) => {
    const val = e.target.value as string;
    setSelectedDate(val);
    if (val === "yesterday") {
      setStartDate(dayjs().subtract(1, "day").hour(0).minute(0).second(0).millisecond(0));
      setEndDate(dayjs().subtract(1, "day").hour(23).minute(59).second(59).millisecond(999));
    } else {
      setStartDate(dayjs().hour(0).minute(0).second(0).millisecond(0));
      setEndDate(dayjs().hour(23).minute(59).second(59).millisecond(999));
    }
  };

  const onDateRangeChange = (start: Dayjs, end: Dayjs) => {
    setStartDate(start.startOf("year").hour(0).minute(0).second(0).millisecond(0));
    setEndDate(end.endOf("year").hour(23).minute(59).second(59).millisecond(999));
  };

  const isCurrentTimePeriod = (time: string | number | Date | Dayjs | undefined) => {
    switch (timePeriod) {
      case TimePeriod.PT15M: return isCurrentPT15M(time);
      case TimePeriod.PT1H:  return isCurrentHour(time);
      case TimePeriod.P1D:   return isCurrentDay(time);
      case TimePeriod.P1M:   return isCurrentMonth(time);
      case TimePeriod.P1Y:   return isCurrentYear(time);
      default:               return false;
    }
  };

  const filters = () => {
    const minDate = session ? hwRange?.min : undefined;
    const maxDate = session ? hwRange?.max : undefined;
    switch (timePeriod) {
      case TimePeriod.PT15M:
      case TimePeriod.PT1H:
        return (
          <Row style={{ paddingBottom: 8 }}>
            <Col flex="auto">
              <DayDatePicker value={startDate} onChange={onDateChange} disabledNextDays={0} minDate={minDate} maxDate={maxDate} />
            </Col>
          </Row>
        );
      case TimePeriod.P1D:
        return (
          <Row style={{ paddingBottom: 8 }}>
            <Col flex="auto">
              <MonthDatePicker value={startDate} onChange={onDateChange} minDate={minDate} maxDate={maxDate} />
            </Col>
          </Row>
        );
      case TimePeriod.P1M:
        return (
          <Row style={{ paddingBottom: 8 }}>
            <Col flex="auto">
              <YearDatePicker value={startDate} onChange={onDateChange} minDate={minDate} maxDate={maxDate} />
            </Col>
          </Row>
        );
      case TimePeriod.P1Y:
        return (
          <Row style={{ paddingBottom: 8 }}>
            <Col flex="auto">
              <YearRangeDatePicker startYear={startDate} endYear={endDate} onChange={onDateRangeChange} minDate={minDate} maxDate={maxDate} />
            </Col>
          </Row>
        );
      default:
        return <></>;
    }
  };

  // Totals for summary row
  const totalImport = measurements.reduce((s, m) => s + m.grid_import_kwh, 0);
  return (
    <Space orientation="vertical" className="text-center" style={{ width: "calc(100vw - 32px)" }}>
      {(timePeriod === TimePeriod.PT15M || timePeriod === TimePeriod.PT1H) && (
        <Radio.Group value={selectedDate} onChange={changeSelectedDate} style={{ width: "100%", marginBottom: 12 }}>
          <Radio.Button value="yesterday">Eilen</Radio.Button>
          <Radio.Button value="today">Tänään</Radio.Button>
        </Radio.Group>
      )}

      {filters()}

      <HomewizardSummary
        timePeriod={timePeriod}
        measurements={measurements}
        isLoading={isLoading}
      />

      <HomewizardChart response={hwResponse} isLoading={isLoading} />

      <Table
        rowClassName={(record) =>
          isCurrentTimePeriod(dayjs(record.bucket as unknown as string)) ? "table-row-current" : ""
        }
        rowKey={(record) => String(record.bucket)}
        size="small"
        dataSource={measurements}
        pagination={false}
        loading={isLoading}
        scroll={{ x: true }}
      >
        <Column
          title=""
          dataIndex="bucket"
          key="current"
          width={24}
          render={(data: Dayjs | string) => (
            <>{isCurrentTimePeriod(dayjs(data)) && <CaretRightFilled />}</>
          )}
        />
        <Column
          title="Aika"
          dataIndex="bucket"
          key="bucket"
          render={(data: Dayjs | string) => <DateNoWrap date={dayjs(data)} timePeriod={timePeriod} />}
        />
        <Column
          title="Osto"
          dataIndex="grid_import_kwh"
          key="grid_import_kwh"
          render={(data: number) => (
            <HomewizardImport value={data} timePeriod={timePeriod} />
          )}
        />
        <Column
          title="Myynti"
          dataIndex="grid_export_kwh"
          key="grid_export_kwh"
          render={(data: number) => (
            <HomewizardExport value={data} timePeriod={timePeriod} />
          )}
        />
        <Column
          title="Netto"
          dataIndex="net_kwh"
          key="net_kwh"
          render={(_: number, row: HomewizardMeasurement) => (
            <HomewizardNet value={row.net_kwh} direction={row.direction} />
          )}
        />
      </Table>

      {lastUpdated && (
        <span style={{ fontStyle: "italic", color: "gray", fontSize: "0.8em" }}>
          Päivitetty <RelativeTime timestamp={lastUpdated} />
        </span>
      )}
    </Space>
  );
}
