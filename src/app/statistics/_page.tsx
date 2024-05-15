"use client";

import useGetEvents from "@energyapp/app/_hooks/queries/fingrid/useGetEvents";
import {
  FingridEvents,
  FingridHourEnergyEvents,
  FingridRealTimeEvents,
} from "@energyapp/shared/constants";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import useGetEventByIds from "@energyapp/app/_hooks/queries/fingrid/useGetEventByIds";
import FingridProductionData from "@energyapp/app/_components/Charts/fingrid-current-production";
import FingridWindForecast from "@energyapp/app/_components/Charts/fingrid-wind-forecast";
import FingridConsumptionForecast from "@energyapp/app/_components/Charts/fingrid-consumption-forecast";
import FingridSummary from "../_components/Descriptions/fingrid-summary";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Statistics() {
  const startTime = dayjs()
    .subtract(1, "day")
    .startOf("day")
    .format("YYYY-MM-DDTHH:mm:ss[Z]");
  const endTime = dayjs()
    .add(5, "day")
    .startOf("day")
    .format("YYYY-MM-DDTHH:mm:ss[Z]");
  const { data: windProduction } =
    useGetEvents(FingridHourEnergyEvents.WindProduction, startTime, endTime);
  const { data: onceInHourWind } =
    useGetEvents(FingridEvents.OnceInHour_Wind, startTime, endTime);
  const { data: onceInDayWind } =
    useGetEvents(FingridEvents.OnceInDay_Wind, startTime, endTime);
  // const { data: nextDayConsumptionForecast, isLoading: nextDayConsumptionForecastIsLoading } = useGetEvents(FingridEvents.NextDay_ConsumptionForecast, startTime, endTime)
  const {
    data: updatingConsumptionForecast,
  } = useGetEvents(
    FingridHourEnergyEvents.ConsumptionForecast_Updating,
    startTime,
    endTime,
  );
  const {
    data: updatingProductionForecast,
  } = useGetEvents(
    FingridHourEnergyEvents.ProductionForecast_Updating,
    startTime,
    endTime,
  );
  const { data: latestData } = useGetEventByIds(
    [
      FingridRealTimeEvents.Nuclear,
      FingridRealTimeEvents.Wind,
      FingridRealTimeEvents.Water,
      FingridRealTimeEvents.Industrial,
      FingridRealTimeEvents.DistrictHeating,
      FingridRealTimeEvents.Condensation,
      FingridRealTimeEvents.Other,
    ].join(","),
    60 * 1000,
  );
  const { data: latestTotals, } =
    useGetEventByIds(
      [
        FingridRealTimeEvents.AllProduction,
        FingridRealTimeEvents.AllConsumption,
      ].join(","),
      60 * 1000,
    );

  return (
    <>
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
    </>
  );
}
