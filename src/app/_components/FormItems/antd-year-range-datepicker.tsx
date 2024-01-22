import React from 'react';
import { DatePicker, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import './antd-year-range-datepicker.css'

const { RangePicker } = DatePicker;
const dateFormat = 'YYYY';

declare type EventValue<DateType> = DateType | null;
declare type RangeValue<DateType> = [EventValue<DateType>, EventValue<DateType>] | null;

interface YearRangeDatePickerProps {
    startYear: Dayjs,
    endYear: Dayjs,
    onChange: (start: Dayjs, end: Dayjs) => void,
    disabledNextDays?: number
}

export function YearRangeDatePicker({ startYear, endYear, onChange }: YearRangeDatePickerProps) {
    const disabledDate = (current: Dayjs) => {
        return current && (current > dayjs().endOf('day') || current.year() <= 2014);
    }

    return (
        <>
            <Space wrap>
                <RangePicker
                    allowClear={false}
                    inputReadOnly={true}
                    variant={'outlined'}
                    value={[dayjs(startYear), dayjs(endYear)]}
                    format={dateFormat}
                    disabledDate={disabledDate}
                    picker="year"
                    onChange={(range: RangeValue<Dayjs>) => onChange(range?.[0] ?? dayjs(), range?.[1] ?? dayjs())}
                />
            </Space>
        </>
    );
}