import { type ISpotPrice } from "@energyapp/shared/interfaces";
import { Tag, Tooltip } from "antd";
import { type CSSProperties } from "react";

interface ElectricitySpotPriceProps {
    spotPrice: ISpotPrice
    tooltipStyles?: CSSProperties
    tagStyles?: CSSProperties
}

export function ElectricitySpotPrice({ spotPrice, tooltipStyles, tagStyles }: ElectricitySpotPriceProps) {
    const color = spotPrice.price_with_tax < 10 ? 'green' : spotPrice.price_with_tax < 15 ? 'yellow' : spotPrice.price_with_tax < 20 ? 'orange' : 'red';

    return (
        <Tooltip
            placement={'left'}
            title={
                `${spotPrice.price.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0'} c/kWh`
            } trigger={'click'}
            style={tooltipStyles}
        >
            <Tag
                color={color}
                key={spotPrice.price_with_tax}
                style={tagStyles}
            >
                {spotPrice.price_with_tax.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} c/kWh
            </Tag>
        </Tooltip>
    );
}
