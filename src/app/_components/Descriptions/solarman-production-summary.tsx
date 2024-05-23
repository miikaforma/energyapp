import { Descriptions, Tag } from "antd";
import { type SolarmanProductionSummary } from "@energyapp/shared/interfaces";
import { formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
import { TimePeriod } from "@energyapp/shared/enums";
import { useMediaQuery } from "@mui/material";
import { dateToTableString } from "@energyapp/utils/timeHelpers";
import { type Dayjs } from "dayjs";

export default function SolarmanProductionSummary({ timePeriod, summary }: { timePeriod: TimePeriod, summary?: SolarmanProductionSummary | null }) {
    const isSx = useMediaQuery('(max-width:575px)');

    if (!summary || (!summary.total && !summary.best)) {
        return null
    }

    const getTimeString = (time: Date | Dayjs | null | undefined) => {
        if (!time) {
            return <span style={{ fontStyle: 'italic', color: "gray", whiteSpace: 'nowrap' }}>ei tiedossa</span>
        }

        return <span style={{ fontStyle: 'italic', color: "gray", whiteSpace: 'nowrap' }}>{dateToTableString(time, timePeriod)}</span>
    }

    const getBestProduction = () => {
        if (!summary.best) return null

        let color = 'none';
        const production = summary.best.production / 1000;

        switch (timePeriod) {
            case TimePeriod.PT15M:
                color = production < 0.25 ? 'yellow' : production < 0.5 ? 'gold' : production < 1 ? 'orange' : 'volcano';
                break;
            case TimePeriod.PT1H:
                color = production < 1 ? 'yellow' : production < 2 ? 'gold' : production < 4 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1D:
                color = production < 10 ? 'yellow' : production < 20 ? 'gold' : production < 30 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1M:
                color = production < 300 ? 'yellow' : production < 600 ? 'gold' : production < 1200 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1Y:
                color = production < 4000 ? 'yellow' : production < 8000 ? 'gold' : production < 16000 ? 'orange' : 'volcano';
                break;
        }

        return (
            <Descriptions.Item key={'bestProduction'} label={<span>Paras tuotto: {getTimeString(summary.best.time)}</span>} style={{ padding: 8 }}>
                <Tag color={color} key='bestProduction' style={{ fontSize: isSx ? 14 : 15, padding: 4, width: '100%', textAlign: 'center' }}>
                    {formatNumberToFI(summary.best.production / 1000)} kWh
                </Tag>
            </Descriptions.Item>
        )
    }

    const getProduction = () => {
        if (!summary.total) return null

        let color = 'none';
        const production = summary.total.production / 1000;

        switch (timePeriod) {
            case TimePeriod.PT15M:
                color = production < 10 ? 'yellow' : production < 20 ? 'gold' : production < 30 ? 'orange' : 'volcano';
                break;
            case TimePeriod.PT1H:
                color = production < 10 ? 'yellow' : production < 20 ? 'gold' : production < 30 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1D:
                color = production < 300 ? 'yellow' : production < 600 ? 'gold' : production < 1200 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1M:
                color = production < 4000 ? 'yellow' : production < 8000 ? 'gold' : production < 16000 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1Y:
                color = production < 4000 ? 'yellow' : production < 8000 ? 'gold' : production < 16000 ? 'orange' : 'volcano';
                break;
        }

        return (
            <Descriptions.Item key={'production'} label={'Tuotto yhteensä'} style={{ padding: 8 }}>
                <Tag color={color} key='production' style={{ fontSize: isSx ? 14 : 15, padding: 4, width: '100%', textAlign: 'center' }}>
                    {formatNumberToFI(summary.total.production / 1000)} kWh
                </Tag>
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
            {getBestProduction()}
            {getProduction()}
        </Descriptions>
    );
}
