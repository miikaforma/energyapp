"use client";

import { api } from "@energyapp/trpc/react";
import { Button, Col, Row, Space, Table } from "antd";
import { RedoOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { TimePeriod } from "@energyapp/shared/enums";
import { type IWattiVahtiConsumption } from "@energyapp/shared/interfaces";
import { dateToSpotTimeString } from "@energyapp/utils/timeHelpers";
import useUpdateWattiVahti from "@energyapp/app/_hooks/mutations/useUpdateWattiVahti";
import useGetWattiVahtiConsumptions from "@energyapp/app/_hooks/queries/useGetWattiVahtiConsumptions";
import WattiVahtiConsumptionSummary from "@energyapp/app/_components/Descriptions/wattivahti-consumption-summary";
import { WattiVahtiConsumption } from "@energyapp/app/_components/ColumnRenders/WattiVahti/wattivahti-consumption";
import { WattiVahtiConsumptionPrice } from "@energyapp/app/_components/ColumnRenders/WattiVahti/wattivahti-consumption-price";
import { WattiVahtiConsumptionEffect } from "@energyapp/app/_components/ColumnRenders/WattiVahti/wattivahti-consumption-effect";
import { YearDatePicker } from "@energyapp/app/_components/FormItems/antd-year-datepicker";
import WattiVahtiConsumptionsChart from "@energyapp/app/_components/Charts/wattivahti-consumptions-chart";
import { useSettingsStore } from "@energyapp/app/_stores/settings/settings";
import { useSession } from "next-auth/react";
import useUpdateDatahub from "@energyapp/app/_hooks/mutations/useUpdateDatahub";
import useRecalculateDatahub from "@energyapp/app/_hooks/mutations/useRecalculateDatahub";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default function Page() {
  const timePeriod = TimePeriod.P1M;

  const { data: session } = useSession();
  const settingsStore = useSettingsStore();
  const settings = settingsStore.settings;

  const [startDate, setStartDate] = useState(
    dayjs().startOf("year").hour(0).minute(0).second(0).millisecond(0),
  );
  const [endDate, setEndDate] = useState(
    dayjs().endOf("year").hour(23).minute(59).second(59).millisecond(999),
  );
  const utils = api.useUtils();

  // Get consumptions
  const {
    data: consumptionResponse,
    isLoading,
    prefetch: prefetchConsumptions,
  } = useGetWattiVahtiConsumptions({
    timePeriod: timePeriod,
    startTime: startDate,
    endTime: endDate,
  });
  const consumptions = consumptionResponse?.consumptions ?? [];

  // Update consumptions
  const {
    mutate: updateConsumptionsFromWattiVahti,
    isLoading: isUpdatingFromWattiVahti,
  } = useUpdateWattiVahti();
  const { mutate: updateConsumptions, isLoading: isUpdating } =
    useUpdateDatahub();
  const { mutate: recalculateDatahub, isLoading: isRecalculating } =
    useRecalculateDatahub();

  // Prefetch consumptions when date changes
  useEffect(() => {
    prefetchConsumptions({
      utils,
      timePeriod: timePeriod,
      startTime: startDate,
      endTime: endDate,
    });
  }, [startDate, endDate]);

  // When date is changed from the date picker
  const onDateChange = (
    date: string | number | dayjs.Dayjs | Date | null | undefined,
  ) => {
    setStartDate(
      dayjs(date).startOf("year").hour(0).minute(0).second(0).millisecond(0),
    );
    setEndDate(
      dayjs(date).endOf("year").hour(23).minute(59).second(59).millisecond(999),
    );
  };

  // Execute update consumptions
  const executeUpdateConsumptionsFromWattiVahti = () => {
    updateConsumptionsFromWattiVahti({
      startTime: startDate,
      endTime: endDate,
      timePeriod: timePeriod,
    });
  };

  const executeUpdateConsumptions = () => {
    updateConsumptions({
      startTime: startDate,
      endTime: endDate,
      timePeriod: timePeriod,
    });
  };

  const executeRecalculateConsumptions = () => {
    recalculateDatahub({
      startTime: startDate,
      endTime: endDate,
    });
  };

  const hasHybridConsumption = consumptions.some(
    (consumption) => consumption.contract_type === 4,
  );

  const columns = [
    {
      title: "Aika",
      dataIndex: "time",
      key: "time",
      render: (data: Dayjs) => dateToSpotTimeString(data, timePeriod),
    },
    {
      title: "Kulutus",
      dataIndex: "energy_consumption",
      key: "energy_consumption",
      render: (_data: number, row: IWattiVahtiConsumption) =>
        WattiVahtiConsumption({ consumption: row, timePeriod }),
    },
    {
      title: "Hinta",
      dataIndex: "price",
      key: "price",
      render: (_data: number, row: IWattiVahtiConsumption) =>
        WattiVahtiConsumptionPrice({ consumption: row, timePeriod }),
    },
    settings.showConsumptionEffects || hasHybridConsumption
      ? {
          title: <div style={{ wordBreak: "break-word" }}>Omavaikutus</div>,
          dataIndex: "price",
          key: "price",
          render: (_data: number, row: IWattiVahtiConsumption) =>
            WattiVahtiConsumptionEffect({ consumption: row }),
        }
      : {},
  ];

  return (
    <Space
      direction="vertical"
      className="text-center"
      style={{ width: "calc(100vw - 32px)" }}
    >
      <Row style={{ paddingBottom: 8 }}>
        <Col flex="auto">
          <YearDatePicker
            value={startDate}
            onChange={onDateChange}
          ></YearDatePicker>
        </Col>
        <Col flex="none">
          {
            <Button
              loading={isUpdating}
              onClick={executeUpdateConsumptions}
              icon={!isUpdating && <RedoOutlined />}
            ></Button>
          }
        </Col>
      </Row>
      <WattiVahtiConsumptionSummary
        timePeriod={timePeriod}
        summary={consumptionResponse?.summary}
        isLoading={isLoading}
      />
      <WattiVahtiConsumptionsChart
        wattivahtiResponse={consumptionResponse}
        startDate={startDate}
        isLoading={isLoading}
        endDate={endDate}
      />
      <Table
        rowKey={"time"}
        size={"small"}
        dataSource={consumptions}
        columns={columns}
        pagination={false}
      />
      {session && (
        <Row>
          {
            <Col xs={24} style={{ textAlign: "right" }}>
              {
                <Space>
                  <Button
                    loading={isUpdatingFromWattiVahti}
                    onClick={executeUpdateConsumptionsFromWattiVahti}
                  >
                    Päivitä WattiVahdista
                  </Button>
                  <Button
                    loading={isRecalculating}
                    onClick={executeRecalculateConsumptions}
                  >
                    Laske uudelleen
                  </Button>
                </Space>
              }
            </Col>
          }
        </Row>
      )}
    </Space>
  );
}
