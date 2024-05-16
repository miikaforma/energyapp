import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import { type Dayjs } from "dayjs";
import toast from "react-hot-toast";

type UseGetSolarmanProductions = {
  startTime: Dayjs;
  endTime?: Dayjs;
};

// 30 minutes stale time
const staleTime = 30 * 60 * 1000;

const useGetSolarmanProductions = ({ startTime, endTime }: UseGetSolarmanProductions) => {
  const query = api.solarman.getProductions.useQuery(
    {
      startTime,
      endTime,
    },
    {
      staleTime: staleTime,
      select: (data) => data,
      onError: (err: unknown) => {
        if (err instanceof TRPCClientError) {
          if (err.data?.code === "NOT_FOUND") {
            toast.error("Valitulle aikavälille ei löytynyt tuottoja.");
            return;
          }
          toast.error(
            "Virhe haettaessa tuottoja. Yritä myöhemmin uudelleen.",
          );
        }
      },
    },
  );

  return query;

  // return { ...query }
};

export default useGetSolarmanProductions;
