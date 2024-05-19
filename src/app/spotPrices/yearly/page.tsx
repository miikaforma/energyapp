import { redirect } from "next/navigation";
import {TimePeriod} from "@energyapp/shared/enums";

export default async function Page() {
  redirect(`/spotPrices/${TimePeriod.P1Y}`)
}
