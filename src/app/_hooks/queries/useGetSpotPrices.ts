import { useSettingsStore } from "@energyapp/app/_stores/settings/settings";
import { TimePeriod } from "@energyapp/shared/enums";
import { type ISettings } from "@energyapp/shared/interfaces";
import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import dayjs, { type Dayjs } from "dayjs";
import toast from "react-hot-toast";

interface IUseGetSpotPrices {
    timePeriod: TimePeriod;
    startTime: Dayjs;
    endTime: Dayjs;
}

interface IPrefetchGetSpotPrices {
    utils: ReturnType<typeof api.useUtils>;
    settings: ISettings;
    timePeriod: TimePeriod;
    startTime: Dayjs;
    endTime: Dayjs;
}

const useGetSpotPrices = ({ timePeriod, startTime, endTime }: IUseGetSpotPrices) => {
    const utils = api.useUtils();
    const settingsStore = useSettingsStore();
    const settings = settingsStore.settings;

    const query = api.spotPrice.get.useQuery({
        timePeriod: timePeriod, startTime, endTime, additionalHour: settings.additionalHourInSpotPrices
    }, {
        select: data => data,
        onSuccess: (_data) => {
            prefetchSpotPrices({ utils, settings, timePeriod, startTime, endTime });
        },
        onError: (err: unknown) => {
            if (err instanceof TRPCClientError) {
                if (err.data?.code === 'NOT_FOUND') {
                    toast.error('Valitulle aikavälille ei löytynyt hintoja.');
                    return;
                }
                toast.error('Virhe haettaessa hintoja. Yritä myöhemmin uudelleen.');
            }
        }
    });

    return { ...query, prefetch: prefetchSpotPrices }
}

const prefetchSpotPrices = ({ utils, settings, timePeriod, startTime, endTime }: IPrefetchGetSpotPrices) => {
    let previousStart: Dayjs = dayjs();
    let previousEnd: Dayjs = dayjs();
    let nextStart: Dayjs = dayjs();
    let nextEnd: Dayjs = dayjs();

    switch (timePeriod) {
        case TimePeriod.PT1H:
            previousStart = startTime.add(-1, 'day');
            previousEnd = startTime.add(-1, 'day');
            nextStart = endTime.add(1, 'day');
            nextEnd = endTime.add(1, 'day');
            break;
        case TimePeriod.P1D:
            previousStart = startTime.add(-1, 'day').startOf('month');
            previousEnd = startTime.add(-1, 'day').endOf('month');
            nextStart = endTime.add(1, 'day').startOf('month');
            nextEnd = endTime.add(1, 'day').endOf('month');
            break;
        case TimePeriod.P1M:
            previousStart = startTime.add(-1, 'month').startOf('year');
            previousEnd = startTime.add(-1, 'month').endOf('year');
            nextStart = endTime.add(1, 'month').startOf('year');
            nextEnd = endTime.add(1, 'month').endOf('year');
            break;
        case TimePeriod.P1Y:
            previousStart = startTime.add(-1, 'year');
            previousEnd = startTime.add(-1, 'year');
            nextStart = endTime.add(1, 'year');
            nextEnd = endTime.add(1, 'year');
            break;
    }

    // Prefetch previous
    void utils.spotPrice.get.prefetch({
        timePeriod: timePeriod,
        startTime: previousStart.hour(0).minute(0).second(0).millisecond(0),
        endTime: previousEnd.hour(23).minute(59).second(59).millisecond(999),
        additionalHour: settings.additionalHourInSpotPrices
    }, {

    });
    // Prefetch next
    void utils.spotPrice.get.prefetch({
        timePeriod: timePeriod,
        startTime: nextStart.hour(0).minute(0).second(0).millisecond(0),
        endTime: nextEnd.hour(23).minute(59).second(59).millisecond(999),
        additionalHour: settings.additionalHourInSpotPrices
    }, {

    });
}

export default useGetSpotPrices
