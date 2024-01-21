import React, { useState, useEffect } from 'react';
import { Button, DatePicker, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { CaretLeftFilled, CaretRightFilled } from "@ant-design/icons";

const dateFormat = 'YYYY';

interface YearDatePickerProps {
    value: Dayjs,
    onChange: (value: Dayjs) => void,
    disabledNextDays?: number
}

export function YearDatePicker({ value, onChange }: YearDatePickerProps) {
    const [nextDisabled, setNextDisabled] = useState(false);

    useEffect(() => {
        setNextDisabled(value && dayjs(value).endOf('year').isSame(dayjs().endOf('year')));
    }, [value])

    const nextClick = () => {
        const current = dayjs(value)
        onChange(current.endOf('year').add(1, 'day'));
    }

    const previousClick = () => {
        const current = dayjs(value)
        onChange(current.startOf('year').add(-1, 'day'));
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