import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useUpsertContract = (options?: { onSuccess?: () => void }) => {
  const utils = api.useUtils();

  return api.contract.upsertContract.useMutation({
    onSuccess: (data) => {
      if (data?.success) {
        toast.success("Sopimus tallennettu");
        options?.onSuccess?.();
      }

      void utils.contract.getContracts.invalidate();
    },
    onError: (err: unknown) => {
      if (err instanceof TRPCClientError) {
        toast.error("Sopimuksen tallennus epäonnistui. Yritä uudelleen.");
      }
    },
  });
};

export default useUpsertContract;
