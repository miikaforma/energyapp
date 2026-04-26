import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useUpsertMeteringPoint = (options?: { onSuccess?: () => void }) => {
  const utils = api.useUtils();

  return api.contract.upsertMeteringPoint.useMutation({
    onSuccess: (data) => {
      if (data?.success) {
        toast.success("Mittapaikka tallennettu");
        options?.onSuccess?.();
      }

      void utils.contract.getMeteringPoints.invalidate();
    },
    onError: (err: unknown) => {
      if (err instanceof TRPCClientError) {
        toast.error("Mittapaikan tallennus epäonnistui. Yritä uudelleen.");
      }
    },
  });
};

export default useUpsertMeteringPoint;
