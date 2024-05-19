import SpotPricePage from "@energyapp/app/_components/Pages/spot-price-page";
import { TimePeriod } from "@energyapp/shared/enums";

export default function Page() {
    return <SpotPricePage timePeriod={TimePeriod.PT15M} />
}
