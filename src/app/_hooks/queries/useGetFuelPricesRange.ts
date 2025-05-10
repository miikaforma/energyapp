import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useGetFuelPricesRange = () => {
  const query = api.tankille.getRange.useQuery(undefined, {
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
  });

  return query;
};

export default useGetFuelPricesRange;
