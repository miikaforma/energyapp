import { redirect } from 'next/navigation'

export default async function Statistics() {
    redirect(`/statistics/fingrid`)
    // redirect(`/_not-found`)
}