import dayjs, { type Dayjs } from "dayjs";
import { db } from "@energyapp/server/db";
import { ElectricityTaxPercentages } from "@energyapp/shared/constants";

interface UpdateParams {
  startDate: Dayjs;
  endDate: Dayjs;
}

type PriceData = {
  timestamp: number;
  price: number;
};

type ApiResponse = {
  success: boolean;
  data: {
    ee: PriceData[];
    fi: PriceData[];
    lv: PriceData[];
    lt: PriceData[];
  };
};

const API_URL = "https://dashboard.elering.ee/api";

export const updateFromElring = async ({
  startDate,
  endDate,
}: UpdateParams): Promise<boolean> => {
  console.debug({ startDate, endDate });

  try {
    const response = await fetch(
      `${API_URL}/nps/price?start=${dayjs(startDate).toISOString()}&end=${dayjs(
        endDate,
      ).add(1, 'hour').toISOString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "EnergyApp",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData: ApiResponse = (await response.json()) as ApiResponse;

    if (!responseData.success) {
      throw new Error("API response was not successful");
    }

    await addPricesToDb(responseData.data.fi);

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const addPricesToDb = async (data: PriceData[]) => {
  const mappedData = data.map((dataRow) => {
    const date = new Date(dataRow.timestamp * 1000);
    const taxPercentage = ElectricityTaxPercentages.find(
      (tax) => {
        const startTime = dayjs(tax.start_time).toDate();
        const endTime = tax.end_time ? dayjs(tax.end_time).toDate() : new Date();
        return date >= startTime && date <= endTime;
      },
    );

    return {
      time: date,
      currency: "EUR",
      in_domain: "10YFI-1--------U",
      out_domain: "10YFI-1--------U",
      price: dataRow.price,
      measure_unit: "MWH",
      source: "elring",
      tax_percentage: taxPercentage?.tax_percentage ?? 25.5,
    };
  });

  const upsertPromises = mappedData.map((price) =>
    db.day_ahead_prices.upsert({
      where: {
        time_in_domain_out_domain: {
          time: price.time,
          in_domain: price.in_domain,
          out_domain: price.out_domain
        },
      },
      update: price,
      create: price,
    }),
  );

  await Promise.all(upsertPromises);

  await db.$queryRaw`CALL refresh_continuous_aggregate('average_kwh_price_hour_by_hour', NULL, NULL);`;
  await db.$queryRaw`CALL refresh_continuous_aggregate('average_kwh_price_day_by_day', NULL, NULL);`;
  await db.$queryRaw`CALL refresh_continuous_aggregate('average_kwh_price_month_by_month', NULL, NULL);`;
  await db.$queryRaw`CALL refresh_continuous_aggregate('average_kwh_price_year_by_year', NULL, NULL);`;
};
