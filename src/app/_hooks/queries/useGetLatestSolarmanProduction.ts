import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useGetLatestSolarmanProduction = ({ enabled } = { enabled: true }) => {
  const query = api.solarman.getLatest.useQuery(undefined, {
    select: (data) => data,
    onError: (err: unknown) => {
      if (err instanceof TRPCClientError) {
        if (err.data?.code === "NOT_FOUND") {
          toast.error("Viimeisintä tuotantotietoa ei löytynyt.");
          return;
        }
        toast.error(
          "Virhe haettaessa viimeisintä tuotantotietoa. Yritä myöhemmin uudelleen.",
        );
      }
    },
    refetchInterval: 10 * 1000, // 10 seconds
    enabled: enabled,
  });

  return query;
};

export default useGetLatestSolarmanProduction;
