"use client";

import { DayDatePicker } from "@energyapp/app/_components/FormItems/antd-day-datepicker";
import { api } from "@energyapp/trpc/react";
import {
  Button,
  Col,
  Radio,
  type RadioChangeEvent,
  Row,
  Space,
  Table,
} from "antd";
const { Column } = Table;
import { CaretRightFilled, RedoOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { TimePeriod } from "@energyapp/shared/enums";
import { type ISpotPrice } from "@energyapp/shared/interfaces";
import {
  dateToSpotTimeString,
  isCurrentDay,
  isCurrentHour,
  isCurrentMonth,
  isCurrentYear,
} from "@energyapp/utils/timeHelpers";
import { YearDatePicker } from "@energyapp/app/_components/FormItems/antd-year-datepicker";
import { MonthDatePicker } from "@energyapp/app/_components/FormItems/antd-month-datepicker";
import { useSession } from "next-auth/react";
import { useSettingsStore } from "@energyapp/app/_stores/settings/settings";
import useGetSpotPrices from "@energyapp/app/_hooks/queries/useGetSpotPrices";
import useUpdateSpotPrices from "@energyapp/app/_hooks/mutations/useUpdateSpotPrices";
import { ElectricitySpotPrice } from "@energyapp/app/_components/ColumnRenders/SpotPrice/electricity-spot-price";
import { ElectricityPrice } from "@energyapp/app/_components/ColumnRenders/SpotPrice/electricity-price";
import SpotPriceSummary from "@energyapp/app/_components/Descriptions/spotprice-summary";
import SpotPricesChart from "@energyapp/app/_components/Charts/spot-prices-chart";
import { YearRangeDatePicker } from "@energyapp/app/_components/FormItems/antd-year-range-datepicker";
import useGetSpotPriceRange from "@energyapp/app/_hooks/queries/useGetSpotPriceRange";
import { useSearchParams } from 'next/navigation';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

type SpotPricePageProps = {
  timePeriod: TimePeriod;
};

const getDefaultStartDate = (timePeriod: TimePeriod, dateQuery?: Dayjs) => {
  switch (timePeriod) {
    case TimePeriod.PT15M:
      return dayjs().hour(0).minute(0).second(0).millisecond(0);
    case TimePeriod.PT1H:
      if (dateQuery) {
        return dateQuery.hour(0).minute(0).second(0).millisecond(0);
      }
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
    case TimePeriod.P1Y:
      return dayjs()
        .add(-5, "year")
        .startOf("year")
        .hour(0)
        .minute(0)
        .second(0)
        .millisecond(0);
    default:
      return dayjs().add(-1, "day").hour(0).minute(0).second(0).millisecond(0);
  }
};

const getDefaultEndDate = (timePeriod: TimePeriod, dateQuery?: Dayjs) => {
  switch (timePeriod) {
    case TimePeriod.PT15M:
      return dayjs().hour(23).minute(59).second(59).millisecond(999);
    case TimePeriod.PT1H:
      if (dateQuery) {
        return dateQuery.hour(23).minute(59).second(59).millisecond(999);
      }
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
    case TimePeriod.P1Y:
      return dayjs()
        .endOf("year")
        .hour(23)
        .minute(59)
        .second(59)
        .millisecond(999);
    default:
      return dayjs()
        .add(-1, "day")
        .hour(23)
        .minute(59)
        .second(59)
        .millisecond(999);
  }
};

const getSelectedDate = (date: dayjs.Dayjs) => {
  // Yesterday
  if (date.isSame(dayjs().subtract(1, "day"), "day")) {
    return "yesterday";
  }
  // Today
  else if (date.isSame(dayjs(), "day")) {
    return "today";
  }
  // Tomorrow
  else if (date.isSame(dayjs().add(1, "day"), "day")) {
    return "tomorrow";
  }
  // Other
  else {
    return "";
  }
};

export default function SpotPricePage({ timePeriod }: SpotPricePageProps) {
  const searchParams = useSearchParams()
  const dateQuery = searchParams.get('date')

  const { data: session } = useSession();
  const [startDate, setStartDate] = useState(getDefaultStartDate(timePeriod, dateQuery ? dayjs(dateQuery) : undefined));
  const [endDate, setEndDate] = useState(getDefaultEndDate(timePeriod, dateQuery ? dayjs(dateQuery) : undefined));
  const utils = api.useUtils();
  const settingsStore = useSettingsStore();
  const settings = settingsStore.settings;

  // Get the current hour
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [selectedDate, setSelectedDate] = useState(getSelectedDate(dateQuery ? dayjs(dateQuery) : dayjs()));

  // Get spot price range
  const { data: spotPriceRange } = useGetSpotPriceRange({
    timePeriod: timePeriod,
  });

  // Get spot prices
  const { data: spotResponse, prefetch: prefetchSpotPrices } = useGetSpotPrices(
    {
      timePeriod: timePeriod,
      startTime: startDate,
      endTime: endDate,
    },
  );
  const spotPrices = spotResponse?.prices ?? [];

  // Update spot prices
  const { mutate: updateSpotPrices, isLoading: isUpdating } =
    useUpdateSpotPrices();

  // Prefetch spot prices when date changes
  useEffect(() => {
    prefetchSpotPrices({
      utils,
      timePeriod: timePeriod,
      startTime: startDate,
      endTime: endDate,
    });
  }, [startDate, endDate]);

  // Prefetch spot prices when date changes
  useEffect(() => {
    // Call the function to refresh the data immediately when the component mounts
    prefetchSpotPrices({
      utils,
      timePeriod: timePeriod,
      startTime: startDate,
      endTime: endDate,
    });

    // Set an interval to check every 10 seconds if the hour has changed
    const intervalId = setInterval(() => {
      console.log("Checking if the hour has changed");
      const newHour = new Date().getHours();
      if (newHour !== currentHour) {
        // If the hour has changed, update the state and refresh the data
        setCurrentHour(newHour);
        prefetchSpotPrices({
          utils,
          timePeriod: timePeriod,
          startTime: startDate,
          endTime: endDate,
        });

        // If the date has changed, change to the current date
        const currentDate = dayjs();
        if (!currentDate.isSame(startDate, "day")) {
          // If the day has changed, update the selected date
          onDateChange(currentDate);
        }
      }
    }, 10 * 1000); // 10 * 1000 ms = 10 seconds

    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [currentHour, startDate, endDate]);

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
      case TimePeriod.PT15M:
      case TimePeriod.PT1H: {
        setSelectedDate(getSelectedDate(dayjs(date)));
        break;
      }
    }

    setStartDate(startDate.hour(0).minute(0).second(0).millisecond(0));
    setEndDate(endDate.hour(23).minute(59).second(59).millisecond(999));
  };

  // When selected date from the quick menu changes
  const changeSelectedDate = (e: RadioChangeEvent) => {
    const selectedDate = e.target.value as string;
    setSelectedDate(selectedDate);
    switch (selectedDate) {
      case "yesterday": {
        setStartDate(
          dayjs().add(-1, "day").hour(0).minute(0).second(0).millisecond(0),
        );
        setEndDate(
          dayjs()
            .add(-1, "day")
            .hour(23)
            .minute(59)
            .second(59)
            .millisecond(999),
        );
        break;
      }
      case "today":
      default: {
        setStartDate(dayjs().hour(0).minute(0).second(0).millisecond(0));
        setEndDate(dayjs().hour(23).minute(59).second(59).millisecond(999));
        break;
      }
      case "tomorrow": {
        setStartDate(
          dayjs().add(1, "day").hour(0).minute(0).second(0).millisecond(0),
        );
        setEndDate(
          dayjs().add(1, "day").hour(23).minute(59).second(59).millisecond(999),
        );
        break;
      }
    }
  };

  const onDateRangeChange = (start: Dayjs, end: Dayjs) => {
    setStartDate(
      dayjs(start).startOf("year").hour(0).minute(0).second(0).millisecond(0),
    );
    setEndDate(
      dayjs(end).endOf("year").hour(23).minute(59).second(59).millisecond(999),
    );
  };

  // Execute update spot prices
  const executeUpdateSpotPrices = () => {
    updateSpotPrices({
      startTime: startDate,
      endTime: endDate,
      timePeriod: timePeriod,
    });
  };

  // Whether to show the update button
  const showUpdateButton = () => {
    const dateNow = dayjs();
    const todayUpdateFrom = dayjs()
      .set("hour", 13)
      .set("minute", 45)
      .set("second", 0)
      .set("ms", 0);
    const todayUpdateTo = dayjs()
      .set("hour", 23)
      .set("minute", 59)
      .set("second", 59)
      .set("ms", 1000);
    const data = spotResponse?.prices ?? [];

    return (
      session &&
      ((selectedDate !== "tomorrow" && data?.length <= 1) ||
        (selectedDate === "tomorrow" &&
          data?.length <= 1 &&
          dateNow.isSameOrAfter(todayUpdateFrom) &&
          dateNow.isSameOrBefore(todayUpdateTo)))
    );
  };

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
                disabledNextDays={1}
                minDate={session ? undefined : spotPriceRange?.min}
              ></DayDatePicker>
            </Col>
            {showUpdateButton() && (
              <Col flex="none">
                {
                  <Button
                    loading={isUpdating}
                    onClick={executeUpdateSpotPrices}
                    icon={!isUpdating && <RedoOutlined />}
                  ></Button>
                }
              </Col>
            )}
          </Row>
        );
      case TimePeriod.P1D:
        return (
          <Row style={{ paddingBottom: 8 }}>
            <Col flex="auto">
              <MonthDatePicker
                value={startDate}
                onChange={onDateChange}
                minDate={session ? undefined : spotPriceRange?.min}
              ></MonthDatePicker>
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
                minDate={session ? undefined : spotPriceRange?.min}
              ></YearDatePicker>
            </Col>
          </Row>
        );
      case TimePeriod.P1Y:
        return (
          <Row style={{ paddingBottom: 8 }}>
            <Col flex="auto">
              <YearRangeDatePicker
                startYear={startDate}
                endYear={endDate}
                onChange={onDateRangeChange}
                minDate={session ? undefined : spotPriceRange?.min}
              />
            </Col>
          </Row>
        );
      default:
        return <></>;
    }
  };

  const isCurrentTimePeriod = (
    time: string | number | Date | Dayjs | undefined,
  ) => {
    switch (timePeriod) {
      case TimePeriod.PT15M:
      case TimePeriod.PT1H:
        return isCurrentHour(time);
      case TimePeriod.P1D:
        return isCurrentDay(time);
      case TimePeriod.P1M:
        return isCurrentMonth(time);
      case TimePeriod.P1Y:
        return isCurrentYear(time);
      default:
        return false;
    }
  };

  const electricityPriceTitle = () => {
    switch (timePeriod) {
      case TimePeriod.PT15M:
      case TimePeriod.PT1H:
        return "Spot-hinta";
      case TimePeriod.P1D:
        return "Päivän keskihinta";
      case TimePeriod.P1M:
        return "Kuukauden keskihinta";
      case TimePeriod.P1Y:
        return "Vuoden keskihinta";
      default:
        return false;
    }
  };

  return (
    <Space
      direction="vertical"
      className="text-center"
      style={{ width: "calc(100vw - 32px)" }}
    >
      {(timePeriod === TimePeriod.PT15M || timePeriod === TimePeriod.PT1H) && (
        <Radio.Group
          value={selectedDate}
          onChange={changeSelectedDate}
          style={{ width: "100%", marginBottom: 12 }}
        >
          <Radio.Button value="yesterday">Eilen</Radio.Button>
          <Radio.Button value="today">Tänään</Radio.Button>
          <Radio.Button value="tomorrow">Huomenna</Radio.Button>
        </Radio.Group>
      )}
      {filters()}
      <SpotPriceSummary spotResponse={spotResponse} settings={settings} />
      <SpotPricesChart
        spotPriceResponse={spotResponse}
        startDate={startDate}
        endDate={endDate}
        settings={settings}
      />
      <Table
        rowClassName={(record, _index) =>
          isCurrentTimePeriod(record.time) ? "table-row-current" : ""
        }
        rowKey={"time"}
        size={"small"}
        dataSource={spotPrices}
        pagination={false}
      >
        <Column
          title=""
          dataIndex="time"
          key="current"
          width={30}
          render={(data: string | number | Date) => (
            <>{isCurrentTimePeriod(data) && <CaretRightFilled />}</>
          )}
        />
        <Column
          title="Aika"
          dataIndex="time"
          key="time"
          render={(data: Dayjs) => dateToSpotTimeString(data, timePeriod)}
        />
        <Column
          title={electricityPriceTitle()}
          dataIndex="price"
          key="electricity_price"
          render={(_data: number, row: ISpotPrice) =>
            ElectricitySpotPrice({ spotPrice: row })
          }
        />
        {(timePeriod === TimePeriod.PT15M ||
          timePeriod === TimePeriod.PT1H) && (
          <Column
            title="Sähkön hinta"
            dataIndex="price"
            key="full_price"
            render={(_data: number, row: ISpotPrice) =>
              ElectricityPrice(row, settings)
            }
          />
        )}
      </Table>
      {session && (
        <Row>
          {
            <Col xs={24} style={{ textAlign: "right" }}>
              {
                <Button loading={isUpdating} onClick={executeUpdateSpotPrices}>
                  Hae hinnat uudelleen
                </Button>
              }
            </Col>
          }
        </Row>
      )}
    </Space>
  );
}
