import { redirect } from 'next/navigation'
import {TimePeriod} from "@energyapp/shared/enums";

export default async function HomeWizard() {
    redirect(`/homewizard/${TimePeriod.PT15M}`)
}
