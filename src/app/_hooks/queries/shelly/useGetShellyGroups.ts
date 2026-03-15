import { api } from "@energyapp/trpc/react";

const useGetShellyGroups = () => {
    const query = api.shelly.getGroups.useQuery();

    return query;
};

export default useGetShellyGroups;
