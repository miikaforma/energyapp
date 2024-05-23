import SolarmanProductionPage from "@energyapp/app/_components/Pages/solarman-production-page";
import { TimePeriod } from "@energyapp/shared/enums";

export default function Page() {
    return <SolarmanProductionPage timePeriod={TimePeriod.P1D} />
}