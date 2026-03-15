import { api } from "@energyapp/trpc/react";

type GetShellyGroup = {
    groupKey?: string;
}

const useGetShellyGroup = ({ groupKey }: GetShellyGroup) => {
    const query = api.shelly.getGroup.useQuery({ groupKey: groupKey ?? "" }, {
        enabled: !!groupKey,
    });

    return query;
};

export default useGetShellyGroup;
