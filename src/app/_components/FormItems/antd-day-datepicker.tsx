import React, { useState, useEffect } from 'react';
import { Button, DatePicker, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { CaretLeftFilled, CaretRightFilled } from "@ant-design/icons";

const dateFormat = 'DD.MM.YYYY';

interface DayDatePickerProps {
    value: Dayjs,
    onChange: (value: Dayjs) => void,
    disabledNextDays?: number
}

export function DayDatePicker({ value, onChange, disabledNextDays = 0 }: DayDatePickerProps) {
    const [nextDisabled, setNextDisabled] = useState(false);

    useEffect(() => {
        setNextDisabled(value && value > dayjs().add(disabledNextDays - 1, 'day').endOf('day'));
    }, [value])

    const nextClick = () => {
        const current = dayjs(value)
        onChange(current.add(1, 'day'));
    }

    const previousClick = () => {
        const current = dayjs(value)
        onChange(current.add(-1, 'day'));
    }

    const disabledDate = (current: Dayjs) => {
        return current && current > dayjs().add(disabledNextDays, 'day').endOf('day');
    }

    return (
        <>
            <Space wrap>
                <Button
                    type="text"
                    icon={<CaretLeftFilled />}
                    onClick={previousClick}
                />
                <DatePicker
                    allowClear={false}
                    inputReadOnly={true}
                    variant={'outlined'}
                    value={dayjs(value)}
                    onChange={(value: Dayjs | null) => onChange(value ?? dayjs())}
                    format={dateFormat}
                    showToday={true}
                    disabledDate={disabledDate}
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