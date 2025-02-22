import dayjs, { type Dayjs } from "dayjs";
import { env } from "@energyapp/env";
import { db } from "@energyapp/server/db";
import {
  type energies,
  type electricity_observations,
  type contracts,
} from "@prisma/client";
import { TimePeriod } from "@energyapp/shared/enums";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

interface UpdateParams {
  timePeriod: TimePeriod;
  meteringPointEAN: string;
  startDate: Dayjs;
  endDate: Dayjs;
}

const productType = "8716867000030";
const readingType = {
  code: "BN02",
  value: "100"
}

export const updateFromDatahub = async ({
  timePeriod,
  meteringPointEAN,
  startDate,
  endDate,
}: UpdateParams): Promise<boolean> => {
  console.debug({ meteringPointEAN, startDate, endDate });

  if (timePeriod !== TimePeriod.PT1H && timePeriod !== TimePeriod.PT15M) {
    throw new Error(`Invalid time period: ${timePeriod}`);
  }

  const data = {
    MeteringPointEAN: meteringPointEAN,
    PeriodStartTS: getStartDate(startDate),
    PeriodEndTS: getEndDate(endDate),
    UnitType: "kWh",
    ProductType: productType,
    SettlementRelevant: false,
    ResolutionDuration: timePeriod === TimePeriod.PT1H ? "PT1H" : "PT15M",
    ReadingType: readingType.value,
  };
  console.debug({ data });

  try {
    const response = await fetch(
      `${env.DATAHUB_ENDPOINT}/datahub/updateConsumptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const recalculateWithContract = async ({
  timePeriod,
  meteringPointEAN,
  startDate,
  endDate,
}: UpdateParams): Promise<boolean> => {
  console.debug({ meteringPointEAN, startDate, endDate });

  try {
    // Get observations from the database
    const observations = await db.electricity_observations.findMany({
      where: {
        period_start: {
          gte: dayjs(startDate).toDate(),
          lte: dayjs(endDate).toDate(),
        },
        metering_point_ean: meteringPointEAN,
        resolution_duration: timePeriod,
        product_type: productType,
        reading_type: readingType.code,
      },
    });

    if (!observations.length) {
      return false;
    }

    // Get contracts from the database
    const contracts = await db.contracts.findMany({
      where: {
        metering_point_ean: meteringPointEAN,
      },
      include: {
        meteringPoint: true,
      },
    });

    if (!contracts.length) {
      return false;
    }

    // Get spot prices from the database
    const spotPrices = await db.day_ahead_prices.findMany({
      where: {
        time: {
          gte: dayjs(startDate).toDate(),
          lte: dayjs(endDate).toDate(),
        },
      },
    });

    const pointTypes: string[] = [];
    const data: energies[] = [];
    for (const observation of observations) {
      // observation.metering_point_ean is GSRN ID: 64YYYYYYY VVVVVVVV T
      // 64YYYYYYY = GS1 company ID (9 digits)
      // VVVVVVVV = Service reference number (8 digits)
      // T = check digit that is calculated from the preceding digits with the modulus 10 method

      // Take only the Service reference number (8 digits) from the metering point code because WattiVahti used those as metering point codes
      const meteringPointCode = parseInt(
        observation.metering_point_ean.slice(-9, -1),
      ).toString();

      // Find the contract that matches the observation (end_date can be null so make sure there's only one match), crash if multiple matches
      const contract = contracts.find(
        (contract) =>
          contract.start_date <= observation.period_start &&
          (contract.end_date === null ||
            contract.end_date >= observation.period_start),
      );

      if (!contract) {
        console.error(
          `No contract found for metering point ${meteringPointCode} at ${observation.period_start.toISOString()}`,
        );
        return false;
      }

      // Get the spot price for the observation
      const truncatedPeriodStart = dayjs(observation.period_start)
        .startOf("hour")
        .toDate();
      const dayAheadPrice = spotPrices.find(
        (price) => price.time.getTime() === truncatedPeriodStart.getTime(),
      );

      let spotPrice = dayAheadPrice?.price ?? null;
      if (spotPrice !== null) {
        spotPrice /= 10.0;
      }

      pointTypes.push(contract.meteringPoint.type);
      const isConsumption = contract.meteringPoint.type === "AG01";

      data.push({
        time: observation.period_start,
        metering_point_code: meteringPointCode,
        measure_type: isConsumption ? 1 : 6,
        contract_type: contract.contract_type,
        source: observation.measurement_source,
        measure_unit: observation.unit_type,
        value: observation.quantity,
        energy_basic_fee: contract.basic_fee,
        energy_fee: get_energy_fee(contract, observation),
        energy_margin: get_energy_margin(contract),
        transfer_basic_fee: contract.basic_fee_transfer,
        transfer_fee: get_transfer_fee(contract, observation),
        transfer_tax_fee: contract.tax_fee_transfer,
        tax_percentage: contract.tax_percentage,
        night: is_night(contract, observation),
        spot_price: spotPrice ?? 0.0,
        // Temp fix because I've previously been using incorrect resolution
        resolution_duration:
          observation.resolution_duration === "PT15M"
            ? "PT15MIN"
            : observation.resolution_duration,
      });
    }

    await addEnergiesToDb(data, new Set(pointTypes));

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const getStartDate = (time: Dayjs): string => {
  const newTime = dayjs(time).tz("Europe/Helsinki").startOf("month").utc();
  return newTime.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
};

const getEndDate = (time: Dayjs): string => {
  const newTime = dayjs(time)
    .tz("Europe/Helsinki")
    .endOf("month")
    .add(1, "millisecond")
    .utc();
  return newTime.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
};

export const addEnergiesToDb = async (data: energies[], pointTypes: Set<string>) => {
  //   await db.energies.createMany({
  //     data: data,
  //     skipDuplicates: true,
  //   });

  const upsertPromises = data.map((energy) =>
    db.energies.upsert({
      where: {
        time_metering_point_code_measure_type_resolution_duration: {
          time: energy.time,
          metering_point_code: energy.metering_point_code,
          measure_type: energy.measure_type,
          resolution_duration: energy.resolution_duration,
        },
      },
      update: energy,
      create: energy,
    }),
  );

  await Promise.all(upsertPromises);

  // Refresh the continuous aggregates
  if (pointTypes.has("AG01")) {
    await db.$queryRaw`CALL refresh_continuous_aggregate('energies_consumption_15min_by_15min', NULL, NULL);`;
    await db.$queryRaw`CALL refresh_continuous_aggregate('energies_consumption_hour_by_hour', NULL, NULL);`;
    await db.$queryRaw`CALL refresh_continuous_aggregate('energies_consumption_day_by_day', NULL, NULL);`;
    await db.$queryRaw`CALL refresh_continuous_aggregate('energies_consumption_month_by_month', NULL, NULL);`;
    await db.$queryRaw`CALL refresh_continuous_aggregate('energies_consumption_year_by_year', NULL, NULL);`;
  }
  if (pointTypes.has("AG02")) {
    await db.$queryRaw`CALL refresh_continuous_aggregate('energies_production_15min_by_15min', NULL, NULL);`;
    await db.$queryRaw`CALL refresh_continuous_aggregate('energies_production_hour_by_hour', NULL, NULL);`;
    await db.$queryRaw`CALL refresh_continuous_aggregate('energies_production_day_by_day', NULL, NULL);`;
    await db.$queryRaw`CALL refresh_continuous_aggregate('energies_production_month_by_month', NULL, NULL);`;
    await db.$queryRaw`CALL refresh_continuous_aggregate('energies_production_year_by_year', NULL, NULL);`;
  }
};

const get_energy_fee = (
  contract: contracts,
  observation: electricity_observations,
  //   spotPrice: number,
) => {
  switch (contract.contract_type) {
    case 2: // Fixed
    case 4: // Hybrid
      if (is_night(contract, observation)) {
        return contract.night_fee ?? 0.0;
      }
      return contract.day_fee ?? 0.0;
    case 3: // Spot
      return null;
    //   const margin = contract.margin ?? 0.0;
    //   const tax_percentage = contract.tax_percentage ?? 25.5;
    //   const no_tax_for_negative = contract.negative_no_tax ?? false;

    //   if (no_tax_for_negative && spotPrice < 0.0) {
    //     return spotPrice / 10.0 + margin;
    //   }
    //   return (spotPrice / 10.0) * (tax_percentage / 100.0 + 1.0) + margin;
    case 1: // None
    default:
      return 0.0;
  }
};

const get_energy_margin = (contract: contracts) => {
  switch (contract.contract_type) {
    case 2: // Fixed
    case 4: // Hybrid
      return null;
    case 3: // Spot
      return contract.margin ?? 0.0;
    case 1: // None
    default:
      return 0.0;
  }
};

const get_transfer_fee = (
  contract: contracts,
  observation: electricity_observations,
) => {
  if (is_night(contract, observation)) {
    return contract.night_fee_transfer ?? 0.0;
  }
  return contract.day_fee_transfer ?? 0.0;
};

const is_night = (
  contract: contracts,
  observation: electricity_observations,
) => {
  const hour = dayjs(observation.period_start).tz("Europe/Helsinki").hour();
  const nightStartHour = contract.night_start_hour ?? 22;
  const nightEndHour = contract.night_end_hour ?? 7;

  const isNight = hour >= nightStartHour || hour < nightEndHour;
  return isNight;
};
