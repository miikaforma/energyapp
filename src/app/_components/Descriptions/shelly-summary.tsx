import { Descriptions } from "antd";
import { type ShellyConsumptionResponse } from "@energyapp/shared/interfaces";
import { dateToShortSpotTimeString } from "@energyapp/utils/timeHelpers";
import useMediaQuery from "@mui/material/useMediaQuery";
import { convertMilliwatts } from "@energyapp/utils/powerHelpers";

export default function ShellySummary({ response }: { response?: ShellyConsumptionResponse }) {
    const isSx = useMediaQuery('(max-width:575px)');

    if (!response) {
        return null
    }

    const summary = response.summary
    const timePeriod = response.timePeriod

    if (!summary) {
        return null
    }

    const getHighestConsumption = () => {
        if (!summary.highest) {
            return null
        }
        if (!summary.highest.consumption) {
            return null
        }

        return (
            <Descriptions.Item key={'highestConsumption'} label={`Suurin kulutus ${dateToShortSpotTimeString(summary.highest.time, timePeriod)}`} style={{ padding: 8 }}>
                {convertMilliwatts(summary.highest.consumption)}
            </Descriptions.Item>
        )
    }

    const getTotal = () => {
        return (
            <Descriptions.Item key={'total'} label={'Kulutus yhteensä'} style={{ padding: 8 }}>
                {convertMilliwatts(summary.total)}
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
            {getHighestConsumption()}
            {getTotal()}
        </Descriptions>
    );
}
