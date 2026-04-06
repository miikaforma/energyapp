import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useUpsertShellyDeviceNotificationPreferences = (
  options?: { onSuccess?: () => void },
) => {
  const utils = api.useUtils();

  return api.shelly.upsertDeviceNotificationPreferences.useMutation({
    onSuccess: async (data, variables) => {
      if (data?.success) {
        toast.success("Ilmoitusasetukset tallennettu");
        options?.onSuccess?.();
      }

      await utils.shelly.getDeviceNotificationPreferences.invalidate({
        deviceId: variables.deviceId,
      });
    },
    onError: (err: unknown) => {
      if (err instanceof TRPCClientError) {
        toast.error("Ilmoitusasetusten tallennus epäonnistui. Yritä uudelleen.");
      }
    },
  });
};

export default useUpsertShellyDeviceNotificationPreferences;
