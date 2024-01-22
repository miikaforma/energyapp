import { Descriptions } from "antd";
import { type ISettings, type ISpotPriceResponse } from "@energyapp/shared/interfaces";
import { ElectricitySpotPrice } from "../ColumnRenders/SpotPrice/electricity-spot-price";
import { dateToShortSpotTimeString } from "@energyapp/utils/timeHelpers";
import useMediaQuery from "@mui/material/useMediaQuery";

export default function SpotPriceSummary({ spotResponse, settings }: { spotResponse?: ISpotPriceResponse, settings: ISettings }) {
    const isSx = useMediaQuery('(max-width:575px)');

    if (!spotResponse) {
        return null
    }

    const summary = spotResponse.summary
    const timePeriod = spotResponse.timePeriod

    const getCheapest = () => {
        return (
            <Descriptions.Item
                key={'cheapest'}
                label={`Halvin ${dateToShortSpotTimeString(summary.cheapest.time, timePeriod)}`}
                style={{ padding: 8 }}
            >
                {ElectricitySpotPrice({ spotPrice: summary.cheapest, tagStyles: { fontSize: isSx ? 14 : 15, padding: 4, width: '100px', textAlign: 'center' } })}
            </Descriptions.Item>
        )
    }

    const getMostExpensive = () => {
        return (
            <Descriptions.Item key={'mostExpensive'} label={`Kallein ${dateToShortSpotTimeString(summary.mostExpensive.time, timePeriod)}`} style={{ padding: 8 }}>
                {ElectricitySpotPrice({ spotPrice: summary.mostExpensive, tagStyles: { fontSize: isSx ? 14 : 15, padding: 4, width: '100px', textAlign: 'center' } })}
            </Descriptions.Item>
        )
    }

    const getAverage = () => {
        return (
            <Descriptions.Item key={'average'} label={'Keskiarvo'} style={{ padding: 8 }}>
                {ElectricitySpotPrice({ spotPrice: summary.average, tagStyles: { fontSize: isSx ? 14 : 15, padding: 4, width: '100px', textAlign: 'center' } })}
            </Descriptions.Item>
        )
    }

    return (
        <Descriptions
            size={'small'}
            title=""
            layout={isSx ? 'horizontal' : 'vertical'}
            labelStyle={{ color: 'white' }}
            bordered
        >
            {getMostExpensive()}
            {getCheapest()}
            {getAverage()}
        </Descriptions>
    );
}
