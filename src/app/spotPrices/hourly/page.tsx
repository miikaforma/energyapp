'use client';

import { DayDatePicker } from "@energyapp/app/_components/FormItems/antd-day-datepicker";
import { api } from "@energyapp/trpc/react";
import { Button, Col, Radio, Row, Space, Table } from "antd";
import { CaretRightFilled } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { type SetStateAction, useEffect, useState } from "react";

import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { ElectricitySpotPrice } from "@energyapp/app/_components/ColumnRenders/SpotPrice/electricity-spot-price";
import { ElectricityPrice } from "@energyapp/app/_components/ColumnRenders/SpotPrice/electricity-price";
import SpotPricesChart from "@energyapp/app/_components/Charts/spot-prices-chart";
import { TimePeriod } from "@energyapp/shared/enums";
import { type ISpotPrice } from "@energyapp/shared/interfaces";
import { TemporarySettings } from "@energyapp/shared/contants";
import { dateToSpotTimeString, isCurrentHour } from "@energyapp/utils/timeHelpers";
import SpotPriceSummary from "@energyapp/app/_components/Descriptions/spotprice-summary";
import { useSession } from "next-auth/react";
import useGetSpotPrices from "@energyapp/app/_hooks/queries/useGetSpotPrices";
import useUpdateSpotPrices from "@energyapp/app/_hooks/mutations/useUpdateSpotPrices";

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export default function Page() {
  const { data: session } = useSession();
  const timePeriod = TimePeriod.Hour;
  const settings = TemporarySettings;

  const [startDate, setStartDate] = useState(dayjs().hour(0).minute(0).second(0).millisecond(0))
  const [endDate, setEndDate] = useState(dayjs().hour(23).minute(59).second(59).millisecond(999))
  const [selectedDate, setSelectedDate] = useState('today')
  const utils = api.useUtils();

  // Get spot prices
  const { data: spotResponse, isFetching, prefetch: prefetchSpotPrices } = useGetSpotPrices({
    timePeriod: timePeriod, startTime: startDate, endTime: endDate
  });
  const spotPrices = spotResponse?.prices ?? []

  // Update spot prices
  const { mutate: updateSpotPrices, isLoading: isUpdating } = useUpdateSpotPrices();

  // Prefetch spot prices when date changes
  useEffect(() => {
    prefetchSpotPrices({ utils, timePeriod: timePeriod, startTime: startDate, endTime: endDate });
  }, [startDate, endDate])

  // When selected date from the quick menu changes
  const changeSelectedDate = (selectedDate: SetStateAction<string>) => {
    setSelectedDate(selectedDate)
    switch (selectedDate) {
      case 'yesterday': {
        setStartDate(dayjs().add(-1, 'day').hour(0).minute(0).second(0).millisecond(0))
        setEndDate(dayjs().add(-1, 'day').hour(23).minute(59).second(59).millisecond(999))
        break
      }
      case 'today':
      default: {
        setStartDate(dayjs().hour(0).minute(0).second(0).millisecond(0))
        setEndDate(dayjs().hour(23).minute(59).second(59).millisecond(999))
        break
      }
      case 'tomorrow': {
        setStartDate(dayjs().add(1, 'day').hour(0).minute(0).second(0).millisecond(0))
        setEndDate(dayjs().add(1, 'day').hour(23).minute(59).second(59).millisecond(999))
        break
      }
    }
  }

  // When date is changed from the date picker
  const onDateChange = (date: string | number | dayjs.Dayjs | Date | null | undefined) => {
    setStartDate(dayjs(date).hour(0).minute(0).second(0).millisecond(0))
    setEndDate(dayjs(date).hour(23).minute(59).second(59).millisecond(999))

    // Yesterday
    if (dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day')) {
      setSelectedDate('yesterday');
    }
    // Today
    else if (dayjs(date).isSame(dayjs(), 'day')) {
      setSelectedDate('today');
    }
    // Tomorrow
    else if (dayjs(date).isSame(dayjs().add(1, 'day'), 'day')) {
      setSelectedDate('tomorrow');
    }
    // Other
    else {
      setSelectedDate('');
    }
  }

  // Whether to show the update button
  const showUpdateButton = () => {
    const dateNow = dayjs();
    const todayUpdateFrom = dayjs().set('hour', 13).set('minute', 45).set('second', 0).set('ms', 0)
    const todayUpdateTo = dayjs().set('hour', 23).set('minute', 59).set('second', 59).set('ms', 1000)
    const data = spotResponse?.prices ?? []

    return session && ((selectedDate !== "tomorrow" && data?.length <= 1) || selectedDate === "tomorrow" && data?.length <= 1 && dateNow.isSameOrAfter(todayUpdateFrom) && dateNow.isSameOrBefore(todayUpdateTo));
  }

  // Execute update spot prices
  const executeUpdateSpotPrices = () => {
    updateSpotPrices({
      startTime: startDate,
      endTime: endDate,
      timePeriod: timePeriod,
    });
  }

  const columns = [
    {
      title: '',
      dataIndex: 'time',
      key: 'current',
      width: 30,
      render: (data: string | number | Date) =>
        <>
          {isCurrentHour(data) && <CaretRightFilled />}
        </>
    },
    {
      title: 'Aika',
      dataIndex: 'time',
      key: 'time',
      width: 90,
      render: (data: Dayjs) => dateToSpotTimeString(data, timePeriod)
    },
    {
      title: 'Spot-hinta',
      dataIndex: 'price',
      key: 'electricity_price',
      render: (data: number, row: ISpotPrice) => ElectricitySpotPrice({ spotPrice: row })
    },
    {
      title: 'Sähkön hinta',
      dataIndex: 'price',
      key: 'full_price',
      render: (data: number, row: ISpotPrice) => ElectricityPrice(row, settings)
    },
  ]

  return (
    <Space direction="vertical" className="text-center">
      <Radio.Group value={selectedDate} onChange={(e) => changeSelectedDate(e.target.value)} style={{ width: "100%", marginBottom: 12 }}>
        <Radio.Button value="yesterday">Eilen</Radio.Button>
        <Radio.Button value="today">Tänään</Radio.Button>
        <Radio.Button value="tomorrow">Huomenna</Radio.Button>
      </Radio.Group>
      <Row>
        <Col span={24}><DayDatePicker value={startDate} onChange={onDateChange} disabledNextDays={1}></DayDatePicker></Col>
      </Row>
      <Row>
        {<Col xs={24} style={{ textAlign: 'right' }}>{(showUpdateButton() && <Button loading={isUpdating} onClick={executeUpdateSpotPrices}>Päivitä</Button>)}</Col>}
      </Row>
      <SpotPriceSummary spotResponse={spotResponse} settings={settings} />
      <SpotPricesChart spotPriceResponse={spotResponse} startDate={startDate} endDate={endDate} settings={settings} />
      <Table
        rowClassName={(record, index) => isCurrentHour(record.time) ? 'table-row-current' : ''}
        rowKey={'time'}
        size={'small'}
        dataSource={spotPrices}
        columns={columns}
        pagination={false}
      />
      {session && (
        <Row>
          {<Col xs={24} style={{ textAlign: 'right' }}>{(<Button loading={isUpdating} onClick={executeUpdateSpotPrices}>Hae hinnat uudelleen</Button>)}</Col>}
        </Row>
      )}
    </Space>
  );
}

