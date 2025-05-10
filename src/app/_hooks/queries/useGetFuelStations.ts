import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import { type Dayjs } from "dayjs";
import toast from "react-hot-toast";

type GetFuelStations = {
  startTime: Dayjs;
  endTime?: Dayjs;
};

const useGetFuelStations = ({ startTime, endTime }: GetFuelStations) => {
  const query = api.tankille.getStations.useQuery(
    {
      startTime,
      endTime,
    },
    {
      select: (data) => data,
      onError: (err: unknown) => {
        if (err instanceof TRPCClientError) {
          if (err.data?.code === "NOT_FOUND") {
            toast.error("Aikaväliä ei löytynyt.");
            return;
          }
          toast.error("Virhe haettaessa aikaväliä. Yritä myöhemmin uudelleen.");
        }
      },
      refetchInterval: 5 * 60000, // Refetch every 5 minutes
    },
  );

  return query;
};

export default useGetFuelStations;
