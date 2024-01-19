'use client';

import dayjs, { Dayjs } from "dayjs";
import { ChangeEvent, useState } from "react";
import { CSSProperties } from 'react';
import Datepicker, { DateType, DateValueType } from "react-tailwindcss-datepicker";

interface SelectBoxProps {
    startDate: Dayjs;
    endDate: Dayjs;
    setStartDate?: (date: Dayjs) => void;
    setEndDate?: (date: Dayjs) => void;
}

export interface SelectBoxOption {
    key: string;
    value: string;
    label: string;
}

export default function DateRangePicker({ startDate, endDate, setStartDate, setEndDate }: SelectBoxProps) {
    const [value, setValue] = useState<DateValueType>({
        startDate: dayjs(startDate).toDate(),
        endDate: dayjs(endDate).toDate(),
    });

    const handleValueChange = (newValue: DateValueType) => {
        setValue(newValue);
        if (setStartDate && newValue?.startDate) {
            setStartDate(dayjs(newValue.startDate));
        }
        if (setEndDate && newValue?.endDate) {
            setEndDate(dayjs(newValue.endDate));
        }
    }

    return (
        <Datepicker
            showShortcuts={true}
            value={value}
            onChange={handleValueChange}
            i18n="fi"
            displayFormat="DD.MM.YYYY"
            configs={{
                shortcuts: {
                    today: "Tänään",
                    yesterday: "Eilen",
                    past: period => `Viime ${period}  päivää`,
                    currentMonth: "Nykyinen kuukausi",
                    pastMonth: "Viime kuukausi",
                    currentYear: {
                        text: "Tämä vuosi",
                        period: {
                            start: dayjs().startOf('year').format('YYYY-MM-DD'),
                            end: dayjs().endOf('year').format('YYYY-MM-DD')
                        },
                    },
                    pastYear: {
                        text: "Viime vuosi",
                        period: {
                            start: dayjs().subtract(1, 'year').startOf('year').format('YYYY-MM-DD'),
                            end: dayjs().subtract(1, 'year').endOf('year').format('YYYY-MM-DD')
                        },
                    },
                }
            }}
            containerClassName='relative w-full text-gray-700 z-2000'
        />
    );
}