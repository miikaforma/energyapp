import { api } from "@energyapp/trpc/react";

type GetShellyDevicesWithInfo = {
    deviceIds?: string[];
    enabled?: boolean;
}

const useGetShellyDevicesWithInfo = (params?: GetShellyDevicesWithInfo) => {
    const query = api.shelly.getDevicesWithInfo.useQuery({ deviceIds: params?.deviceIds }, {
        refetchInterval: 10 * 1000, // Refetch every 10 seconds
        enabled: params?.enabled ?? true, // Enable by default
    });

    return query;
};

export default useGetShellyDevicesWithInfo;
