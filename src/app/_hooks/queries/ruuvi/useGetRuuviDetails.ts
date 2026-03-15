import { TimePeriod } from "@energyapp/shared/enums";
import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import { type Dayjs } from "dayjs";
import toast from "react-hot-toast";

type GetRuuviDetails = {
  timePeriod: TimePeriod;
  startTime: Dayjs;
  endTime?: Dayjs;
  id?: string;
};

const useGetRuuviDetails = ({
  timePeriod,
  startTime,
  endTime,
  id,
}: GetRuuviDetails) => {
  //const utils = api.useUtils();

  const query = api.ruuvi.get.useQuery(
    {
      timePeriod: timePeriod,
      startTime,
      endTime,
      id,
    },
    {
      select: (data) => data,
      onSuccess: (_data) => {
        // prefetchRuuviDetails({ utils, timePeriod, startTime, endTime });
      },
      onError: (err: unknown) => {
        if (err instanceof TRPCClientError) {
          if (err.data?.code === "NOT_FOUND") {
            toast.error("Valitulle aikavälille ei löytynyt hintoja.");
            return;
          }
          toast.error("Virhe haettaessa hintoja. Yritä myöhemmin uudelleen.");
        }
      },
      refetchInterval: 60000, // Refetch every 60 seconds
    },
  );
  
  return { ...query };
};

export default useGetRuuviDetails;
