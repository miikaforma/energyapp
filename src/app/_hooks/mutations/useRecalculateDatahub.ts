import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useRecalculateDatahub = () => {
    const utils = api.useUtils();

    return api.fingrid.recalculateWithContract.useMutation({
        onSuccess: (data) => {
            void utils.wattivahti.getConsumptions.invalidate().then(_ => {
                toast.success('Kulutukset päivitetty onnistuneesti.');
            });
            void utils.wattivahti.getProductions.invalidate()
        },
        onError: (err: unknown) => {
            // narrow the type
            if (err instanceof TRPCClientError) {
                toast.error('Virhe päivittäessä kulutuksia. Yritä myöhemmin uudelleen.');
            }
        },
    });
}

export default useRecalculateDatahub
