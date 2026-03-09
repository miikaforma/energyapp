import { type TimePeriod } from "@energyapp/shared/enums";
import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

type GetRuuviRange = {
    timePeriod: TimePeriod;
}

const useGetRuuviRange = ({ timePeriod }: GetRuuviRange) => {
    const query = api.ruuvi.getRange.useQuery({
        timePeriod: timePeriod
    }, {
        select: data => data,
        onError: (err: unknown) => {
            if (err instanceof TRPCClientError) {
                if (err.data?.code === 'NOT_FOUND') {
                    toast.error('Aikaväliä ei löytynyt.');
                    return;
                }
                toast.error('Virhe haettaessa aikaväliä. Yritä myöhemmin uudelleen.');
            }
        },
        refetchInterval: 5 * 60000, // Refetch every 5 minutes
    });

    return query
}

export default useGetRuuviRange
