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
  
  return price + (2.253 * tax); //2.79372;
}
