import { Tooltip, Tag } from "antd";
import { type IWattiVahtiConsumption } from "@energyapp/shared/interfaces";
import { formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";

export function WattiVahtiConsumptionEffect({ consumption }: { consumption: IWattiVahtiConsumption }) {
    const consumptionEffect = (consumption?.energy_fee_spot_no_margin - consumption?.energy_consumption * consumption?.spot_price_with_tax) / consumption?.energy_consumption
    const avgSpotPrice = consumption?.energy_fee_spot_no_margin / consumption?.energy_consumption
    const color = consumptionEffect > 0 ? 'red' : 'green'

    return (
        <Tooltip placement={'left'} title={formatNumberToFI(avgSpotPrice)} trigger={'click'}>
            <Tag color={color} key={consumptionEffect}>
                {formatNumberToFI(consumptionEffect)} c/kWh
            </Tag>
        </Tooltip>
    );
}
