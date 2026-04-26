import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

type GetContracts = {
  meteringPointId?: string;
}

const useGetContracts = ({ meteringPointId }: GetContracts) => {
  const query = api.contract.getContracts.useQuery({ metering_point_ean: meteringPointId ?? "" },
    {
      enabled: !!meteringPointId,
      onError: (err: unknown) => {
        if (err instanceof TRPCClientError) {
          if (err.data?.code === "NOT_FOUND") {
            toast.error("Sopimuksia ei löytynyt.");
            return;
          }
          toast.error("Virhe haettaessa sopimuksia. Yritä myöhemmin uudelleen.");
        }
      },
    },
  );

  return { ...query };
};

export default useGetContracts;
