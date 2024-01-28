import { Tooltip, Tag } from "antd";
import { type IWattiVahtiConsumption } from "@energyapp/shared/interfaces";
import { TimePeriod } from "@energyapp/shared/enums";

export function WattiVahtiConsumptionPrice({ consumption, timePeriod }: { consumption: IWattiVahtiConsumption, timePeriod: TimePeriod }) {
    const price = consumption.price / 100;

    let color = '';
    switch (timePeriod) {
        case TimePeriod.Hour:
            color = price < 1 ? 'green' : price < 2 ? 'orange' : 'red';
            break;
        case TimePeriod.Day:
            color = price < 5 ? 'green' : price < 10 ? 'orange' : 'red';
            break;
        case TimePeriod.Month:
            color = price < 80 ? 'green' : price < 150 ? 'orange' : 'red';
            break;
        case TimePeriod.Year:
            color = price < 1000 ? 'green' : price < 2000 ? 'orange' : 'red';
            break;
    }

    const energyPriceStr = consumption.energy_fee < 100
        ? `Energia: ${consumption.energy_fee.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} snt`
        : `Energia: ${(consumption.energy_fee / 100).toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

    return (
        <Tooltip placement={'left'} title={energyPriceStr} trigger={'click'}>
            <Tag color={color} key={price}>
                {price.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </Tag>
        </Tooltip>
    );
}
