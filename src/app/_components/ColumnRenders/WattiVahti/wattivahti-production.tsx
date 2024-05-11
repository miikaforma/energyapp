import { Tag } from "antd";
import { type IWattiVahtiProduction } from "@energyapp/shared/interfaces";
import { TimePeriod } from "@energyapp/shared/enums";

export function WattiVahtiProduction({ production, timePeriod }: { production: IWattiVahtiProduction, timePeriod: TimePeriod }) {
    let color = 'none';

    if (production.energy_production > 0) {
        switch (timePeriod) {
            case TimePeriod.PT15M:
                color = production.energy_production < 0.25 ? 'yellow' : production.energy_production < 0.5 ? 'gold' : production.energy_production < 1 ? 'orange' : 'volcano';
                break;
            case TimePeriod.PT1H:
                color = production.energy_production < 1 ? 'yellow' : production.energy_production < 2 ? 'gold' : production.energy_production < 4 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1D:
                color = production.energy_production < 10 ? 'yellow' : production.energy_production < 20 ? 'gold' : production.energy_production < 30 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1M:
                color = production.energy_production < 300 ? 'yellow' : production.energy_production < 600 ? 'gold' : production.energy_production < 1200 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1Y:
                color = production.energy_production < 4000 ? 'yellow' : production.energy_production < 8000 ? 'gold' : production.energy_production < 16000 ? 'orange' : 'volcano';
                break;
        }
    }

    return (
        <Tag color={color} key={production.energy_production}>
            {production.energy_production.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh
        </Tag>
    );
}
