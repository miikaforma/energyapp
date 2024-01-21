import { Tag } from "antd";
import { addMargin, addTax, addTransfer, addVAT, getTransfer } from "@energyapp/utils/calculationHelpers";
import { Dayjs } from "dayjs";
import { ISettings, ISpotPrice } from "@energyapp/shared/interfaces";

export function ElectricityPrice(spotPrice: ISpotPrice,
    settings: ISettings) {

    const time = spotPrice.time! as Dayjs;

    const parsedPrice = addTransfer(addTax(addMargin(spotPrice.price_with_tax, settings.margin), settings.addElectricityTax), getTransfer(time, settings))

    const color = parsedPrice < 15 ? 'green' : parsedPrice < 20 ? 'yellow' : parsedPrice < 30 ? 'orange' : 'red';

    return (
        <Tag color={color} key={parsedPrice}>
            {parsedPrice.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} c/kWh
        </Tag>
    );
}
