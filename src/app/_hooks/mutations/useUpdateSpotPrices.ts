import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useUpdateSpotPrices = () => {
    const utils = api.useUtils();

    return api.spotPrice.update.useMutation({
        onSuccess: (data) => {
            void utils.spotPrice.get.invalidate().then(_ => {
                toast.success('Hinnat päivitetty onnistuneesti.');
            });
        },
        onError: (err: unknown) => {
            // narrow the type
            if (err instanceof TRPCClientError) {
                toast.error('Virhe päivittäessä hintoja. Yritä myöhemmin uudelleen.');
            }
        },
    });
}

export default useUpdateSpotPrices
