import { redirect } from 'next/navigation'

export default async function Statistics() {
    redirect(`/statistics/cbase`)
    // redirect(`/_not-found`)
}