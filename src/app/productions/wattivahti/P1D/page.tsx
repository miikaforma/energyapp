import WattivahtiProductionPage from "@energyapp/app/_components/Pages/wattivahti-production-page";
import { TimePeriod } from "@energyapp/shared/enums";

export default function Page() {
    return <WattivahtiProductionPage timePeriod={TimePeriod.P1D} />
}