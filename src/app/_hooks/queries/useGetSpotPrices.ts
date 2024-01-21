import { TimePeriod } from "@energyapp/shared/enums";
import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import { type Dayjs } from "dayjs";
import toast from "react-hot-toast";

interface IUseGetSpotPrices {
    timePeriod: TimePeriod;
    startTime: Dayjs;
    endTime: Dayjs;
}

interface IPrefetchGetSpotPrices {
    utils: ReturnType<typeof api.useUtils>;
    timePeriod: TimePeriod;
    startTime: Dayjs;
    endTime: Dayjs;
}

const useGetSpotPrices = ({ timePeriod, startTime, endTime }: IUseGetSpotPrices) => {
    const utils = api.useUtils();

    const query = api.spotPrice.get.useQuery({
        timePeriod: timePeriod, startTime, endTime
    }, {
        staleTime: Infinity,
        select: data => data,
        onSuccess: (data) => {
            prefetchSpotPrices({ utils, timePeriod, startTime, endTime });
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

const prefetchSpotPrices = ({ utils, timePeriod, startTime, endTime }: IPrefetchGetSpotPrices) => {
    let previousStart = null;
    let previousEnd = null;
    let nextStart = null;
    let nextEnd = null;

    switch (timePeriod) {
        case TimePeriod.Hour:
            previousStart = startTime.add(-1, 'day');
            previousEnd = startTime.add(-1, 'day');
            nextStart = endTime.add(1, 'day');
            nextEnd = endTime.add(1, 'day');
            break;
        case TimePeriod.Day:
            previousStart = startTime.add(-1, 'day').startOf('month');
            previousEnd = startTime.add(-1, 'day').endOf('month');
            nextStart = endTime.add(1, 'day').startOf('month');
            nextEnd = endTime.add(1, 'day').endOf('month');
            break;
        case TimePeriod.Month:
            previousStart = startTime.add(-1, 'month').startOf('year');
            previousEnd = startTime.add(-1, 'month').endOf('year');
            nextStart = endTime.add(1, 'month').startOf('year');
            nextEnd = endTime.add(1, 'month').endOf('year');
            break;
        case TimePeriod.Year:
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
        endTime: previousEnd.hour(23).minute(59).second(59).millisecond(999)
    }, {
        staleTime: Infinity,
    });
    // Prefetch next
    void utils.spotPrice.get.prefetch({
        timePeriod: timePeriod,
        startTime: nextStart.hour(0).minute(0).second(0).millisecond(0),
        endTime: nextEnd.hour(23).minute(59).second(59).millisecond(999)
    }, {
        staleTime: Infinity,
    });
}

export default useGetSpotPrices
