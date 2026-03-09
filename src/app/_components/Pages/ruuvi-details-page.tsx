"use client";

import { api } from "@energyapp/trpc/react";
import {
  Col,
  Radio,
  type RadioChangeEvent,
  Row,
  Space,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { TimePeriod } from "@energyapp/shared/enums";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import useGetRuuviRange from "@energyapp/app/_hooks/queries/useGetRuuviRange";
import useGetRuuviDetails from "@energyapp/app/_hooks/queries/useGetRuuviDetails";
import { Fab } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { DayRangeDatePicker } from "../FormItems/antd-day-range-datepicker";
import RuuviChart from "../Charts/ruuvi-chart";
import { transformRuuviDataToChartResponse } from "@energyapp/utils/ruuviHelpers";
// import RuuviSummary from "../Descriptions/ruuvi-summary";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

type RuuviDetailsPageProps = {
  timePeriod: TimePeriod;
};

const getDefaultStartDate = () => {
  return dayjs().add(-1, "day").hour(0).minute(0).second(0).millisecond(0);
};

const getDefaultEndDate = () => {
  return undefined;//dayjs().hour(23).minute(59).second(59).millisecond(999);
};

export default function RuuviDetailsPage({
  timePeriod,
}: RuuviDetailsPageProps) {
  const params = useParams();
  const deviceId = params.deviceId;
  const ruuviId = deviceId?.toString();

  const router = useRouter();
  const enablePrefetch = false;

  const { data: session } = useSession();
  const [startDate, setStartDate] = useState(
    getDefaultStartDate(),
  );
  const [endDate, setEndDate] = useState<Dayjs | undefined>(
    getDefaultEndDate(),
  );

  // Get ruuvi range
  const { data: ruuviRange } = useGetRuuviRange({
    timePeriod: timePeriod,
  });

  // Get consumptions
  const {
    data: ruuviDetails,
    isLoading,
  } = useGetRuuviDetails({
    timePeriod: timePeriod,
    startTime: startDate,
    endTime: endDate,
    id: ruuviId,
  });

  const onDateRangeChange = (start: Dayjs, end?: Dayjs | null) => {
    setStartDate(
      dayjs(start).startOf("day").hour(0).minute(0).second(0).millisecond(0),
    );
    setEndDate(
      end ? dayjs(end).endOf("day").hour(23).minute(59).second(59).millisecond(999) : undefined,
    );
  };

  const onRangeChange = (e: RadioChangeEvent) => {
    const value = e.target.value as string;
    router.push(`${value}`);
  };

  return (
    <Space
      orientation="vertical"
      className="text-center"
      style={{ width: "calc(100vw - 32px)" }}
    >
      <Radio.Group
        value={timePeriod}
        onChange={onRangeChange}
        style={{ width: "100%", marginBottom: 12 }}
      >
        <Radio.Button key={TimePeriod.PT15M} value={TimePeriod.PT15M}>
          15 Minuuttia
        </Radio.Button>
        <Radio.Button key={TimePeriod.PT5M} value={TimePeriod.PT5M}>
          5 Minuuttia
        </Radio.Button>
      </Radio.Group>
      <Row style={{ paddingBottom: 8 }}>
        <Col flex="auto">
          <DayRangeDatePicker
            startDate={startDate}
            endDate={endDate}
            onChange={onDateRangeChange}
            minDate={session ? ruuviRange?.min : undefined}
            maxDate={session ? ruuviRange?.max : undefined}
          ></DayRangeDatePicker>
        </Col>
      </Row>

      <Fab
        variant="extended"
        size="small"
        color="primary"
        href="/statistics/ruuvi"
        sx={{ position: "fixed", bottom: 69, right: 16 }}
      >
        <ArrowBackIcon sx={{ mr: 1 }} />
        Takaisin laitevalintaan
      </Fab>

      {/* <RuuviSummary response={RuuviDetailss} /> */}
      <RuuviChart
        ruuviResponse={transformRuuviDataToChartResponse(ruuviDetails, timePeriod)}
        metricType="temperature"
        startDate={startDate}
        endDate={endDate}
        isLoading={isLoading}
        onDateRangeChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
      />
    </Space>
  );
}
