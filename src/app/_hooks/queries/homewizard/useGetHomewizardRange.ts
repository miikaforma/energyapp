import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

type GetHomewizardRange = {
  deviceId?: string;
};

const useGetHomewizardRange = ({ deviceId }: GetHomewizardRange = {}) => {
  const query = api.homewizard.getRange.useQuery(
    { deviceId },
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
      refetchInterval: 5 * 60000,
    },
  );

  return query;
};

export default useGetHomewizardRange;
