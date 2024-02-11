import React, { useState, useEffect } from "react";
import { Button, DatePicker, Space } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { CaretLeftFilled, CaretRightFilled } from "@ant-design/icons";

const dateFormat = "YYYY";

interface YearDatePickerProps {
  value: Dayjs;
  onChange: (value: Dayjs) => void;
  disabledNextDays?: number;
  minDate?: Dayjs;
  maxDate?: Dayjs;
}

export function YearDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
}: YearDatePickerProps) {
  const [previousDisabled, setPreviousDisabled] = useState(false);
  const [nextDisabled, setNextDisabled] = useState(false);

  useEffect(() => {
    if (minDate) {
      setPreviousDisabled(
        value && dayjs(value).startOf("year").isBefore(minDate),
      );
    }

    if (maxDate) {
      setNextDisabled(
        value && dayjs(value).endOf("year").isAfter(maxDate),
      );
    } else {
      setNextDisabled(
        value && dayjs(value).endOf("year").isSame(dayjs().endOf("year")),
      );
    }
  }, [value]);

  const nextClick = () => {
    const current = dayjs(value);
    onChange(current.endOf("year").add(1, "day"));
  };

  const previousClick = () => {
    const current = dayjs(value);
    onChange(current.startOf("year").add(-1, "day"));
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
          picker="year"
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
