"use client";

import { useState } from "react";
import Datepicker, { type DateValueType } from "react-tailwindcss-datepicker";

import dayjs, { type Dayjs } from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/fi";

dayjs.extend(updateLocale);

dayjs.updateLocale("fi", {
  months: [
    "Tammikuu",
    "Helmikuu",
    "Maaliskuu",
    "Huhtikuu",
    "Toukokuu",
    "Kesäkuu",
    "Heinäkuu",
    "Elokuu",
    "Syyskuu",
    "Lokakuu",
    "Marraskuu",
    "Joulukuu",
  ],
  monthsShort: [
    "Tammi",
    "Helmi",
    "Maalis",
    "Huhti",
    "Touko",
    "Kesä",
    "Heinä",
    "Elo",
    "Syys",
    "Loka",
    "Marras",
    "Joulu",
  ],
  relativeTime: {
    future: "%s päästä",
    past: "%s sitten",
    s: "%d sekuntia",
    m: "minuutti",
    mm: "%d minuuttia",
    h: "tunti",
    hh: "%d tuntia",
    d: "päivä",
    dd: "%d päivää",
    M: "kuukausi",
    MM: "%d kuukautta",
    y: "vuosi",
    yy: "%d vuotta",
  },
});

dayjs.locale("fi");

interface SelectBoxProps {
  startDate: Dayjs;
  endDate: Dayjs;
  setStartDate?: (date: Dayjs) => void;
  setEndDate?: (date: Dayjs) => void;
  minDate?: Dayjs;
  maxDate?: Dayjs;
}

export interface SelectBoxOption {
  key: string;
  value: string;
  label: string;
}

export default function DateRangePicker({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  minDate,
  maxDate,
}: SelectBoxProps) {
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
  };

  return (
    <Datepicker
      startWeekOn="mon"
      showShortcuts={true}
      value={value}
      onChange={handleValueChange}
      i18n="fi"
      displayFormat="DD.MM.YYYY"
      configs={{
        shortcuts: {
          today: "Tänään",
          yesterday: "Eilen",
          past: (period) => `Viime ${period}  päivää`,
          currentMonth: "Nykyinen kuukausi",
          pastMonth: "Viime kuukausi",
          currentYear: {
            text: "Tämä vuosi",
            period: {
              start: dayjs().startOf("year").format("YYYY-MM-DD"),
              end: dayjs().endOf("year").format("YYYY-MM-DD"),
            },
          },
          pastYear: {
            text: "Viime vuosi",
            period: {
              start: dayjs()
                .subtract(1, "year")
                .startOf("year")
                .format("YYYY-MM-DD"),
              end: dayjs()
                .subtract(1, "year")
                .endOf("year")
                .format("YYYY-MM-DD"),
            },
          },
        },
      }}
      minDate={minDate ? dayjs(minDate).toDate() : undefined}
      maxDate={maxDate ? dayjs(maxDate).toDate() : undefined}
      readOnly={true}
      containerClassName="relative w-full text-gray-700 z-2000"
    />
  );
}
