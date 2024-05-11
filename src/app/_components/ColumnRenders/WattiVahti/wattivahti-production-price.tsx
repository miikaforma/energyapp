import { Tooltip, Tag } from "antd";
import { type IWattiVahtiProduction } from "@energyapp/shared/interfaces";
import { TimePeriod } from "@energyapp/shared/enums";

export function WattiVahtiProductionPrice({ production, timePeriod }: { production: IWattiVahtiProduction, timePeriod: TimePeriod }) {
    const price = production.price / 100;

    let color = 'none';
    if (price > 0) {
        switch (timePeriod) {
            case TimePeriod.PT15M:
                color = price < 0.025 ? 'yellow' : price < 0.0625 ? 'gold' : price < 0.125 ? 'orange' : 'volcano';
                break;
            case TimePeriod.PT1H:
                color = price < 0.10 ? 'yellow' : price < 0.25 ? 'gold' : price < 0.50 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1D:
                color = price < 1 ? 'yellow' : price < 2 ? 'gold' : price < 4 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1M:
                color = price < 30 ? 'yellow' : price < 60 ? 'gold' : price < 120 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1Y:
                color = price < 400 ? 'yellow' : price < 800 ? 'gold' : price < 1600 ? 'orange' : 'volcano';
                break;
        }
    }

    let spotPriceStr = 'Spot keskihinta';
    if (price > 0) {
        switch (timePeriod) {
            case TimePeriod.PT15M:
            case TimePeriod.PT1H:
                spotPriceStr = 'Spot hinta';
                break;
        }
    }

    const spotPriceFullStr = production.spot_price < 100
        ? `${spotPriceStr}: ${production.spot_price.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} snt`
        : `${spotPriceStr}: ${(production.spot_price / 100).toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

    const priceStr = price < 1
        ? `${(price * 100).toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} snt`
        : `${price.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

    return (
        <Tooltip placement={'left'} title={spotPriceFullStr} trigger={'click'}>
            <Tag color={color} key={price}>
                {priceStr}
            </Tag>
        </Tooltip>
    );
}
