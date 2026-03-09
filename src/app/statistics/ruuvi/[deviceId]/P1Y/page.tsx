import RuuviDetailsPage from "@energyapp/app/_components/Pages/ruuvi-details-page";
import { TimePeriod } from "@energyapp/shared/enums";

export default function Page() {
    return <RuuviDetailsPage timePeriod={TimePeriod.P1Y} />
}
