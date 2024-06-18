import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const useGetCurrentSpotPrice = () => {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  const query = api.spotPrice.getCurrentPrice.useQuery(undefined, {
    select: (data) => data,
    onError: (err: unknown) => {
      if (err instanceof TRPCClientError) {
        if (err.data?.code === "NOT_FOUND") {
          toast.error("Tämänhetkistä hintaa ei löytynyt.");
          return;
        }
        toast.error(
          "Virhe haettaessa tämänhetkistä hintaa. Yritä myöhemmin uudelleen.",
        );
      }
    },
  });

  useEffect(() => {
    // Set an interval to check every 10 seconds if the hour has changed
    const intervalId = setInterval(() => {
      console.log("Checking if the hour has changed in useGetCurrentSpotPrice");
      const newHour = new Date().getHours();
      if (newHour !== currentHour) {
        // If the hour has changed, update the state and refresh the data
        setCurrentHour(newHour);
        void query.refetch();
      }
    }, 10 * 1000); // 10 * 1000 ms = 10 seconds

    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [currentHour]);

  return query;
};

export default useGetCurrentSpotPrice;
