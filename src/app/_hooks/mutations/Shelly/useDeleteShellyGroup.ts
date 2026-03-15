import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useDeleteShellyGroup = (options?: { onSuccess?: () => void }) => {
  const utils = api.useUtils();

  return api.shelly.deleteGroup.useMutation({
    onSuccess: (data) => {
      if (data?.success) {
        toast.success("Ryhmä poistettu");
        options?.onSuccess?.();
      }

      void utils.shelly.getGroups.invalidate();
    },
    onError: (err: unknown) => {
      if (err instanceof TRPCClientError) {
        toast.error("Ryhmä poistaminen epäonnistui. Yritä uudelleen.");
      }
    },
  });
};

export default useDeleteShellyGroup;
