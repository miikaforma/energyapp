import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

type GetMeteringPoint = {
    meteringPointId?: string;
}

const useGetMeteringPoint = ({ meteringPointId }: GetMeteringPoint) => {
  const query = api.contract.getMeteringPoint.useQuery({ id: meteringPointId ?? "" },
    {
      enabled: !!meteringPointId,
      onError: (err: unknown) => {
        if (err instanceof TRPCClientError) {
          if (err.data?.code === "NOT_FOUND") {
            toast.error("Mittauspaikkaa ei löytynyt.");
            return;
          }
          toast.error("Virhe haettaessa mittauspaikkaa. Yritä myöhemmin uudelleen.");
        }
      },
    },
  );

  return { ...query };
};

export default useGetMeteringPoint;
