import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useSetMeteringPointUserAccesses = (options?: { onSuccess?: () => void }) => {
  const utils = api.useUtils();

  return api.contract.setMeteringPointUserAccesses.useMutation({
    onSuccess: (_data, variables) => {
      toast.success("Käyttöoikeudet tallennettu");
      options?.onSuccess?.();

      void utils.contract.getMeteringPointUserAccesses.invalidate({
        metering_point_ean: variables.metering_point_ean,
      });
    },
    onError: (err: unknown) => {
      if (err instanceof TRPCClientError) {
        toast.error("Käyttöoikeuksien tallennus epäonnistui. Yritä uudelleen.");
      }
    },
  });
};

export default useSetMeteringPointUserAccesses;
