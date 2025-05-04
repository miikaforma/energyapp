import { api } from "@energyapp/trpc/react";

const useGetShellyDevicesWithInfo = () => {
    const query = api.shelly.getDevicesWithInfo.useQuery(undefined, {
        refetchInterval: 60000, // Refetch every 60 seconds
    });

    return query;
};

export default useGetShellyDevicesWithInfo;
