import { ISettings, ISpotPrice } from "@energyapp/shared/interfaces";
import { addMargin, addTax, addTransfer, getTransfer } from "@energyapp/utils/calculationHelpers";

export function calculateTotalPrice({ data, settings }: { data: ISpotPrice; settings: ISettings }) {
    const spotPrice = data.price

    let price = addMargin(spotPrice, settings?.margin)
    price = addTax(price, settings?.addElectricityTax)
    if (data.time) {
        price = addTransfer(price, getTransfer(data.time, settings))
    }

    return price;
}
