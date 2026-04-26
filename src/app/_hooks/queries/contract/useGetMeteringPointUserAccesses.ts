import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

type GetMeteringPointUserAccesses = {
  meteringPointId?: string;
};

const useGetMeteringPointUserAccesses = ({ meteringPointId }: GetMeteringPointUserAccesses) => {
  const query = api.contract.getMeteringPointUserAccesses.useQuery(
    { metering_point_ean: meteringPointId ?? "" },
    {
      enabled: !!meteringPointId,
      onError: (err: unknown) => {
        if (err instanceof TRPCClientError) {
          toast.error("Virhe haettaessa käyttöoikeuksia. Yritä myöhemmin uudelleen.");
        }
      },
    },
  );

  return { ...query };
};

export default useGetMeteringPointUserAccesses;
