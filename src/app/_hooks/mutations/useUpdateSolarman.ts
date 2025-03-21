import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useUpdateSolarman = () => {
    const utils = api.useUtils();

    return api.solarman.update.useMutation({
        onSuccess: (_data) => {
            void utils.solarman.getProductions.invalidate()
        },
        onError: (err: unknown) => {
            // narrow the type
            if (err instanceof TRPCClientError) {
                toast.error('Virhe päivittäessä solarman tuotantoja. Yritä myöhemmin uudelleen.');
            }
        },
    });
}

export default useUpdateSolarman
