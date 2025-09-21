import type { PriceHistory } from "@energyapp/server/api/routers/tankille";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";

dayjs.extend(weekOfYear);

export const getCheapestWeekday = (priceHistory: PriceHistory[]) => {
  // Step 1: Group prices by weekday
  const weekdayPrices: Record<number, number[]> = {}; // { 0: [prices], 1: [prices], ... }

  priceHistory.forEach((entry) => {
    const weekday = dayjs(entry.time).day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    if (!weekdayPrices[weekday]) {
      weekdayPrices[weekday] = [];
    }
    weekdayPrices[weekday].push(Number(entry.price));
  });

  // Step 2: Calculate the average price for each weekday
  const weekdayAverages: Record<number, number> = {};
  Object.entries(weekdayPrices).forEach(([weekday, prices]) => {
    const total = prices.reduce((sum, price) => sum + price, 0);
    weekdayAverages[Number(weekday)] = total / prices.length;
  });

  // Step 3: Find the weekday with the lowest average price
  const cheapestWeekday = Object.entries(weekdayAverages).reduce(
    (cheapest, [weekday, avgPrice]) => {
      if (avgPrice < cheapest.avgPrice) {
        return { weekday: Number(weekday), avgPrice };
      }
      return cheapest;
    },
    { weekday: -1, avgPrice: Infinity },
  );

  // Map weekday number to name
  const weekdayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return {
    weekday: weekdayNames[cheapestWeekday.weekday],
    avgPrice: cheapestWeekday.avgPrice,
  };
};

export const getWeeklyData = (priceHistory: PriceHistory[]) => {
  const weeklyData: Record<
    number,
    {
      week: number;
      prices: Record<number, number[]>;
    }
  > = {};
  priceHistory.forEach((entry) => {
    const week = dayjs(entry.time).week(); // Get the week number
    const weekday = dayjs(entry.time).day(); // Get the weekday (0 = Sunday, ..., 6 = Saturday)
    if (!weeklyData[week]) {
      weeklyData[week] = { week, prices: {} };
    }
    if (!weeklyData[week].prices[weekday]) {
      weeklyData[week].prices[weekday] = [];
    }
    weeklyData[week].prices[weekday].push(Number(entry.price));
  });

  // Step 2: Calculate the cheapest price for each weekday and week
  const tableData = Object.values(weeklyData).map((weekData) => {
    const row: {
      key: number;
      week: string;
      [key: string]: number | string | null;
      cheapestDay: string | null;
    } = {
      key: weekData.week,
      week: `${weekData.week}`,
      cheapestDay: null,
    };
    let cheapestPrice = Infinity;
    let cheapestDay: string | null = null;

    for (let i = 0; i < 7; i++) {
      const prices = weekData.prices[i] ?? [];
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      row[`day${i}`] = minPrice;
      if (minPrice !== null && minPrice < cheapestPrice) {
        cheapestPrice = minPrice;
        cheapestDay = `day${i}`;
      }
    }

    row.cheapestDay = cheapestDay;
    return row;
  });

  return tableData;
};
