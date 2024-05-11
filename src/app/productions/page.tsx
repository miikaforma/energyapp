import { redirect } from 'next/navigation'
import { api } from "@energyapp/trpc/server";

export default async function Productions() {
    const userAccesses = await api.access.getUserAccesses.query();

    const hasWattivahtiProduction = userAccesses.some((access: { type: string }) => access.type === "WATTIVAHTI_PRODUCTION");
    if (hasWattivahtiProduction) {
        redirect(`/productions/wattivahti`)
    }
    const hasSolarman = userAccesses.some((access: { type: string }) => access.type === "SOLARMAN");
    if (hasSolarman) {
        redirect(`/productions/solarman`)
    }
    redirect(`/_not-found`)
}