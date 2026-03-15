import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

type GetRuuviDevice = {
  id: string;
};

const useGetRuuviDevice = ({
  id,
}: GetRuuviDevice) => {
  const query = api.ruuvi.getDevice.useQuery(
    {
      id,
    },
    {
      select: (data) => data,
      onError: (err: unknown) => {
        if (err instanceof TRPCClientError) {
          if (err.data?.code === "NOT_FOUND") {
            toast.error("Valittua laitetta ei löytynyt tai sinulla ei ole siihen pääsyä.");
            return;
          }
          toast.error("Virhe haettaessa laitetta. Yritä myöhemmin uudelleen.");
        }
      },
    },
  );

  return query;
};

export default useGetRuuviDevice;
