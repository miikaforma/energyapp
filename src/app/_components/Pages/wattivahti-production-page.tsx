'use client';

import { DayDatePicker } from "@energyapp/app/_components/FormItems/antd-day-datepicker";
import { api } from "@energyapp/trpc/react";
import { Button, Col, Row, Space, Table } from "antd";
import { RedoOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";

import { useEffect, useState } from "react";

import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { TimePeriod } from "@energyapp/shared/enums";
import { type IWattiVahtiProduction } from "@energyapp/shared/interfaces";
import { dateToTableString } from "@energyapp/utils/timeHelpers";
import useGetWattiVahtiProductions from "@energyapp/app/_hooks/queries/useGetWattiVahtiProductions";
import useUpdateWattiVahti from "@energyapp/app/_hooks/mutations/useUpdateWattiVahti";
import { AlertWarning } from "@energyapp/app/_components/Alerts/alert-warning";
import { WattiVahtiProduction } from "@energyapp/app/_components/ColumnRenders/WattiVahti/wattivahti-production";
import { WattiVahtiProductionPrice } from "@energyapp/app/_components/ColumnRenders/WattiVahti/wattivahti-production-price";
import WattiVahtiProductionSummary from "@energyapp/app/_components/Descriptions/wattivahti-production-summary";
import WattiVahtiProductionsChart from "@energyapp/app/_components/Charts/wattivahti-productions-chart";
import { YearDatePicker } from "@energyapp/app/_components/FormItems/antd-year-datepicker";
import { MonthDatePicker } from "@energyapp/app/_components/FormItems/antd-month-datepicker";

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(utc);
dayjs.extend(timezone);

type IWattivahtiProductionPageProps = {
    timePeriod: TimePeriod;
}

const getDefaultStartDate = (timePeriod: TimePeriod) => {
    switch (timePeriod) {
        case TimePeriod.PT15M:
            return dayjs().add(-1, 'day').hour(0).minute(0).second(0).millisecond(0)
        case TimePeriod.PT1H:
            return dayjs().add(-1, 'day').hour(0).minute(0).second(0).millisecond(0)
        case TimePeriod.P1D:
            return dayjs().startOf("month").hour(0).minute(0).second(0).millisecond(0)
        case TimePeriod.P1M:
            return dayjs().startOf("year").hour(0).minute(0).second(0).millisecond(0)
        default:
            return dayjs().add(-1, 'day').hour(0).minute(0).second(0).millisecond(0)
    }
}

const getDefaultEndDate = (timePeriod: TimePeriod) => {
    switch (timePeriod) {
        case TimePeriod.PT15M:
            return dayjs().add(-1, 'day').hour(23).minute(59).second(59).millisecond(999)
        case TimePeriod.PT1H:
            return dayjs().add(-1, 'day').hour(23).minute(59).second(59).millisecond(999)
        case TimePeriod.P1D:
            return dayjs().endOf("month").hour(23).minute(59).second(59).millisecond(999)
        case TimePeriod.P1M:
            return dayjs().endOf("year").hour(23).minute(59).second(59).millisecond(999)
        default:
            return dayjs().add(-1, 'day').hour(23).minute(59).second(59).millisecond(999)
    }
}

export default function WattivahtiProductionPage({ timePeriod }: IWattivahtiProductionPageProps) {
    const [startDate, setStartDate] = useState(getDefaultStartDate(timePeriod))
    const [endDate, setEndDate] = useState(getDefaultEndDate(timePeriod))
    const utils = api.useUtils();

    // Get consumptions
    const { data: response, isLoading, prefetch: prefetchConsumptions } = useGetWattiVahtiProductions({
        timePeriod: timePeriod, startTime: startDate, endTime: endDate
    });
    const productions = response?.productions ?? []

    // Update consumptions
    const { mutate: updateConsumptions, isLoading: isUpdating } = useUpdateWattiVahti();

    // Prefetch consumptions when date changes
    useEffect(() => {
        prefetchConsumptions({ utils, timePeriod: timePeriod, startTime: startDate, endTime: endDate });
    }, [startDate, endDate])

    // When date is changed from the date picker
    const onDateChange = (date: string | number | dayjs.Dayjs | Date | null | undefined) => {
        let startDate = dayjs(date)
        let endDate = dayjs(date)
        switch (timePeriod) {
            case TimePeriod.P1D: {
                startDate = startDate.startOf('month')
                endDate = endDate.endOf('month')
                break;
            }
            case TimePeriod.P1M:{
                startDate = startDate.startOf('year')
                endDate = endDate.endOf('year')
                break;
            }
        }

        setStartDate(startDate.hour(0).minute(0).second(0).millisecond(0))
        setEndDate(endDate.hour(23).minute(59).second(59).millisecond(999))
    }

    // Execute update spot prices
    const executeUpdateConsumptions = () => {
        updateConsumptions({
            startTime: startDate,
            endTime: endDate,
            timePeriod: timePeriod,
        });
    }

    const columns = [
        {
            title: 'Aika',
            dataIndex: 'time',
            key: 'time',
            render: (data: Dayjs) => dateToTableString(data, timePeriod)
        },
        {
            title: 'Tuotto',
            dataIndex: 'energy_production',
            key: 'energy_production',
            render: (_data: number, row: IWattiVahtiProduction) => WattiVahtiProduction({ production: row, timePeriod })
        },
        {
            title: 'Arvo',
            dataIndex: 'price',
            key: 'price',
            render: (_data: number, row: IWattiVahtiProduction) => WattiVahtiProductionPrice({ production: row, timePeriod })
        },
    ]

    const hoursInDay = () => {
        const startOfDay = dayjs(startDate).tz('Europe/Helsinki').startOf('day')
        const endOfDay = dayjs(startDate).tz('Europe/Helsinki').endOf('day')
        const hoursInDay = endOfDay.diff(startOfDay, 'hour')
        return hoursInDay + 1
    }

    const daysInMonth = () => {
        const startOfMonth = dayjs(startDate).tz('Europe/Helsinki').startOf('month')
        const endOfMonth = dayjs(startDate).tz('Europe/Helsinki').endOf('month')
        const daysInMonth = endOfMonth.diff(startOfMonth, 'day')
        return daysInMonth + 1
    }

    const missingValues = () => {
        if (isLoading) return (<></>)

        if ((timePeriod === TimePeriod.PT15M && (productions.length ?? 0) < (hoursInDay() * 4)) || (timePeriod === TimePeriod.PT1H && (productions.length ?? 0) < hoursInDay())) {
            return (<AlertWarning title='Huom!' message='Kaikkia päivän tuottoja ei ole saatavilla.' type="borderedWithAccent" />)
        }
        if ((timePeriod === TimePeriod.P1D && (productions.length ?? 0) < daysInMonth())) {
            return (<AlertWarning title='Huom!' message='Kaikkia kuukauden tuottoja ei ole saatavilla.' type="borderedWithAccent" />)
        }
        return (<></>)
    }

    const filters = () => {
        switch (timePeriod) {
            case TimePeriod.PT15M:
            case TimePeriod.PT1H:
                return (
                    <Row style={{ paddingBottom: 8 }}>
                        <Col flex="auto"><DayDatePicker value={startDate} onChange={onDateChange}></DayDatePicker></Col>
                        <Col flex="none">{(<Button loading={isUpdating} onClick={executeUpdateConsumptions} icon={!isUpdating && <RedoOutlined />}></Button>)}</Col>
                    </Row>
                )
            case TimePeriod.P1D:
                return (
                    <Row style={{ paddingBottom: 8 }}>
                        <Col flex="auto"><MonthDatePicker value={startDate} onChange={onDateChange}></MonthDatePicker></Col>
                        <Col flex="none">{(<Button loading={isUpdating} onClick={executeUpdateConsumptions} icon={!isUpdating && <RedoOutlined />}></Button>)}</Col>
                    </Row>
                )
            case TimePeriod.P1M:
                return (
                    <Row style={{ paddingBottom: 8 }}>
                        <Col flex="auto"><YearDatePicker value={startDate} onChange={onDateChange}></YearDatePicker></Col>
                        <Col flex="none">{(<Button loading={isUpdating} onClick={executeUpdateConsumptions} icon={!isUpdating && <RedoOutlined />}></Button>)}</Col>
                    </Row>
                )
            default:
                return (<></>)
        }
    }

    return (
        <Space direction="vertical" className="text-center" style={{ width: 'calc(100vw - 32px)' }}>
            {filters()}
            {missingValues()}
            {/* {!isLoading && (productions.length ?? 0) < hoursInDay() && <AlertWarning title='Huom!' message='Kaikkia päivän kulutuksia ei ole vielä saatavilla.' type="borderedWithAccent" />} */}
            <WattiVahtiProductionSummary timePeriod={timePeriod} summary={response?.summary} isLoading={isLoading} />
            <WattiVahtiProductionsChart wattivahtiResponse={response} startDate={startDate} isLoading={isLoading} endDate={endDate} />
            <Table
                rowKey={'time'}
                size={'small'}
                dataSource={productions}
                columns={columns}
                pagination={false}
            />
        </Space>
    );
}

