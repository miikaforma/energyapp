import React, { useState, useEffect } from "react";
import { Button, DatePicker, Space } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { CaretLeftFilled, CaretRightFilled } from "@ant-design/icons";

const dateFormat = "DD.MM.YYYY";

interface DayDatePickerProps {
  value?: Dayjs;
  onChange: (value: Dayjs | null) => void;
  disabledNextDays?: number;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  allowClear?: boolean;
}

export function DayDatePicker({
  value,
  onChange,
  disabledNextDays = 0,
  minDate,
  maxDate,
  allowClear = false,
}: DayDatePickerProps) {
  const [previousDisabled, setPreviousDisabled] = useState(false);
  const [nextDisabled, setNextDisabled] = useState(false);

  useEffect(() => {
    if (minDate && value) {
      setPreviousDisabled(value && value.add(-1, "day").isBefore(minDate));
    }

    if (maxDate && value) {
      setNextDisabled(value && value.add(1, "day").isAfter(maxDate));
    } else if (value) {
      // Should remove this and apply the minDate/disabledAfter properly everywhere
      setNextDisabled(
        value &&
          value >
            dayjs()
              .add(disabledNextDays - 1, "day")
              .endOf("day"),
      );
    }
  }, [value]);

  const nextClick = () => {
    const current = dayjs(value);
    onChange(current.add(1, "day"));
  };

  const previousClick = () => {
    const current = dayjs(value);
    onChange(current.add(-1, "day"));
  };

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
        {value && (
          <Button
            type="text"
            icon={<CaretLeftFilled />}
            onClick={previousClick}
            disabled={previousDisabled}
          />
        )}
        <DatePicker
          allowClear={allowClear}
          inputReadOnly={true}
          variant={"outlined"}
          value={value ? dayjs(value) : undefined}
          onChange={(value: Dayjs | null) => onChange(allowClear ? value : value ?? dayjs())}
          format={dateFormat}
          showToday={true}
          disabledDate={disabledDate}
        />
        {value && (
          <Button
            type="text"
            icon={<CaretRightFilled />}
            onClick={nextClick}
            disabled={nextDisabled}
          />
        )}
      </Space>
    </>
  );
}
