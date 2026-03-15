"use client";

// import { Dropdown } from "antd";
// import MoreVertIcon from '@mui/icons-material/MoreVert';
// import IconButton from '@mui/material/IconButton';
import RuuviImageUpload from "../RuuviImageUpload";
import {
  Col,
  Radio,
  type RadioChangeEvent,
  Row,
  Space,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useRef, useState } from "react";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { TimePeriod } from "@energyapp/shared/enums";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import useGetRuuviRange from "@energyapp/app/_hooks/queries/ruuvi/useGetRuuviRange";
import useGetRuuviDetails from "@energyapp/app/_hooks/queries/ruuvi/useGetRuuviDetails";
import { Avatar, ButtonBase, Fab, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { DayRangeDatePicker } from "../FormItems/antd-day-range-datepicker";
import RuuviChart from "../Charts/ruuvi-chart";
import { getPictureUrl, transformRuuviDataToChartResponse } from "@energyapp/utils/ruuviHelpers";
import useGetRuuviDevice from "@energyapp/app/_hooks/queries/ruuvi/useGetRuuviDevice";
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

  const { data: session } = useSession();
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState<Dayjs | undefined>(getDefaultEndDate());
  const inputRef = useRef<HTMLInputElement>(null);

  // Get ruuvi range
  const { data: ruuviRange } = useGetRuuviRange({
    timePeriod: timePeriod,
  });

  // Get ruuvi device
  const { data: ruuviDevice } = useGetRuuviDevice({
    id: ruuviId ?? "",
  });

  // Get values for selected range
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

  // const menuItems = [
  //   {
  //     key: "upload",
  //     label: "Vaihda kuva",
  //     onClick: () => {
  //       inputRef.current?.click();
  //     },
  //   },
  // ];

  return (
    <Space
      orientation="vertical"
      className="text-center"
      style={{ width: "calc(100vw - 32px)" }}
    >
      <RuuviImageUpload deviceId={ruuviId ?? ""} inputRef={inputRef} />
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
      <DayRangeDatePicker
        startDate={startDate}
        endDate={endDate}
        onChange={onDateRangeChange}
        minDate={session ? ruuviRange?.min : undefined}
        maxDate={session ? ruuviRange?.max : undefined}
      />
      {/* <Row style={{ paddingBottom: 8, alignItems: "center" }}>
        <Col flex="auto">
          <DayRangeDatePicker
            startDate={startDate}
            endDate={endDate}
            onChange={onDateRangeChange}
            minDate={session ? ruuviRange?.min : undefined}
            maxDate={session ? ruuviRange?.max : undefined}
          />
        </Col>
        <Col>
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <IconButton aria-label="asetukset" size="small">
              <MoreVertIcon />
            </IconButton>
          </Dropdown>
        </Col>
      </Row> */}
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
      <Row style={{ paddingBottom: 8, alignItems: "center", justifyContent: 'start' /* justifyContent: "space-between" */ }}>
        <Col>
          <ButtonBase
            component="label"
            role={undefined}
            tabIndex={-1} // prevent label from tab focus
            aria-label="Ruuvi avatar"
            sx={{
              borderRadius: '40px',
              '&:has(:focus-visible)': {
                outline: '2px solid',
                outlineOffset: '2px',
              },
            }}
            onClick={() => {
              inputRef.current?.click();
            }}
          >
            <Avatar
              alt={ruuviDevice?.accessName ?? "Ruuvi Device"}
              src={getPictureUrl(ruuviDevice?.customData)}
              sx={{ width: 56, height: 56 }}
            />
            <Typography variant="h5" sx={{ ml: 2, fontWeight: 'bold' }}>{ruuviDevice?.accessName}</Typography>
          </ButtonBase>
        </Col>
        <Col>
          {/* <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <IconButton aria-label="asetukset" size="small">
              <MoreVertIcon />
            </IconButton>
          </Dropdown> */}
        </Col>
      </Row>
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
