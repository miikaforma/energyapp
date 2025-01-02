import { redirect } from 'next/navigation'
import {TimePeriod} from "@energyapp/shared/enums";

export default async function Shelly() {
    redirect(`/consumptions/shelly/${TimePeriod.PT1H}`)
}
