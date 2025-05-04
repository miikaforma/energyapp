"use client";

import { DayDatePicker } from "@energyapp/app/_components/FormItems/antd-day-datepicker";
import { api } from "@energyapp/trpc/react";
import {
  Col,
  Radio,
  type RadioChangeEvent,
  Row,
  Space,
  Table,
  Tag,
} from "antd";
const { Column } = Table;
import { CaretRightFilled } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { ShellyViewType, TimePeriod } from "@energyapp/shared/enums";
import { type ShellyConsumption } from "@energyapp/shared/interfaces";
import {
  dateToShellyTimeString,
  dateToSpotTimeString,
  isCurrentDay,
  isCurrentHour,
  isCurrentMinute,
  isCurrentMonth,
  isCurrentYear,
} from "@energyapp/utils/timeHelpers";
import { YearDatePicker } from "@energyapp/app/_components/FormItems/antd-year-datepicker";
import { MonthDatePicker } from "@energyapp/app/_components/FormItems/antd-month-datepicker";
import { useSession } from "next-auth/react";
import { ElectricitySpotPrice } from "@energyapp/app/_components/ColumnRenders/SpotPrice/electricity-spot-price";
import { YearRangeDatePicker } from "@energyapp/app/_components/FormItems/antd-year-range-datepicker";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import useGetShellyRange from "@energyapp/app/_hooks/queries/useGetShellyRange";
import useGetShellyConsumptions from "@energyapp/app/_hooks/queries/useGetShellyConsumptions";
import { Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  convertAmps,
  convertFrequency,
  convertMilliwatts,
  convertVoltage,
  convertWatts,
  getTemperatureC,
} from "@energyapp/utils/powerHelpers";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

