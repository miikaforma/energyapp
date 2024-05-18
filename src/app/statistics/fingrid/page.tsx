"use client";

import {
  FingridEvents,
  FingridHourEnergyEvents,
  FingridRealTimeEvents,
} from "@energyapp/shared/constants";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import FingridProductionData from "@energyapp/app/_components/Charts/fingrid-current-production";
import FingridWindForecast from "@energyapp/app/_components/Charts/fingrid-wind-forecast";
import FingridConsumptionForecast from "@energyapp/app/_components/Charts/fingrid-consumption-forecast";
import FingridSummary from "../../_components/Descriptions/fingrid-summary";
import useGetLatest from "@energyapp/app/_hooks/queries/fingrid/useGetLatest";
import useGetDataset from "@energyapp/app/_hooks/queries/fingrid/useGetDataset";
import { Space } from "antd";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Statistics() {
  const startTime = dayjs().subtract(1, "day").startOf("day");

  const { data: historyAndForecast } = useGetDataset({
    datasetIds: [
      FingridHourEnergyEvents.WindProduction,
      FingridEvents.OnceInHour_Wind,
      FingridEvents.OnceInDay_Wind,
      FingridHourEnergyEvents.ConsumptionForecast_Updating,
      FingridHourEnergyEvents.ProductionForecast_Updating,
    ],
    startTime,
  });

  const windProduction = historyAndForecast?.filter(
    (x) => x.dataset_id === FingridHourEnergyEvents.WindProduction
  );
  const onceInHourWind = historyAndForecast?.filter(
    (x) => x.dataset_id === FingridEvents.OnceInHour_Wind
  );
  const onceInDayWind = historyAndForecast?.filter(
    (x) => x.dataset_id === FingridEvents.OnceInDay_Wind
  );

  // Consumption and production forecast
  const updatingConsumptionForecast = historyAndForecast?.filter(
    (x) => x.dataset_id === FingridHourEnergyEvents.ConsumptionForecast_Updating
  );
  const updatingProductionForecast = historyAndForecast?.filter(
    (x) => x.dataset_id === FingridHourEnergyEvents.ProductionForecast_Updating
  );

  const { data: latestData } = useGetLatest({
    datasetIds: [
      FingridRealTimeEvents.Nuclear,
      FingridRealTimeEvents.Wind,
      FingridRealTimeEvents.Water,
      FingridRealTimeEvents.Industrial,
      FingridRealTimeEvents.DistrictHeating,
      FingridRealTimeEvents.Condensation,
      FingridRealTimeEvents.Other,
    ],
  });
  const { data: latestTotals } = useGetLatest({
    datasetIds: [
      FingridRealTimeEvents.AllProduction,
      FingridRealTimeEvents.AllConsumption,
    ],
  });

  return (
    <Space
      direction="vertical"
      className="text-center"
      style={{ width: "calc(100vw - 32px)" }}
    >
      <FingridSummary latestTotals={latestTotals} />
      <FingridProductionData data={latestData} />
      <FingridWindForecast
        produced={windProduction}
        hourlyForecast={onceInHourWind}
        dailyForecast={onceInDayWind}
      />
      <FingridConsumptionForecast
        hourEnergyConsumptionForecast={updatingConsumptionForecast}
        hourEnergyProductionForecast={updatingProductionForecast}
      />
      <hr />
      <a href="https://www.fingrid.fi/online" rel="noopener noreferrer">
        Sähköjärjestelmän tila (Fingrid)
      </a>
    </Space>
  );
}
