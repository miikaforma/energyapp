import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

type GetContract = {
    contractId?: number;
}

const useGetContract = ({ contractId }: GetContract) => {
  const query = api.contract.getContract.useQuery({ contractId: contractId ?? 0 },
    {
      enabled: !!contractId,
      onError: (err: unknown) => {
        if (err instanceof TRPCClientError) {
          if (err.data?.code === "NOT_FOUND") {
            toast.error("Sopimusta ei löytynyt.");
            return;
          }
          toast.error("Virhe haettaessa sopimusta. Yritä myöhemmin uudelleen.");
        }
      },
    },
  );

  return { ...query };
};

export default useGetContract;
