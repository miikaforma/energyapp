import { api } from "@energyapp/trpc/react";

const useGetRuuviDevicesWithInfo = () => {
    const query = api.ruuvi.getDevicesWithInfo.useQuery(undefined, {
        refetchInterval: 10 * 1000, // Refetch every 10 seconds
    });

    return query;
};

export default useGetRuuviDevicesWithInfo;
