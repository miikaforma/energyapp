
import ShellyConsumptionPage from "@energyapp/app/_components/Pages/shelly-consumption-page";
import { ShellyViewType, TimePeriod } from "@energyapp/shared/enums";

export default function Page() {
    return <ShellyConsumptionPage timePeriod={TimePeriod.P1Y} viewType={ShellyViewType.DEVICE} />
}
