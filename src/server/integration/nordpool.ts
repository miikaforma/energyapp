import dayjs, { type Dayjs } from "dayjs";
import { db } from "@energyapp/server/db";

import { Prices, type Result } from 'nordpool';
const prices = new Prices();

interface UpdateParams {
    startDate: Dayjs;
    endDate: Dayjs;
}

export const updateFromNordpool = async ({ startDate, endDate }: UpdateParams): Promise<boolean> => {
    console.debug({ startDate, endDate })

    const results = await prices.hourly({ area: 'FI', currency: 'EUR', date: dayjs(endDate).toDate() })
    if (!results?.length) {
        return false;
    }

    await addPricesToDb(results)

    return true;
};

export const addPricesToDb = async (data: Result[]) => {
    await db.day_ahead_prices.createMany({
        data: data.map(dataRow => {
            const date = new Date(dataRow.date)
            return {
                time: date,
                currency: 'EUR',
                in_domain: '10YFI-1--------U',
                out_domain: '10YFI-1--------U',
                price: dataRow.value,
                measure_unit: 'MWH',
                source: 'nordpool',
                tax_percentage: 25.5, // Should add config like in entsoe logger
            }
        }),
        skipDuplicates: true,
    })

    await db.$queryRaw`CALL refresh_continuous_aggregate('average_kwh_price_day_by_day', NULL, NULL);`
    await db.$queryRaw`CALL refresh_continuous_aggregate('average_kwh_price_month_by_month', NULL, NULL);`
    await db.$queryRaw`CALL refresh_continuous_aggregate('average_kwh_price_year_by_year', NULL, NULL);`
};