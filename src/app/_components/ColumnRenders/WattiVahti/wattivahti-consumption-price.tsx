import { Tooltip, Tag } from "antd";
import { type IWattiVahtiConsumption } from "@energyapp/shared/interfaces";
import { TimePeriod } from "@energyapp/shared/enums";

export function WattiVahtiConsumptionPrice({ consumption, timePeriod }: { consumption: IWattiVahtiConsumption, timePeriod: TimePeriod }) {
    const price = consumption.price / 100;

    let color = '';
    switch (timePeriod) {
        case TimePeriod.PT15M:
            color = price < 0.25 ? 'green' : price < 0.5 ? 'orange' : 'red';
            break;
        case TimePeriod.PT1H:
            color = price < 1 ? 'green' : price < 2 ? 'orange' : 'red';
            break;
        case TimePeriod.P1D:
            color = price < 5 ? 'green' : price < 10 ? 'orange' : 'red';
            break;
        case TimePeriod.P1M:
            color = price < 80 ? 'green' : price < 150 ? 'orange' : 'red';
            break;
        case TimePeriod.P1Y:
            color = price < 1000 ? 'green' : price < 2000 ? 'orange' : 'red';
            break;
    }

    const energyPriceStr = (timePeriod === TimePeriod.PT15M || timePeriod === TimePeriod.PT1H) && consumption.energy_fee < 1
        ? `Energia: ${consumption.energy_fee.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} snt`
        : `Energia: ${(consumption.energy_fee / 100).toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

    const priceStr = (timePeriod === TimePeriod.PT15M || timePeriod === TimePeriod.PT1H) && price < 1
        ? `${(price * 100).toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} snt`
        : `${price.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

    return (
        <Tooltip placement={'left'} title={energyPriceStr} trigger={'click'}>
            <Tag color={color} key={price}>
                {priceStr}
            </Tag>
        </Tooltip>
    );
}
