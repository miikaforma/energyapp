import { TimePeriod } from '@energyapp/shared/enums';
import dayjs from 'dayjs';

export function isCurrentYear(time: string | number | Date | dayjs.Dayjs | null | undefined) {
    return dayjs(time).isSame(dayjs(), 'year')
}

export function isCurrentMonth(time: string | number | Date | dayjs.Dayjs | null | undefined) {
    return dayjs(time).isSame(dayjs(), 'month')
}

export function isCurrentDay(time: string | number | Date | dayjs.Dayjs | null | undefined) {
    return dayjs(time).isSame(dayjs(), 'day')
}

export function isCurrentHour(time: string | number | Date | dayjs.Dayjs | null | undefined) {
    return dayjs(time).isSame(dayjs(), 'hour')
}

export function dateToSpotTimeString(date: Date | dayjs.Dayjs | null | undefined, timePeriod: TimePeriod) {
    const time = dayjs(date)

    switch (timePeriod) {
        case TimePeriod.Year:
            return dayjs(date).format('YYYY')
        case TimePeriod.Month:
            return dayjs(date).format('YYYY - MMMM')
        case TimePeriod.Day:
            return dayjs(date).format('DD.MM.YYYY - dddd')
        case TimePeriod.Hour:
            return `klo ${time.hour().toString().padStart(2, '0')} - ${time.add(1, 'hour').hour().toString().padStart(2, '0')}`
    }
}

export function dateToShortSpotTimeString(date: Date | dayjs.Dayjs | null | undefined, timePeriod: TimePeriod) {
    const time = dayjs(date)

    switch (timePeriod) {
        case TimePeriod.Year:
            return dayjs(date).format('YYYY')
        case TimePeriod.Month:
            return dayjs(date).format('MMMM')
        case TimePeriod.Day:
            return dayjs(date).format('DD.MM.YYYY')
        case TimePeriod.Hour:
            return `klo ${time.hour().toString().padStart(2, '0')} - ${time.add(1, 'hour').hour().toString().padStart(2, '0')}`
    }
}

