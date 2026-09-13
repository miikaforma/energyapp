import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useGetMeteringPointAccessUsers = () => {
  const query = api.contract.getMeteringPointAccessUsers.useQuery(undefined, {
    onError: (err: unknown) => {
      if (err instanceof TRPCClientError) {
        toast.error("Virhe haettaessa käyttäjiä. Yritä myöhemmin uudelleen.");
      }
    },
  });

  return { ...query };
};

export default useGetMeteringPointAccessUsers;
