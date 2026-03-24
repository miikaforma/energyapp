import { api } from "@energyapp/trpc/react";

type GetShellyDeviceNotificationPreferences = {
  deviceId?: string;
};

const useGetShellyDeviceNotificationPreferences = ({
  deviceId,
}: GetShellyDeviceNotificationPreferences) => {
  return api.shelly.getDeviceNotificationPreferences.useQuery(
    { deviceId: deviceId ?? "" },
    {
      enabled: !!deviceId,
    },
  );
};

export default useGetShellyDeviceNotificationPreferences;
