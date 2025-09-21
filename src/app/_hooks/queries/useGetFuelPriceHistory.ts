import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import { type Dayjs } from "dayjs";
import toast from "react-hot-toast";

type GetFuelPriceHistory = {
  startTime: Dayjs;
  endTime: Dayjs;
};

const useGetFuelPriceHistory = ({ startTime, endTime }: GetFuelPriceHistory) => {
  const query = api.tankille.getPriceHistory.useQuery(
    {
      startTime,
      endTime,
    },
    {
      select: (data) => data,
      onError: (err: unknown) => {
        if (err instanceof TRPCClientError) {
          if (err.data?.code === "NOT_FOUND") {
            toast.error("Historiaa ei löytynyt.");
            return;
          }
          toast.error("Virhe haettaessa historiaa. Yritä myöhemmin uudelleen.");
        }
      },
    },
  );

  return query;
};

export default useGetFuelPriceHistory;
