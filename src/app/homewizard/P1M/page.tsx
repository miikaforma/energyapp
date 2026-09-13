import HomeWizardPage from "@energyapp/app/_components/Pages/homewizard-page";
import { TimePeriod } from "@energyapp/shared/enums";

export default function Page() {
    return <HomeWizardPage timePeriod={TimePeriod.P1M} />
}
