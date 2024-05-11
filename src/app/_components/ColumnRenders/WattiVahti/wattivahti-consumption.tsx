import { Tag } from "antd";
import { type IWattiVahtiConsumption } from "@energyapp/shared/interfaces";
import { TimePeriod } from "@energyapp/shared/enums";

export function WattiVahtiConsumption({ consumption, timePeriod }: { consumption: IWattiVahtiConsumption, timePeriod: TimePeriod }) {
    let color = '';
    switch (timePeriod) {
        case TimePeriod.PT15M:
            color = consumption.energy_consumption < 0.5 ? 'green' : consumption.energy_consumption < 1.25 ? 'orange' : 'red';
            break;
        case TimePeriod.Hour:
            color = consumption.energy_consumption < 2 ? 'green' : consumption.energy_consumption < 5 ? 'orange' : 'red';
            break;
        case TimePeriod.Day:
            color = consumption.energy_consumption < 40 ? 'green' : consumption.energy_consumption < 50 ? 'orange' : 'red';
            break;
        case TimePeriod.Month:
            color = consumption.energy_consumption < 500 ? 'green' : consumption.energy_consumption < 1000 ? 'orange' : 'red';
            break;
        case TimePeriod.Year:
            color = consumption.energy_consumption < 7200 ? 'green' : consumption.energy_consumption < 18000 ? 'orange' : 'red';
            break;
    }

    return (
        <Tag color={color} key={consumption.energy_consumption}>
            {consumption.energy_consumption.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh
        </Tag>
    );
}
