import { redirect } from 'next/navigation'
import { api } from "@energyapp/trpc/server";

export default async function Consumptions() {
    const userAccesses = await api.access.getUserAccesses.query();

    const hasWattivahtiConsumption = userAccesses.some((access: { type: string }) => access.type === "WATTIVAHTI_CONSUMPTION");
    if (hasWattivahtiConsumption) {
        redirect(`/consumptions/wattivahti`)
    }
    const hasMelcloud = userAccesses.some((access: { type: string }) => access.type === "MELCLOUD");
    if (hasMelcloud) {
        redirect(`/consumptions/melcloud`)
    }
    redirect(`/notfound`)
}