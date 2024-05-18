import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import { type Dayjs } from "dayjs";
import toast from "react-hot-toast";

type UseGetDataset = {
  datasetIds: number[];
  startTime: Dayjs;
  endTime?: Dayjs;
};

const useGetDataset = ({ datasetIds, startTime, endTime }: UseGetDataset) => {
  const query = api.fingrid.getDataset.useQuery(
    {
      datasetIds,
      startTime,
      endTime,
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

export default useGetDataset;
