import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useDeleteContract = (options?: { onSuccess?: () => void }) => {
  const utils = api.useUtils();

  return api.contract.deleteContract.useMutation({
    onSuccess: (data) => {
      if (data?.success) {
        toast.success("Sopimus poistettu");
        options?.onSuccess?.();
      }

      void utils.contract.getContracts.invalidate();
    },
    onError: (err: unknown) => {
      if (err instanceof TRPCClientError) {
        toast.error("Sopimuksen poistaminen epäonnistui. Yritä uudelleen.");
      }
    },
  });
};

export default useDeleteContract;
