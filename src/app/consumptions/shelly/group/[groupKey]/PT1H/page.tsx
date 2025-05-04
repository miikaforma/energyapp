
import ShellyConsumptionPage from "@energyapp/app/_components/Pages/shelly-consumption-page";
import { ShellyViewType, TimePeriod } from "@energyapp/shared/enums";

export default function Page() {
    return <ShellyConsumptionPage timePeriod={TimePeriod.PT1H} viewType={ShellyViewType.GROUP} />
}
