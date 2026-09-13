import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { type homewizard_measurements } from "@energyapp/generated/client";

const useHomewizardSubscription = (
  onData?: (data: homewizard_measurements) => void,
  enabled = true,
) => {
  useEffect(() => {
    if (enabled) console.log('Homewizard subscription mounted');
    return () => { if (enabled) console.log('Homewizard subscription unmounted'); };
  }, [enabled]);

  const subscription = api.homewizard.onNewMeasurement.useSubscription(undefined, {
    enabled,
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
