'use client';
import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { ConfigProvider, theme } from "antd"
import locale from 'antd/locale/fi_FI';

// @ts-ignore
export default function AntdTheme({ children }) {
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