import { TimePeriod } from "@energyapp/shared/enums";
import dayjs from "dayjs";

export function isCurrentYear(
  time: string | number | Date | dayjs.Dayjs | null | undefined,
) {
  return dayjs(time).isSame(dayjs(), "year");
}

export function isCurrentMonth(
  time: string | number | Date | dayjs.Dayjs | null | undefined,
) {
  return dayjs(time).isSame(dayjs(), "month");
}

export function isCurrentDay(
  time: string | number | Date | dayjs.Dayjs | null | undefined,
) {
  return dayjs(time).isSame(dayjs(), "day");
}

export function isCurrentHour(
  time: string | number | Date | dayjs.Dayjs | null | undefined,
) {
  return dayjs(time).isSame(dayjs(), "hour");
}

export function isCurrentPT15M(
  time: string | number | Date | dayjs.Dayjs | null | undefined,
) {
  const now = dayjs();
  const t = dayjs(time);
  // Find the start of the current 15-min interval
  const start = now.startOf("hour").add(Math.floor(now.minute() / 15) * 15, "minute");
  const end = start.add(15, "minute");
  return t.isSameOrAfter(start) && t.isBefore(end);
}

export function isCurrentMinute(
  time: string | number | Date | dayjs.Dayjs | null | undefined,
) {
  return dayjs(time).isSame(dayjs(), "minute");
}

export function dateToTableString(
  date: Date | dayjs.Dayjs | null | undefined,
  timePeriod: TimePeriod,
) {
  const time = dayjs(date);

  switch (timePeriod) {
    case TimePeriod.P1Y:
      return dayjs(date).format("YYYY");
    case TimePeriod.P1M:
      return dayjs(date).format("YYYY - MMMM");
    case TimePeriod.P1D:
      return dayjs(date).format("DD.MM.YYYY");
    case TimePeriod.PT1H:
      return `klo ${time.hour().toString().padStart(2, "0")} - ${time
        .add(1, "hour")
        .hour()
        .toString()
        .padStart(2, "0")}`;
    case TimePeriod.PT15M:
      return `klo ${time.format("HH:mm")} - ${time
        .add(15, "minute")
        .format("HH:mm")}`;
  }
}

export function dateToShellyTimeString(
  date: Date | dayjs.Dayjs | null | undefined,
  timePeriod: TimePeriod,
) {
  const time = dayjs(date);

  switch (timePeriod) {
    case TimePeriod.P1Y:
      return dayjs(date).format("YYYY");
    case TimePeriod.P1M:
      return dayjs(date).format("YYYY - MMMM");
    case TimePeriod.P1D:
      return dayjs(date).format("DD.MM.YYYY - dddd");
    case TimePeriod.PT1H:
      return `klo ${time.hour().toString().padStart(2, "0")} - ${time
        .add(1, "hour")
        .hour()
        .toString()
        .padStart(2, "0")}`;
    case TimePeriod.PT15M:
      return `klo ${time.format("HH:mm")} - ${time
        .add(15, "minute")
        .format("HH:mm")}`;
  }
}

export function dateToSpotTimeString(
  date: Date | dayjs.Dayjs | null | undefined,
  timePeriod: TimePeriod,
) {
  const time = dayjs(date);

  switch (timePeriod) {
    case TimePeriod.P1Y:
      return dayjs(date).format("YYYY");
    case TimePeriod.P1M:
      return dayjs(date).format("YYYY - MMMM");
    case TimePeriod.P1D:
      return dayjs(date).format("DD.MM.YYYY - dddd");
    case TimePeriod.PT1H:
      return `klo ${time.hour().toString().padStart(2, "0")} - ${time
        .add(1, "hour")
        .hour()
        .toString()
        .padStart(2, "0")}`;
    case TimePeriod.PT15M:
      return `klo ${time.format("HH:mm")} - ${time
        .add(15, "minute")
        .format("HH:mm")}`;
  }
}

export function dateToShortSpotTimeString(
  date: Date | dayjs.Dayjs | null | undefined,
  timePeriod: TimePeriod,
) {
  const time = dayjs(date);

  switch (timePeriod) {
    case TimePeriod.P1Y:
      return dayjs(date).format("YYYY");
    case TimePeriod.P1M:
      return dayjs(date).format("MMMM");
    case TimePeriod.P1D:
      return dayjs(date).format("DD.MM.YYYY");
    case TimePeriod.PT1H:
      return `klo ${time.hour().toString().padStart(2, "0")} - ${time
        .add(1, "hour")
        .hour()
        .toString()
        .padStart(2, "0")}`;
    case TimePeriod.PT15M:
      return `klo ${time.format("HH:mm")} - ${time
        .add(15, "minute")
        .format("HH:mm")}`;
  }
}
