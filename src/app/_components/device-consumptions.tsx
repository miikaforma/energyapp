"use client";

import { useEffect, useState } from "react";
import { api } from "@energyapp/trpc/react";
import SelectBox from "@energyapp/app/_components/FormItems/select-box";
import dayjs from "dayjs";
import MelCloudEnergyReportPie from "@energyapp/app/_components/Charts/melcloud-energyreport-pie";
import DateRangePicker from "@energyapp/app/_components/FormItems/date-range-picker";
import EnergyCostReportTable from "./Tables/MelCloud/table-base";
import { AlertWarning } from "./Alerts/alert-warning";
import { Radio } from "antd";
import { DayDatePicker } from "@energyapp/app/_components/FormItems/antd-day-datepicker";
import { MonthDatePicker } from "@energyapp/app/_components/FormItems/antd-month-datepicker";
import { YearDatePicker } from "@energyapp/app/_components/FormItems/antd-year-datepicker";
import { type IUserAccessResponse } from "@energyapp/shared/interfaces";

interface DeviceConsumptionsProps {
  devices: IUserAccessResponse[];
}

export default function DeviceConsumptions({
  devices,
}: DeviceConsumptionsProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    devices?.[0]?.accessId ?? "",
  );
  const [selectedDevice, setSelectedDevice] =
    useState<IUserAccessResponse | null>(devices?.[0] ?? null);

  const [fromDate, setFromDate] = useState<dayjs.Dayjs>(
    dayjs().hour(0).minute(0).second(0).millisecond(0),
  );
  const [toDate, setToDate] = useState<dayjs.Dayjs>(
    dayjs().hour(23).minute(59).second(59).millisecond(999),
  );

  const [selectedRange, setSelectedRange] = useState("daily");

  const onDeviceChange = (value: string) => {
    setSelectedDeviceId(value);
    setSelectedDevice(devices.find((device) => device.accessId === value) ?? null);
  };

  const onRangeChange = (value: string) => {
    setSelectedRange(value);
  };

  useEffect(() => {
    if (selectedRange === "yearly") {
      setFromDate(dayjs().startOf("year"));
      setToDate(dayjs().endOf("year"));
    } else if (selectedRange === "monthly") {
      setFromDate(dayjs().startOf("month"));
      setToDate(dayjs().endOf("month"));
    } else if (selectedRange === "daily") {
      setFromDate(dayjs().hour(0).minute(0).second(0).millisecond(0));
      setToDate(dayjs().hour(23).minute(59).second(59).millisecond(999));
    }
  }, [selectedRange]);

  const onDateChange = (
    date: string | number | dayjs.Dayjs | Date | null | undefined,
  ) => {
    if (selectedRange === "yearly") {
      setFromDate(
        dayjs(date).startOf("year").hour(0).minute(0).second(0).millisecond(0),
      );
      setToDate(
        dayjs(date)
          .endOf("year")
          .hour(23)
          .minute(59)
          .second(59)
          .millisecond(999),
      );
    } else if (selectedRange === "monthly") {
      setFromDate(
        dayjs(date).startOf("month").hour(0).minute(0).second(0).millisecond(0),
      );
      setToDate(
        dayjs(date)
          .endOf("month")
          .hour(23)
          .minute(59)
          .second(59)
          .millisecond(999),
      );
    } else if (selectedRange === "daily") {
      setFromDate(dayjs(date).hour(0).minute(0).second(0).millisecond(0));
      setToDate(dayjs(date).hour(23).minute(59).second(59).millisecond(999));
    }
  };

  const {
    data: energyReport,
    isFetching,
    isLoading,
  } = api.melCloud.getConsumptions.useQuery(
    {
      deviceId: selectedDeviceId,
      startTime: fromDate,
      endTime: toDate,
    },
    {
      enabled: selectedDeviceId !== "",
      staleTime: Infinity,
      select: (data) => data,
    },
  );

  const showHeating = (energyReport?.TotalHeatingConsumed ?? 0) > 0;
  const showCooling = (energyReport?.TotalCoolingConsumed ?? 0) > 0;
  const showFan = (energyReport?.TotalFanConsumed ?? 0) > 0;
  const showDry = (energyReport?.TotalDryConsumed ?? 0) > 0;
  const showAuto = (energyReport?.TotalAutoConsumed ?? 0) > 0;
  const showOther = (energyReport?.TotalOtherConsumed ?? 0) > 0;

  const hasConsumptions =
    showHeating || showCooling || showFan || showDry || showAuto || showOther;

  return (
    <div>
      {devices.length > 1 && (
        <SelectBox
          id="deviceSelect"
          options={devices.map((device) => ({
            key: device.accessId,
            value: device.accessId,
            label: device.accessName ?? "",
          }))}
          onChange={onDeviceChange}
        />
      )}
      <Radio.Group
        value={selectedRange}
        onChange={(e) => onRangeChange(e.target.value)}
        style={{ width: "100%", marginBottom: 12 }}
      >
        <Radio.Button key={"custom"} value="custom">
          Mukautettu
        </Radio.Button>
        <Radio.Button key={"year"} value="yearly">
          Vuosi
        </Radio.Button>
        <Radio.Button key={"month"} value="monthly">
          Kuukausi
        </Radio.Button>
        <Radio.Button key={"day"} value="daily">
          Päivä
        </Radio.Button>
      </Radio.Group>
      {selectedRange === "custom" && (
        <DateRangePicker
          startDate={fromDate}
          endDate={toDate}
          setStartDate={setFromDate}
          setEndDate={setToDate}
          minDate={selectedDevice?.availableFrom}
          maxDate={dayjs()}
        />
      )}
      {selectedRange === "yearly" && (
        <div className="flex w-full justify-center">
          <YearDatePicker
            value={fromDate}
            onChange={onDateChange}
            minDate={selectedDevice?.availableFrom}
            maxDate={dayjs()}
          ></YearDatePicker>
        </div>
      )}
      {selectedRange === "monthly" && (
        <div className="flex w-full justify-center">
          <MonthDatePicker
            value={fromDate}
            onChange={onDateChange}
            minDate={selectedDevice?.availableFrom}
            maxDate={dayjs()}
          ></MonthDatePicker>
        </div>
      )}
      {selectedRange === "daily" && (
        <div className="flex w-full justify-center">
          <DayDatePicker
            value={fromDate}
            onChange={onDateChange}
            minDate={selectedDevice?.availableFrom}
            maxDate={dayjs()}
          ></DayDatePicker>
        </div>
      )}
      {isFetching && (
        <div className="mt-10 text-center">
          <div role="status">
            <svg
              aria-hidden="true"
              className="inline h-20 w-20 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}
      {!isLoading && !hasConsumptions && (
        <AlertWarning
          title="Huom!"
          message="Valitulle aikavälille ei löytynyt kulutuksia."
          type="borderedWithAccent"
          style={{ marginTop: 14 }}
        />
      )}
      {energyReport && hasConsumptions && (
        <MelCloudEnergyReportPie
          fromDate={dayjs(energyReport.FromDate)}
          toDate={dayjs(energyReport.ToDate)}
          deviceName={energyReport.DeviceName}
          totalHeatingConsumed={energyReport.TotalHeatingConsumed}
          totalCoolingConsumed={energyReport.TotalCoolingConsumed}
          totalAutoConsumed={energyReport.TotalAutoConsumed}
          totalDryConsumed={energyReport.TotalDryConsumed}
          totalFanConsumed={energyReport.TotalFanConsumed}
          totalOtherConsumed={energyReport.TotalOtherConsumed}
        />
      )}
      {energyReport && hasConsumptions && (
        <EnergyCostReportTable energyCostReport={energyReport} />
      )}
    </div>
  );
}
