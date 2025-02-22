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

// https://fi.wikipedia.org/wiki/Arvonlis%C3%A4vero#Suomen_ALV-kantojen_kehitys
export const ElectricityTaxPercentages = [
  { start_time: "1998-01-01T00:00:00", end_time: "2010-06-30T21:59:59", tax_percentage: 22 },
  { start_time: "2010-06-30T22:00:00", end_time: "2012-12-31T21:59:59", tax_percentage: 23 }, // https://web.archive.org/web/20170814054807/https://www.vero.fi/syventavat-vero-ohjeet/ohje-hakusivu/47792/arvonlisaverokantojen_muutos_17201/
  { start_time: "2012-12-31T22:00:00", end_time: "2022-11-30T21:59:59", tax_percentage: 24 }, // https://www.finlex.fi/fi/esitykset/he/2012/20120089
  { start_time: "2022-11-30T22:00:00", end_time: "2023-04-30T20:59:59", tax_percentage: 10 }, // https://www.vero.fi/tietoa-verohallinnosta/uutishuone/uutiset/uutiset/2022/sahkon-arvonlisaveroa-alennetaan-valiaikaisesti/
  { start_time: "2023-04-30T21:00:00", end_time: "2024-08-31T20:59:59", tax_percentage: 24 },
  { start_time: "2024-08-31T21:00:00", tax_percentage: 25.5 },
];

export const FINGRID_API = "https://api.fingrid.fi";
