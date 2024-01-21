import { Dayjs } from "dayjs";
import { Currency, TimePeriod } from "@energyapp/shared/enums";

import { Prisma, PrismaClient } from "@prisma/client";
import { Session } from "next-auth";
import { DefaultArgs } from "@prisma/client/runtime/library";

export interface IContext {
  session: Session | null;
  headers: Headers;
  db: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>;
}

export interface ISettings {
    margin: number;
    addElectricityTax: boolean;
    nightTransfer: boolean;
    transferDay: number;
    transferNight: number;
    nightStart: number;
    nightEnd: number;
}

export interface ISpotPriceResponse {
    timePeriod: TimePeriod;
    summary: ISpotPriceSummary;
    prices: ISpotPrice[];
}

export interface ISpotPriceSummary {
    cheapest: ISpotPrice;
    mostExpensive: ISpotPrice;
    average: ISpotPrice;
}

export interface ISpotPrice {
    time?: Dayjs;
    currency: Currency;
    price: number;
    price_with_tax: number;
    year: number;
    month: number;
    day: number;
    hour: number;
}
