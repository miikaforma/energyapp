import { type TimePeriod } from "@energyapp/shared/enums";
import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

type GetSpotPriceRange = {
    timePeriod: TimePeriod;
}

const useGetSpotPriceRange = ({ timePeriod }: GetSpotPriceRange) => {
    const query = api.spotPrice.getRange.useQuery({
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
        }
    });

    return query
}

export default useGetSpotPriceRange
