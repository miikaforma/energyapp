import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";
import { type homewizard_measurements } from "@energyapp/generated/client";

const useHomewizardSubscription = (onData?: (data: homewizard_measurements) => void) => {
  console.log('Initializing Homewizard subscription');
  const subscription = api.homewizard.onNewMeasurement.useSubscription(undefined, {
    onData: (data) => {
      console.log("Received Homewizard measurement data", data);
      if (onData) {
        onData(data);
      }
      return data;
    },
    onError: (err: unknown) => {
      if (err instanceof TRPCClientError) {
        if (err.data?.code === "NOT_FOUND") {
          toast.error("Mittauslaitetta ei löytynyt.");
          return;
        }
        toast.error(
          "Virhe haettaessa mittaustietoja. Yritä myöhemmin uudelleen.",
        );
      }
    },
  });

  return subscription;
};

export default useHomewizardSubscription;
