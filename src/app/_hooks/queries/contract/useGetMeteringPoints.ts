import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useGetMeteringPoints = () => {
  const query = api.contract.getMeteringPoints.useQuery(undefined,
    {
      onError: (err: unknown) => {
        if (err instanceof TRPCClientError) {
          if (err.data?.code === "NOT_FOUND") {
            toast.error("Mittapaikkoja ei löytynyt.");
            return;
          }
          toast.error("Virhe haettaessa mittapaikkoja. Yritä myöhemmin uudelleen.");
        }
      },
    },
  );

  return { ...query };
};

export default useGetMeteringPoints;
