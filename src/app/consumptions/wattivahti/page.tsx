import { redirect } from 'next/navigation'

export default async function WattiVahti() {
    redirect(`/consumptions/wattivahti/hourly`)
}