import { Descriptions, Tag } from "antd";
import { type SolarmanLatestProduction } from "@energyapp/shared/interfaces";
import { formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
import { useMediaQuery } from "@mui/material";
import RelativeTime from "@energyapp/app/_components/Helpers/relative-time";
import dayjs, { type Dayjs } from "dayjs";
import { kwhOrWattsString } from "@energyapp/utils/powerHelpers";

export default function SolarmanLatestProductionSummary({ summary }: { summary?: SolarmanLatestProduction | null }) {
    const isSx = useMediaQuery('(max-width:575px)');

    if (!summary) {
        return null
    }

    const getTimeStamp = (time: string | number | Date | Dayjs) => {
        if (!time) {
            return <span style={{ fontStyle: 'italic', color: "gray", whiteSpace: 'nowrap' }}>ei tiedossa</span>
        }

        return <span style={{ fontStyle: 'italic', color: "gray", whiteSpace: 'nowrap' }}>{dayjs(time).format("DD.MM.YYYY HH:mm")}</span>
    }

    const getRelativeTimeStamp = (time: string | number | Date | Dayjs) => {
        if (!time) {
            return <span style={{ fontStyle: 'italic', color: "gray", whiteSpace: 'nowrap' }}>ei tiedossa</span>
        }

        return <span style={{ fontStyle: 'italic', color: "gray", whiteSpace: 'nowrap' }}><RelativeTime timestamp={time}></RelativeTime></span>
    }

    const getLatestProduction = () => {
        const production = summary.output_power_active / 1000;
        const color = production < 1 ? 'yellow' : production < 2 ? 'gold' : production < 4 ? 'orange' : 'volcano';

        return (
            <Descriptions.Item key={'latestProduction'} label={<span>Tuotto: {getRelativeTimeStamp(summary.time)}</span>} style={{ padding: 8 }}>
                <Tag color={color} key='latestProduction' style={{ fontSize: isSx ? 14 : 15, padding: 4, width: '100%', textAlign: 'center' }}>
                    {kwhOrWattsString(summary.output_power_active)}
                </Tag>
            </Descriptions.Item>
        )
    }

    const getTodayProduction = () => {
        const production = summary.solar_production_today / 1000;
        const color = production < 10 ? 'yellow' : production < 20 ? 'gold' : production < 30 ? 'orange' : 'volcano';

        return (
            <Descriptions.Item key={'todayProduction'} label={<span>Tuotto tänään: {getTimeStamp(summary.time)}</span>} style={{ padding: 8 }}>
                <Tag color={color} key='todayProduction' style={{ fontSize: isSx ? 14 : 15, padding: 4, width: '100%', textAlign: 'center' }}>
                    {formatNumberToFI(production)} kWh
                </Tag>
            </Descriptions.Item>
        )
    }

    const getAllTimeProduction = () => {
        const production = summary.solar_production_total / 1000;
        return (
            <Descriptions.Item key={'allTimeProduction'} label={<span>Tuotto yhteensä</span>} style={{ padding: 8 }}>
                <Tag color='none' key='allTimeProduction' style={{ fontSize: isSx ? 14 : 15, padding: 4, width: '100%', textAlign: 'center' }}>
                    {formatNumberToFI(production)} MWh
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
            {getLatestProduction()}
            {getTodayProduction()}
            {getAllTimeProduction()}
        </Descriptions>
    );
}
