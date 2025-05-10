"use client";

import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useState } from "react";
import { Space } from "antd";
import useGetFuelStations from "@energyapp/app/_hooks/queries/useGetFuelStations";
import useGetFuelPricesRange from "@energyapp/app/_hooks/queries/useGetFuelPricesRange";
import TankilleStationList from "@energyapp/app/_components/Tankille/station-list";
import { DayRangeDatePicker } from "@energyapp/app/_components/FormItems/antd-day-range-datepicker";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Page() {
  const [startDate, setStartDate] = useState<Dayjs>(
    dayjs().add(-14, "day").startOf("day"),
  );
  const [endDate, setEndDate] = useState<Dayjs | undefined>(dayjs());

  const { data: datePickerRange } = useGetFuelPricesRange();
  const { data: stations, isLoading: loadingStations } = useGetFuelStations({
    startTime: startDate.hour(0),
    endTime: endDate?.endOf("day"),
  });

  const onDateChange = (startDate: Dayjs, endDate?: Dayjs | null) => {
    console.log("onDateChange", startDate, endDate);
    setStartDate(dayjs(startDate).startOf("day"));
    setEndDate(endDate ? dayjs(endDate).endOf("day") : dayjs().endOf("day"));
  };

  return (
    <Space
      direction="vertical"
      className="text-center"
      style={{ width: "calc(100vw - 32px)" }}
    >
      <DayRangeDatePicker
        startDate={startDate}
        endDate={endDate}
        onChange={onDateChange}
        minDate={datePickerRange?.min}
        maxDate={datePickerRange?.max}
      ></DayRangeDatePicker>

      <TankilleStationList
        stations={stations}
        loadingStations={loadingStations}
      />
    </Space>
  );
}