type ShellyConsumptionPageProps = {
  timePeriod: TimePeriod;
  viewType: ShellyViewType;
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

export default function ShellyConsumptionPage({
  timePeriod,
  viewType,
}: ShellyConsumptionPageProps) {
  const params = useParams();
  const deviceId = params.deviceId;
  const groupKey = params.groupKey;
  const shellyId =
    viewType === ShellyViewType.DEVICE
      ? deviceId?.toString()
      : groupKey?.toString();

  const router = useRouter();
  const enablePrefetch = false;
  const searchParams = useSearchParams();
  const dateQuery = searchParams.get("date");

  const { data: session } = useSession();
  const [startDate, setStartDate] = useState(
    getDefaultStartDate(timePeriod, dateQuery ? dayjs(dateQuery) : undefined),
  );
  const [endDate, setEndDate] = useState(
    getDefaultEndDate(timePeriod, dateQuery ? dayjs(dateQuery) : undefined),
  );

  const utils = api.useUtils();

  // Get the current hour
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [selectedDate, setSelectedDate] = useState(
    getSelectedDate(dateQuery ? dayjs(dateQuery) : dayjs()),
  );

  // Get shelly range
  const { data: shellyRange } = useGetShellyRange({
    timePeriod: timePeriod,
  });

  // Get consumptions
  const { data: shellyConsumptions, isLoading, prefetch: prefetchShellyConsumptions } =
    useGetShellyConsumptions({
      timePeriod: timePeriod,
      startTime: startDate,
      endTime: endDate,
      viewType: viewType,
      id: shellyId,
    });

  // Prefetch consumptions when date changes
  useEffect(() => {
    if (enablePrefetch) {
      prefetchShellyConsumptions({
        utils,
        timePeriod: timePeriod,
        startTime: startDate,
        endTime: endDate,
      });
    }
  }, [startDate, endDate]);

  // Prefetch consumptions when date changes
  useEffect(() => {
    // Call the function to refresh the data immediately when the component mounts
    if (enablePrefetch) {
      prefetchShellyConsumptions({
        utils,
        timePeriod: timePeriod,
        startTime: startDate,
        endTime: endDate,
      });
    }

    // Set an interval to check every 10 seconds if the hour has changed
    const intervalId = setInterval(() => {
      console.log("Checking if the hour has changed");
      const newHour = new Date().getHours();
      if (newHour !== currentHour) {
        // If the hour has changed, update the state and refresh the data
        setCurrentHour(newHour);
        if (enablePrefetch) {
          prefetchShellyConsumptions({
            utils,
            timePeriod: timePeriod,
            startTime: startDate,
            endTime: endDate,
          });
        }

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
                disabledNextDays={0}
                minDate={session ? shellyRange?.min : undefined}
                maxDate={session ? shellyRange?.max : undefined}
              ></DayDatePicker>
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
                minDate={session ? shellyRange?.min : undefined}
                maxDate={session ? shellyRange?.max : undefined}
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
                minDate={session ? shellyRange?.min : undefined}
                maxDate={session ? shellyRange?.max : undefined}
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
                minDate={session ? shellyRange?.min : undefined}
                maxDate={session ? shellyRange?.max : undefined}
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
        return isCurrentMinute(time);
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

  const onRangeChange = (e: RadioChangeEvent) => {
    const value = e.target.value as string;
    router.push(`${value}`);
  };

  return (
    <Space
      direction="vertical"
      className="text-center"
      style={{ width: "calc(100vw - 32px)" }}
    >
      <Radio.Group
        value={timePeriod}
        onChange={onRangeChange}
        style={{ width: "100%", marginBottom: 12 }}
      >
        <Radio.Button key={TimePeriod.P1Y} value={TimePeriod.P1Y}>
          Vuosi
        </Radio.Button>
        <Radio.Button key={TimePeriod.P1M} value={TimePeriod.P1M}>
          Kuukausi
        </Radio.Button>
        <Radio.Button key={TimePeriod.P1D} value={TimePeriod.P1D}>
          Päivä
        </Radio.Button>
        <Radio.Button key={TimePeriod.PT1H} value={TimePeriod.PT1H}>
          Tunti
        </Radio.Button>
        <Radio.Button key={TimePeriod.PT15M} value={TimePeriod.PT15M}>
          15 Minuuttia
        </Radio.Button>
      </Radio.Group>
      {(timePeriod === TimePeriod.PT15M || timePeriod === TimePeriod.PT1H) && (
        <Radio.Group
          value={selectedDate}
          onChange={changeSelectedDate}
          style={{ width: "100%", marginBottom: 12 }}
        >
          <Radio.Button value="yesterday">Eilen</Radio.Button>
          <Radio.Button value="today">Tänään</Radio.Button>
        </Radio.Group>
      )}
      {filters()}

      <Box sx={{ textAlign: "left" }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          href="/consumptions/shelly"
        >
          Takaisin laitevalintaan
        </Button>
      </Box>
      <Table
        rowClassName={(record, _index) =>
          isCurrentTimePeriod(record.time) ? "table-row-current" : ""
        }
        rowKey={"time"}
        size={"small"}
        dataSource={shellyConsumptions?.consumptions}
        pagination={false}
        loading={isLoading}
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
          render={(data: Dayjs) => dateToShellyTimeString(data, timePeriod)}
        />
        <Column
          title="Laite"
          dataIndex="device_name"
          key="device
        _id"
        />
        {/* <Column
          title="Tiedot"
          dataIndex="device_id"
          key="device_id"
          width={100}
          align="center"
          render={(device_id: string, record: ShellyConsumption) => {
            return (
              <Row gutter={[4, 4]}>
                <Col span={24}>
                  <Tag
                    style={{
                      width: "80px",
                      display: "inline-block",
                      textAlign: "center",
                    }}
                  >
                    {(record.consumption / 1000).toLocaleString("fi-FI", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    kWh
                  </Tag>
                </Col>
                <Col span={24}>
                  <Tag
                    style={{
                      width: "80px",
                      display: "inline-block",
                      textAlign: "center",
                    }}
                  >
                    {record.avg_temperature_c?.toLocaleString("fi-FI", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 2,
                    })}{" "}
                    °C
                  </Tag>
                </Col>
                <Col span={24}>
                  <Tag
                    style={{
                      width: "80px",
                      display: "inline-block",
                      textAlign: "center",
                    }}
                  >
                    {(record.avg_apower / 1000).toLocaleString("fi-FI", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    W
                  </Tag>
                </Col>
                <Col span={24}>
                  <Tag
                    style={{
                      width: "80px",
                      display: "inline-block",
                      textAlign: "center",
                    }}
                  >
                    {record.avg_voltage?.toLocaleString("fi-FI", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    V
                  </Tag>
                </Col>
                <Col span={24}>
                  <Tag
                    style={{
                      width: "80px",
                      display: "inline-block",
                      textAlign: "center",
                    }}
                  >
                    {record.avg_current?.toLocaleString("fi-FI", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    A
                  </Tag>
                </Col>
              </Row>
            );
          }}
        /> */}

        <Column
          title="Kulutus"
          dataIndex="consumption"
          key="consumption"
          render={(data: number) => convertMilliwatts(data)}
        />
        {/* <Column title="Kulutus" dataIndex="consumption2" key="consumption2" /> */}
        <Column
          title="Lämpötila (°C)"
          dataIndex="avg_temperature_c"
          key="avg_temperature_c"
          render={(data: number) => getTemperatureC(data)}
        />
        {/* <Column
          title="Lämpötila (°F)"
          dataIndex="avg_temperature_f"
          key="avg_temperature_f"
        /> */}
        <Column
          title="Teho"
          dataIndex="avg_apower"
          key="avg_apower"
          render={(data: number) => convertWatts(data)}
        />
        <Column
          title="Jännite (V)"
          dataIndex="avg_voltage"
          key="avg_voltage"
          render={(data: number) => convertVoltage(data)}
        />
        <Column
          title="Taajuus (Hz)"
          dataIndex="avg_freq"
          key="avg_freq"
          render={(data: number) => convertFrequency(data)}
        />
        <Column
          title="Virta (A)"
          dataIndex="avg_current"
          key="avg_current"
          render={(data: number) => convertAmps(data)}
        />

        {/* <Column
          title={electricityPriceTitle()}
          dataIndex="price"
          key="electricity_price"
          render={(_data: number, row: ISpotPrice) =>
            ElectricitySpotPrice({ spotPrice: row })
          }
        /> */}
        {/* {(timePeriod === TimePeriod.PT15M ||
          timePeriod === TimePeriod.PT1H) && (
          <Column
            title="Sähkön hinta"
            dataIndex="price"
            key="full_price"
            render={(_data: number, row: ISpotPrice) =>
              ElectricityPrice(row, settings)
            }
          />
        )} */}
      </Table>
    </Space>
  );
}
