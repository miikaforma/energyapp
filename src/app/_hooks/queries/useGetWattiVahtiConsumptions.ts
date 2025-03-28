import { TimePeriod } from "@energyapp/shared/enums";
import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import dayjs, { type Dayjs } from "dayjs";
import toast from "react-hot-toast";

interface IUseGetWattiVahtiConsumptions {
    timePeriod: TimePeriod;
    startTime: Dayjs;
    endTime: Dayjs;
}

interface IPrefetchWattiVahtiConsumptions {
    utils: ReturnType<typeof api.useUtils>;
    timePeriod: TimePeriod;
    startTime: Dayjs;
    endTime: Dayjs;
    singlePrefetch?: boolean;
}

// 30 minutes stale time
const staleTime = 30 * 60 * 1000;

const useGetWattiVahtiConsumptions = ({ timePeriod, startTime, endTime }: IUseGetWattiVahtiConsumptions) => {
    const utils = api.useUtils();

    const query = api.wattivahti.getConsumptions.useQuery({
        timePeriod: timePeriod, startTime, endTime
    }, {
        staleTime: staleTime,
        select: data => data,
        onSuccess: (_data) => {
            prefetchWattiVahtiConsumptions({ utils, timePeriod, startTime, endTime });
        },
        onError: (err: unknown) => {
            if (err instanceof TRPCClientError) {
                if (err.data?.code === 'NOT_FOUND') {
                    toast.error('Valitulle aikavälille ei löytynyt kulutuksia.');
                    return;
                }
                toast.error('Virhe haettaessa kulutuksia. Yritä myöhemmin uudelleen.');
            }
        },
        refetchOnWindowFocus: 'always'
    });

    return { ...query, prefetch: prefetchWattiVahtiConsumptions }
}

const prefetchWattiVahtiConsumptions = ({ utils, timePeriod, startTime, endTime, singlePrefetch = false }: IPrefetchWattiVahtiConsumptions) => {
    if (singlePrefetch) {
        void utils.wattivahti.getConsumptions.prefetch({
            timePeriod: timePeriod,
            startTime: startTime,
            endTime: endTime,
        }, {
            staleTime: staleTime,
        });
        return;
    }

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
    void utils.wattivahti.getConsumptions.prefetch({
        timePeriod: timePeriod,
        startTime: previousStart.hour(0).minute(0).second(0).millisecond(0),
        endTime: previousEnd.hour(23).minute(59).second(59).millisecond(999)
    }, {
        staleTime: staleTime,
    });
    // Prefetch next
    void utils.wattivahti.getConsumptions.prefetch({
        timePeriod: timePeriod,
        startTime: nextStart.hour(0).minute(0).second(0).millisecond(0),
        endTime: nextEnd.hour(23).minute(59).second(59).millisecond(999)
    }, {
        staleTime: staleTime,
    });
}

export default useGetWattiVahtiConsumptions
