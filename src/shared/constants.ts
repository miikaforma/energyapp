import { type ISettings } from "./interfaces";

export const TemporarySettings = {
  margin: 0.59,
  addElectricityTax: true,
  nightTransfer: true,
  transferDay: 2.95,
  transferNight: 1.5,
  nightStart: 22,
  nightEnd: 7,
} as ISettings;

export const QUERY_KEYS = {
  eventById: (eventId: number) => ['eventById', eventId],
  eventByIds: (eventIds: string) => ['eventByIds', eventIds],
  eventsById: (eventId: number, startTime: string, endTime: string) => ['events', eventId, startTime, endTime],
}

export enum FingridEvents {
  OnceInHour_Wind = 245,
  OnceInDay_Wind = 246,
  NextDay_ConsumptionForecast = 165,
}

export enum FingridHourEnergyEvents {
  WindProduction = 75,
  ConsumptionForecast_Updating = 166,
  ProductionForecast_Updating = 241,
  ProductionForecast_Preliminary = 242,
}

export enum FingridRealTimeEvents {
  Wind = 181,
  Nuclear = 188,
  Condensation = 189,
  Water = 191,
  AllProduction = 192,
  AllConsumption = 193,
  Industrial = 202,
  DistrictHeating = 201,
  Other = 205, // Varavoimalaitokset ja pientuotanto
}

export const FINGRID_API = "https://api.fingrid.fi";
