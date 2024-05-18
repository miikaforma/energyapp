import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

type UseGetLatest = {
  datasetIds: number[];
};

const useGetLatest = ({ datasetIds }: UseGetLatest) => {
  const query = api.fingrid.getLatest.useQuery(
    {
      datasetIds,
    },
    {
      onError: (err: unknown) => {
        if (err instanceof TRPCClientError) {
          if (err.data?.code === "NOT_FOUND") {
            toast.error("Valitulle aikavälille ei löytynyt tietoja.");
            return;
          }
          toast.error(
            "Virhe haettaessa tietoja. Yritä myöhemmin uudelleen.",
          );
        }
      },
    },
  );

  return query;
};

export default useGetLatest;
