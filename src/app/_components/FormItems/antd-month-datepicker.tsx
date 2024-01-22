import React, { useState, useEffect } from 'react';
import { Button, DatePicker, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { CaretLeftFilled, CaretRightFilled } from "@ant-design/icons";

const dateFormat = 'MMMM YYYY';

interface MonthDatePickerProps {
    value: Dayjs,
    onChange: (value: Dayjs) => void,
    disabledNextDays?: number
}

export function MonthDatePicker({ value, onChange }: MonthDatePickerProps) {
    const [nextDisabled, setNextDisabled] = useState(false);

    useEffect(() => {
        setNextDisabled(value && dayjs(value).endOf('month').isSame(dayjs().endOf('month')));
    }, [value])

    const nextClick = () => {
        const current = dayjs(value)
        onChange(current.endOf('month').add(1, 'day'));
    }

    const previousClick = () => {
        const current = dayjs(value)
        onChange(current.startOf('month').add(-1, 'day'));
    }

    const disabledDate = (current: Dayjs) => {
        return current && current > dayjs().endOf('day');
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