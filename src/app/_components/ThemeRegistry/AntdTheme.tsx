'use client';

import * as React from 'react';
import { ConfigProvider, theme } from "antd"
import locale from 'antd/locale/fi_FI';

import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import 'dayjs/locale/fi';

dayjs.extend(updateLocale)

dayjs.updateLocale('fi', {
  months: [
    "Tammikuu", "Helmikuu", "Maaliskuu", "Huhtikuu", "Toukokuu", "Kesäkuu", "Heinäkuu",
    "Elokuu", "Syyskuu", "Lokakuu", "Marraskuu", "Joulukuu"
  ],
  monthsShort: [
    "Tammi", "Helmi", "Maalis", "Huhti", "Touko", "Kesä",
    "Heinä", "Elo", "Syys", "Loka", "Marras", "Joulu"
  ]
})

dayjs.locale('fi')

export default function AntdTheme({ children }: { children: React.ReactNode }) {
    const { defaultAlgorithm, darkAlgorithm } = theme

    return (
        <ConfigProvider
            locale={locale}
            theme={{
                algorithm: darkAlgorithm,
            }}>
            {children}
        </ConfigProvider>
    );
}