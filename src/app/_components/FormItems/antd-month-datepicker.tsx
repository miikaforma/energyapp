import React, { useState, useEffect } from "react";
import { Button, DatePicker, Space } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { CaretLeftFilled, CaretRightFilled } from "@ant-design/icons";

const dateFormat = "MMMM YYYY";

interface MonthDatePickerProps {
  value: Dayjs;
  onChange: (value: Dayjs) => void;
  disabledNextDays?: number;
  minDate?: Dayjs;
  maxDate?: Dayjs;
}

export function MonthDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
}: MonthDatePickerProps) {
  const [previousDisabled, setPreviousDisabled] = useState(false);
  const [nextDisabled, setNextDisabled] = useState(false);

  useEffect(() => {
    if (minDate) {
      setPreviousDisabled(
        value && dayjs(value).startOf("month").isBefore(minDate),
      );
    }

    if (maxDate) {
      setNextDisabled(
        value && dayjs(value).endOf("month").isAfter(maxDate),
      );
    } else {
      setNextDisabled(
        value && dayjs(value).endOf("month").isSame(dayjs().endOf("month")),
      );
    }
  }, [value]);

  const nextClick = () => {
    const current = dayjs(value);
    onChange(current.endOf("month").add(1, "day"));
  };

  const previousClick = () => {
    const current = dayjs(value);
    onChange(current.startOf("month").add(-1, "day"));
  };

  const disabledDate = (current: Dayjs) => {
    if (minDate && maxDate) {
      return (
        current &&
        (current.isBefore(minDate, "day") ||
          current.isAfter(maxDate, "day"))
      );
    }

    if (minDate) {
      return (
        minDate && current && current.isBefore(minDate, "day")
      );
    }

    if (maxDate) {
      return maxDate && current && current.isAfter(maxDate, "day");
    }

    return current && current > dayjs().endOf("day");
  };

  return (
    <>
      <Space wrap>
        <Button
          type="text"
          icon={<CaretLeftFilled />}
          onClick={previousClick}
          disabled={previousDisabled}
        />
        <DatePicker
          allowClear={false}
          inputReadOnly={true}
          variant={"outlined"}
          value={dayjs(value)}
          onChange={(value: Dayjs | null) => onChange(value ?? dayjs())}
          format={dateFormat}
          // showToday={true}
          disabledDate={disabledDate}
          picker="month"
        />
        <Button
          type="text"
          icon={<CaretRightFilled />}
          onClick={nextClick}
          disabled={nextDisabled}
        />
      </Space>
    </>
  );
}
