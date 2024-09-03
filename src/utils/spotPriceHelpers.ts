import { type ISettings, type ISpotPrice } from "@energyapp/shared/interfaces";
import { addMargin, addTax, addTransfer, getTransfer } from "@energyapp/utils/calculationHelpers";
import dayjs from "dayjs";

export function calculateTotalPrice({ data, settings }: { data: ISpotPrice; settings: ISettings }) {
    const spotPrice = data.price

    let price = addMargin(spotPrice, settings?.margin)
    price = addTax(data.time ?? dayjs(), price, settings?.addElectricityTax)
    if (data.time) {
        price = addTransfer(price, getTransfer(data.time, settings))
    }

    return price;
}
