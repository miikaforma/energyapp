import { type Dayjs } from "dayjs";
import { type Currency, type TimePeriod } from "@energyapp/shared/enums";

import { type Prisma, type PrismaClient } from "@prisma/client";
import { type Session } from "next-auth";
import { type DefaultArgs } from "@prisma/client/runtime/library";

export interface IContext {
    session: Session | null;
    headers: Headers;
    db: PrismaClient;
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

export interface IUserAccess {
    accessId: string;
    type: string;
    accessName: string
    serviceAccess: {
        accessName: string
    }
}

export interface IUserAccessResponse {
    accessId: string;
    type: string;
    accessName: string
}

// Wattivahti consumptions
export interface IWattiVahtiConsumptionResponse {
    timePeriod: TimePeriod;
    summary: IWattiVahtiConsumption;
    consumptions: IWattiVahtiConsumption[];
}

export interface IWattiVahtiConsumption {
    time: Dayjs;
    metering_point_code: string;
    measure_type: number;
    contract_type?: number;
    source?: string;
    measure_unit?: string;
    tax_percentage?: number;
    night?: boolean;
    spot_price: number;
    spot_price_tax: number;
    spot_price_with_tax: number;
    energy_basic_fee: number;
    transfer_basic_fee: number;
    energy_consumption: number;
    energy_consumption_night: number;
    energy_consumption_day: number;
    energy_consumption_avg: number;
    energy_fee: number;
    energy_fee_night: number;
    energy_fee_day: number;
    energy_fee_avg: number;
    energy_margin?: number;
    energy_margin_night?: number;
    energy_margin_day?: number;
    energy_margin_avg?: number;
    transfer_fee: number;
    transfer_fee_night: number;
    transfer_fee_day: number;
    transfer_fee_avg: number;
    transfer_tax_fee: number;
    transfer_tax_fee_night: number;
    transfer_tax_fee_day: number;
    transfer_tax_fee_avg: number;
    price: number;
    price_night: number;
    price_day: number;
    price_avg: number;
    energy_fee_spot_no_margin: number;
    price_spot_no_margin: number;
}
