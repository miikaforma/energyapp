export const QUERY_KEYS = {
  eventById: (eventId: number) => ['eventById', eventId],
  eventByIds: (eventIds: string) => ['eventByIds', eventIds],
  eventsById: (eventId: number, startTime: string, endTime: string) => ['events', eventId, startTime, endTime],
}

export const FingridEvents = {
  OnceInHour_Wind: 245,
  OnceInDay_Wind: 246,
  NextDay_ConsumptionForecast: 165,
} as const

export const FingridHourEnergyEvents = {
  WindProduction: 75,
  ConsumptionForecast_Updating: 166,
  ProductionForecast_Updating: 241,
  ProductionForecast_Preliminary: 242,
} as const

export const FingridRealTimeEvents = {
  Wind: 181,
  Nuclear: 188,
  Condensation: 189,
  Water: 191,
  AllProduction: 192,
  AllConsumption: 193,
  Industrial: 202,
  DistrictHeating: 201,
  Other: 205, // Varavoimalaitokset ja pientuotanto
} as const

export const FINGRID_API = "https://api.fingrid.fi";
