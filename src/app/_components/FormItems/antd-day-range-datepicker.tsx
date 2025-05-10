import React from "react";
import { DatePicker, Space } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import "./antd-day-range-datepicker.css";

const { RangePicker } = DatePicker;
const dateFormat = "DD.MM.YYYY";

declare type EventValue<DateType> = DateType | null;
declare type RangeValue<DateType> =
  | [EventValue<DateType>, EventValue<DateType>]
  | null;

interface DayDatePickerProps {
  startDate: Dayjs;
  endDate?: Dayjs;
  onChange: (start: Dayjs, end?: Dayjs | null) => void;
  disabledNextDays?: number;
  minDate?: Dayjs;
  maxDate?: Dayjs;
}

export function DayRangeDatePicker({
  startDate,
  endDate,
  onChange,
  disabledNextDays = 0,
  minDate,
  maxDate,
}: DayDatePickerProps) {
  const disabledDate = (current: Dayjs) => {
    if (minDate && maxDate) {
      return (
        current &&
        (current.isBefore(minDate, "day") || current.isAfter(maxDate, "day"))
      );
    }

    if (minDate) {
      return minDate && current && current.isBefore(minDate, "day");
    }

    if (maxDate) {
      return maxDate && current && current.isAfter(maxDate, "day");
    }

    return (
      current && current > dayjs().add(disabledNextDays, "day").endOf("day")
    );
  };

  return (
    <>
      <Space wrap>
        <RangePicker
          allowClear={false}
          inputReadOnly={true}
          variant={"outlined"}
          value={[dayjs(startDate), endDate ? dayjs(endDate) : null]}
          format={dateFormat}
          disabledDate={disabledDate}
          picker="date"
          onChange={(range: RangeValue<Dayjs>) =>
            onChange(range?.[0] ?? dayjs(), range?.[1])
          }
        />
      </Space>
    </>
  );
}
