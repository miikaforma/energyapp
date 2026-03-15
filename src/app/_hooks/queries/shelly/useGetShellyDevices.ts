import { api } from "@energyapp/trpc/react";

const useGetShellyDevices = () => {
    const query = api.shelly.getDevices.useQuery();

    return query;
};

export default useGetShellyDevices;
