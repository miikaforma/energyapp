import { redirect } from 'next/navigation'

export default async function SpotPrices() {
    redirect(`/spotPrices/hourly`)
}