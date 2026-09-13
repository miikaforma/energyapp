import dayjs, { type Dayjs } from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function addVAT(price: number, vat: number) {
  if (!vat || vat <= 0 /*|| Math.sign(price) === -1*/) {
    return price;
  }

  vat = vat / 100 + 1;
  return price * vat;
}

export function addMargin(price: number, margin: number) {
  if (!margin || margin <= 0) {
    return price;
  }

  return price + margin;
}

export function getTransfer(
  time: Dayjs | Date,
  settings: {
    nightTransfer: boolean;
    transferDay: number;
    transferNight: number;
    nightStart: number;
    nightEnd: number;
  },
) {
  const { nightTransfer, transferDay, transferNight, nightStart, nightEnd } =
    settings;
  // console.log("getTransfer", { nightTransfer, transferDay, transferNight, nightStart, nightEnd })
  const hours = dayjs(time).hour();

  if (nightTransfer && (hours >= nightStart || hours < nightEnd)) {
    // Night
    return transferNight;
  }

  // Day
  return transferDay;
}

export function addTransfer(price: number, transfer: number) {
  if (!transfer || transfer <= 0) {
    return price;
  }

  return price + transfer;
}

export function addTax(time: Dayjs | Date, price: number, addTax: boolean) {
  if (!addTax) {
    return price;
  }

  // If the price is after 01.09.2024, the tax is 25,5%, otherwise 24%
  const priceDateTime = dayjs(time);
  const tax = priceDateTime.isAfter('2024-08-31T20:59:59.999Z') ? 1.255 : 1.24;

  // The strategic stockpile fee included in the electricity tax is 2.253 c/kWh as of 1.9.2024
  let baseElectricityTax = 2.253;

  // If the price is after 31.3.2026, the strategic stockpile fee is increased to 2.325 c/kWh
  if (priceDateTime.isAfter('2026-03-31T20:59:59.999Z')) {
    baseElectricityTax = 2.325; // Adjust the base electricity tax for the new VAT rate
  }
  
  return price + (baseElectricityTax * tax); //2.79372;
}
