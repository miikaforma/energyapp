import { redirect } from 'next/navigation'
import {TimePeriod} from "@energyapp/shared/enums";

export default async function SpotPrices() {
    redirect(`/spotPrices/${TimePeriod.PT1H}`)
}
