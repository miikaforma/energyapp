import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useUpsertShellyGroup = (options?: { onSuccess?: () => void }) => {
  const utils = api.useUtils();

  return api.shelly.upsertGroup.useMutation({
    onSuccess: (data) => {
      if (data?.success) {
        toast.success("Ryhmä tallennettu");
        options?.onSuccess?.();
      }

      void utils.shelly.getGroups.invalidate();
    },
    onError: (err: unknown) => {
      if (err instanceof TRPCClientError) {
        toast.error("Ryhmä tallennus epäonnistui. Yritä uudelleen.");
      }
    },
  });
};

export default useUpsertShellyGroup;
