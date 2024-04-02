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
import { type IWattiVahtiConsumption } from "@energyapp/shared/interfaces";
import { dateToSpotTimeString } from "@energyapp/utils/timeHelpers";
import { useSession } from "next-auth/react";
import useGetWattiVahtiConsumptions from "@energyapp/app/_hooks/queries/useGetWattiVahtiConsumptions";
import WattiVahtiConsumptionSummary from "@energyapp/app/_components/Descriptions/wattivahti-consumption-summary";
import { WattiVahtiConsumption } from "@energyapp/app/_components/ColumnRenders/WattiVahti/wattivahti-consumption";
import { WattiVahtiConsumptionPrice } from "@energyapp/app/_components/ColumnRenders/WattiVahti/wattivahti-consumption-price";
import useUpdateWattiVahti from "@energyapp/app/_hooks/mutations/useUpdateWattiVahti";
import { AlertWarning } from "@energyapp/app/_components/Alerts/alert-warning";
import WattiVahtiConsumptionsChart from "@energyapp/app/_components/Charts/wattivahti-consumptions-chart";
import { SkeletonBarChart } from "@energyapp/app/_components/Skeletons/bar-chart-skeleton";

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(utc);
dayjs.extend(timezone);

export default function Page() {
    const { data: session } = useSession();
    const timePeriod = TimePeriod.Hour;

    const [startDate, setStartDate] = useState(dayjs().add(-1, 'day').hour(0).minute(0).second(0).millisecond(0))
    const [endDate, setEndDate] = useState(dayjs().add(-1, 'day').hour(23).minute(59).second(59).millisecond(999))
    const utils = api.useUtils();

    // Get consumptions
    const { data: consumptionResponse, isLoading, prefetch: prefetchConsumptions } = useGetWattiVahtiConsumptions({
        timePeriod: timePeriod, startTime: startDate, endTime: endDate
    });
    const consumptions = consumptionResponse?.consumptions ?? []

    // Prefetch daily and monthly consumptions
    // prefetchConsumptions({
    //     utils,
    //     timePeriod: TimePeriod.Day,
    //     startTime: dayjs().startOf("month").hour(0).minute(0).second(0).millisecond(0),
    //     endTime: dayjs().endOf("month").hour(23).minute(59).second(59).millisecond(999),
    //     singlePrefetch: true
    // })
    // prefetchConsumptions({
    //     utils,
    //     timePeriod: TimePeriod.Month,
    //     startTime: dayjs().startOf("year").hour(0).minute(0).second(0).millisecond(0),
    //     endTime: dayjs().endOf("year").hour(23).minute(59).second(59).millisecond(999),
    //     singlePrefetch: true
    // })

    // Update consumptions
    const { mutate: updateConsumptions, isLoading: isUpdating } = useUpdateWattiVahti();

    // Prefetch consumptions when date changes
    useEffect(() => {
        prefetchConsumptions({ utils, timePeriod: timePeriod, startTime: startDate, endTime: endDate });
    }, [startDate, endDate])

    // When date is changed from the date picker
    const onDateChange = (date: string | number | dayjs.Dayjs | Date | null | undefined) => {
        setStartDate(dayjs(date).hour(0).minute(0).second(0).millisecond(0))
        setEndDate(dayjs(date).hour(23).minute(59).second(59).millisecond(999))
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
            render: (data: Dayjs) => dateToSpotTimeString(data, timePeriod)
        },
        {
            title: 'Kulutus',
            dataIndex: 'energy_consumption',
            key: 'energy_consumption',
            render: (_data: number, row: IWattiVahtiConsumption) => WattiVahtiConsumption({ consumption: row, timePeriod })
        },
        {
            title: 'Hinta',
            dataIndex: 'price',
            key: 'price',
            render: (_data: number, row: IWattiVahtiConsumption) => WattiVahtiConsumptionPrice({ consumption: row, timePeriod })
        },
    ]

    const hoursInDay = () => {
        const startOfDay = dayjs(startDate).tz('Europe/Helsinki').startOf('day')
        const endOfDay = dayjs(startDate).tz('Europe/Helsinki').endOf('day')
        const hoursInDay = endOfDay.diff(startOfDay, 'hour')
        return hoursInDay + 1
    }

    return (
        <Space direction="vertical" className="text-center" style={{ width: 'calc(100vw - 32px)' }}>
            <Row style={{ paddingBottom: 8 }}>
                <Col flex="auto"><DayDatePicker value={startDate} onChange={onDateChange}></DayDatePicker></Col>
                <Col flex="none">{(<Button loading={isUpdating} onClick={executeUpdateConsumptions} icon={!isUpdating && <RedoOutlined />}></Button>)}</Col>
            </Row>
            {!isLoading && (consumptionResponse?.consumptions.length ?? 0) < hoursInDay() && <AlertWarning title='Huom!' message='Kaikkia päivän kulutuksia ei ole vielä saatavilla.' type="borderedWithAccent" />}
            <WattiVahtiConsumptionSummary timePeriod={timePeriod} summary={consumptionResponse?.summary} isLoading={isLoading} />
            <WattiVahtiConsumptionsChart wattivahtiResponse={consumptionResponse} startDate={startDate} isLoading={isLoading} endDate={endDate} />
            <Table
                rowKey={'time'}
                size={'small'}
                dataSource={consumptions}
                columns={columns}
                pagination={false}
            />
        </Space>
    );
}

