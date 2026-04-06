import { api } from "@energyapp/trpc/react";

type GetShellyGroupNotificationPreferences = {
  groupKey?: string;
};

const useGetShellyGroupNotificationPreferences = ({
  groupKey,
}: GetShellyGroupNotificationPreferences) => {
  return api.shelly.getGroupNotificationPreferences.useQuery(
    { groupKey: groupKey ?? "" },
    {
      enabled: !!groupKey,
    },
  );
};

export default useGetShellyGroupNotificationPreferences;
