'use client';

import { api } from "@energyapp/trpc/react";
import { Button, Col, Row, Space, Table } from "antd";
import { CaretRightFilled } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { ElectricitySpotPrice } from "@energyapp/app/_components/ColumnRenders/SpotPrice/electricity-spot-price";
import SpotPricesChart from "@energyapp/app/_components/Charts/spot-prices-chart";
import { TimePeriod } from "@energyapp/shared/enums";
import { type ISpotPrice } from "@energyapp/shared/interfaces";
import { TemporarySettings } from "@energyapp/shared/contants";
import { dateToSpotTimeString, isCurrentMonth } from "@energyapp/utils/timeHelpers";
import SpotPriceSummary from "@energyapp/app/_components/Descriptions/spotprice-summary";
import useGetSpotPrices from "@energyapp/app/_hooks/queries/useGetSpotPrices";
import useUpdateSpotPrices from "@energyapp/app/_hooks/mutations/useUpdateSpotPrices";
import { useSession } from "next-auth/react";
import { YearDatePicker } from "@energyapp/app/_components/FormItems/antd-year-datepicker";
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export default function Page() {
  const { data: session } = useSession();
  const timePeriod = TimePeriod.Month;
  const settings = TemporarySettings;

  const [startDate, setStartDate] = useState(dayjs().startOf("year").hour(0).minute(0).second(0).millisecond(0))
  const [endDate, setEndDate] = useState(dayjs().endOf("year").hour(23).minute(59).second(59).millisecond(999))
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

  // When date is changed from the date picker
  const onDateChange = (date: string | number | dayjs.Dayjs | Date | null | undefined) => {
    setStartDate(dayjs(date).startOf('year').hour(0).minute(0).second(0).millisecond(0))
    setEndDate(dayjs(date).endOf('year').hour(23).minute(59).second(59).millisecond(999))
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
      render: (data: string | number | Date, _: any) => isCurrentMonth(data) && <CaretRightFilled />
    },
    {
      title: 'Aika',
      dataIndex: 'time',
      key: 'time',
      render: (data: Dayjs, _: any) => dateToSpotTimeString(data, timePeriod)
    },
    {
      title: 'Kuukauden keskihinta',
      dataIndex: 'price',
      key: 'electricity_price',
      render: (data: number, row: ISpotPrice) => ElectricitySpotPrice({ spotPrice: row })
    },
    // {
    //   title: 'Sähkön keskinta',
    //   dataIndex: 'price',
    //   key: 'full_price',
    //   render: (data: number, row: ISpotPrice) => ElectricityPrice(row, settings)
    // },
  ]

  return (
    <Space direction="vertical" className="text-center">
      <Row>
        <Col span={24}><YearDatePicker value={startDate} onChange={onDateChange}></YearDatePicker></Col>
      </Row>
      <SpotPriceSummary spotResponse={spotResponse} settings={settings} />
      <SpotPricesChart spotPriceResponse={spotResponse} startDate={startDate} endDate={endDate} settings={settings} />
      <Table
        rowClassName={(record, index) => isCurrentMonth(record.time) ? 'table-row-current' : ''}
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
