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
import TankillePriceHistory from "@energyapp/app/_components/Charts/tankille-price-history";
import useGetFuelPriceHistory from "@energyapp/app/_hooks/queries/useGetFuelPriceHistory";
import TankillePriceTable from "@energyapp/app/_components/Tankille/weekly-price-table";
import { displayFuelType } from "@energyapp/utils/valueHelpers";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Page() {
  const [fuelType, setFuelType] = useState("95");

  const [startDate, setStartDate] = useState<Dayjs>(
    dayjs().add(-14, "day").startOf("day"),
  );
  const [endDate, setEndDate] = useState<Dayjs | undefined>(dayjs());

  const { data: priceHistory, isLoading: isLoading } = useGetFuelPriceHistory({
    startTime: startDate.startOf("day"),
    endTime: endDate?.endOf("day") ?? dayjs().endOf("day"),
  });

  const { data: datePickerRange } = useGetFuelPricesRange();
  const { data: stations, isLoading: loadingStations } = useGetFuelStations({
    startTime: startDate.hour(0),
    endTime: endDate?.endOf("day"),
  });

  if (!priceHistory || priceHistory.length === 0) {
    return <p style={{ color: "grey" }}>Historiatietoja ei löytynyt</p>;
  }

  const fuelTypes = Array.from(new Set(priceHistory.map((item) => item.fuel)));

  const onDateChange = (startDate: Dayjs, endDate?: Dayjs | null) => {
    console.log("onDateChange", startDate, endDate);
    setStartDate(dayjs(startDate).startOf("day"));
    setEndDate(endDate ? dayjs(endDate).endOf("day") : dayjs().endOf("day"));
  };

  const handleFuelTypeChange = (event: SelectChangeEvent) => {
    setFuelType(event.target.value);
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
      <FormControl fullWidth>
        <InputLabel id="fueltype-select-label">Polttoaine</InputLabel>
        <Select
          labelId="fueltype-select-label"
          id="fueltype-select"
          value={fuelType}
          label="FuelType"
          onChange={handleFuelTypeChange}
        >
          {fuelTypes.map((fuelType) => (
            <MenuItem key={fuelType} value={fuelType}>
              {displayFuelType(fuelType)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TankillePriceHistory
        priceHistory={priceHistory}
        fuelType={fuelType}
        isLoading={isLoading}
      />
      <TankillePriceTable
        priceHistory={priceHistory}
        fuelType={fuelType}
        isLoading={isLoading}
      />
      <TankilleStationList
        stations={stations}
        loadingStations={loadingStations}
      />
    </Space>
  );
}
