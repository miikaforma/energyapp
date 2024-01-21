'use client';

import { type ChangeEvent, useState } from "react";
import { type CSSProperties } from 'react';

interface SelectBoxProps {
    id: string;
    options: SelectBoxOption[];
    label?: string;
    onChange?: (value: string) => void;
    labelStyle?: CSSProperties;
    style?: CSSProperties;
}

export interface SelectBoxOption {
    key: string;
    value: string;
    label: string;
}

export default function SelectBox({ id, options, label, onChange, labelStyle, style }: SelectBoxProps) {
    const [selectedValue, selectValue] = useState<string>(options?.[0]?.value ?? '');

    const onValueChange = (event: ChangeEvent<HTMLSelectElement>) => {
        selectValue(event.target.value);
        if (onChange) {
            onChange(event.target.value);
        }
    }

    return (
        <div>
            {label && <label
                htmlFor={id}
                className="block mb-2 text-sm font-medium text-white dark:text-white"
                style={labelStyle}
            >{label}</label>}
            <select
                id={id}
                onChange={onValueChange}
                value={selectedValue}
                className="mb-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                style={style}
            >
                {options.map(option => <option key={option.key} value={option.value}>{option.label}</option>)}
            </select>
        </div>
    );
}