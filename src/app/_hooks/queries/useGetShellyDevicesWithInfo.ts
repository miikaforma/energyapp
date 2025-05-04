import { api } from "@energyapp/trpc/react";

const useGetShellyDevicesWithInfo = () => {
    const query = api.shelly.getDevicesWithInfo.useQuery(undefined, {
        refetchInterval: 10 * 1000, // Refetch every 10 seconds
    });

    return query;
};

export default useGetShellyDevicesWithInfo;
