"use client";

import { DayDatePicker } from "@energyapp/app/_components/FormItems/antd-day-datepicker";
import { api } from "@energyapp/trpc/react";
import {
  Col,
  Radio,
  type RadioChangeEvent,
  Row,
  Select,
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
import { TimePeriod } from "@energyapp/shared/enums";
import { ShellyConsumption, type ISpotPrice } from "@energyapp/shared/interfaces";
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
import { ElectricitySpotPrice } from "@energyapp/app/_components/ColumnRenders/SpotPrice/electricity-spot-price";
import { YearRangeDatePicker } from "@energyapp/app/_components/FormItems/antd-year-range-datepicker";
import { useSearchParams } from "next/navigation";
import useGetShellyRange from "@energyapp/app/_hooks/queries/useGetShellyRange";
import useGetShellyConsumptions from "@energyapp/app/_hooks/queries/useGetShellyConsumptions";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

type ShellyConsumptionPageProps = {
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

export default function ShellyConsumptionPage({
  timePeriod,
}: ShellyConsumptionPageProps) {
  const searchParams = useSearchParams();
  const dateQuery = searchParams.get("date");

  const { data: session } = useSession();
  const [startDate, setStartDate] = useState(
    getDefaultStartDate(timePeriod, dateQuery ? dayjs(dateQuery) : undefined),
  );
  const [endDate, setEndDate] = useState(
    getDefaultEndDate(timePeriod, dateQuery ? dayjs(dateQuery) : undefined),
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
  const [consumptions, setConsumptions] = useState<ShellyConsumption[]>();
  const [filteredConsumptions, setFilteredConsumptions] = useState<ShellyConsumption[]>();

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
  const { data: shellyConsumptions, prefetch: prefetchShellyConsumptions } =
    useGetShellyConsumptions({
      timePeriod: timePeriod,
      startTime: startDate,
      endTime: endDate,
    });

  // Set consumptions
  useEffect(() => {
    setConsumptions(shellyConsumptions?.consumptions ?? []);
  }, [shellyConsumptions, selectedDeviceId]);

  // Filter consumptions
  useEffect(() => {
    setFilteredConsumptions(filterConsumptions(consumptions ?? [], selectedDeviceId));
    console.log('Setting filtered consumptions');
  }, [consumptions, selectedDeviceId]);

  const filterConsumptions = (consumptions: ShellyConsumption[], selectedDeviceId?: string) => {
    if (selectedDeviceId) {
      return consumptions.filter(
        (consumption) => consumption.device_id === selectedDeviceId,
      );
    }
    return [];
  }

  // Prefetch consumptions when date changes
  useEffect(() => {
    prefetchShellyConsumptions({
      utils,
      timePeriod: timePeriod,
      startTime: startDate,
      endTime: endDate,
    });
  }, [startDate, endDate]);

  // Prefetch consumptions when date changes
  useEffect(() => {
    // Call the function to refresh the data immediately when the component mounts
    prefetchShellyConsumptions({
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
        prefetchShellyConsumptions({
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
                minDate={session ? undefined : shellyRange?.min}
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
                minDate={session ? undefined : shellyRange?.min}
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
                minDate={session ? undefined : shellyRange?.min}
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
                minDate={session ? undefined : shellyRange?.min}
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

  const handleChange = (value: string) => {
    setSelectedDeviceId(value);
  };

  const uniqueConsumptions = Array.from(
    new Set(consumptions?.map((consumption) => consumption.device_id)),
  ).map((id) =>
    consumptions?.find((consumption) => consumption.device_id === id),
  );

  const options = uniqueConsumptions.map((consumption) => ({
    value: consumption?.device_id,
    label: consumption?.device_name ?? consumption?.device_id,
  }));

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

      <Select style={{ width: 200 }} options={options} onChange={handleChange} />
      {/* <SpotPriceSummary spotResponse={spotResponse} />
      <SpotPricesChart
        spotPriceResponse={spotResponse}
        startDate={startDate}
        endDate={endDate}
      /> */}
      <Table
        rowClassName={(record, _index) =>
          isCurrentTimePeriod(record.time) ? "table-row-current" : ""
        }
        rowKey={"time"}
        size={"small"}
        dataSource={filteredConsumptions}
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
          title="Laite"
          dataIndex="device_name"
          key="device
        _id"
        />
        <Column title="Tiedot" 
          dataIndex="device_id"
          key="device_id"
          width={100}
          align="center"
          render={(device_id: string, record: ShellyConsumption) => {
            return (
              <Row gutter={[4, 4]}>
                <Col span={24}><Tag style={{ width: '80px', display: 'inline-block', textAlign: 'center' }}>{(record.consumption / 1000).toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh</Tag></Col>
                <Col span={24}><Tag style={{ width: '80px', display: 'inline-block', textAlign: 'center' }}>{record.avg_temperature_c.toLocaleString('fi-FI', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} °C</Tag></Col>
                <Col span={24}><Tag style={{ width: '80px', display: 'inline-block', textAlign: 'center' }}>{(record.avg_apower / 1000).toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} W</Tag></Col>
                <Col span={24}><Tag style={{ width: '80px', display: 'inline-block', textAlign: 'center' }}>{record.avg_voltage.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} V</Tag></Col>
                {/* <Col span={24}><Tag style={{ width: '80px', display: 'inline-block', textAlign: 'center' }}>{record.avg_freq.toLocaleString('fi-FI', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Hz</Tag></Col> */}
                <Col span={24}><Tag style={{ width: '80px', display: 'inline-block', textAlign: 'center' }}>{record.avg_current.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} A</Tag></Col>
              </Row>
            );
          }}
        />

        {/* <Column title="Kulutus" dataIndex="consumption" key="consumption" /> */}
        {/* <Column title="Kulutus" dataIndex="consumption2" key="consumption2" /> */}
        {/* <Column
          title="Lämpötila (°C)"
          dataIndex="avg_temperature_c"
          key="avg_temperature_c"
        />
        <Column
          title="Lämpötila (°F)"
          dataIndex="avg_temperature_f"
          key="avg_temperature_f"
        />
        <Column title="Teho (W)" dataIndex="avg_apower" key="avg_apower" />
        <Column title="Jännite (V)" dataIndex="avg_voltage" key="avg_voltage" />
        <Column title="Taajuus (Hz)" dataIndex="avg_freq" key="avg_freq" />
        <Column title="Virta (A)" dataIndex="avg_current" key="avg_current" /> */}

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
