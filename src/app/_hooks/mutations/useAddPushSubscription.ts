import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useAddPushSubscription = () => {
    return api.pushSubscription.addSubscription.useMutation({
        onSuccess: (data) => {
            if (data) {
                toast.success('Notifikaatiot ovat nyt päällä.')
            }
        },
        onError: (err: unknown) => {
            // narrow the type
            if (err instanceof TRPCClientError) {
                toast.error('Virhe ottaessa notifikaaatioita käyttöön. Yritä myöhemmin uudelleen.');
            }
        },
    });
}

export default useAddPushSubscription
