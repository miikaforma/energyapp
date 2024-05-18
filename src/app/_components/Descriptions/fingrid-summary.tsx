import { Descriptions, Tag } from "antd";
import useMediaQuery from "@mui/material/useMediaQuery";
import { FingridRealTimeEvents } from "@energyapp/shared/constants";
import { type fingrid_latest_data } from "@prisma/client";

interface IFingridSummaryProps {
    latestTotals?: fingrid_latest_data[];
}

export default function FingridSummary({ latestTotals }: IFingridSummaryProps) {
    const isSx = useMediaQuery('(max-width:575px)');

    if (!latestTotals) {
        return null
    }

    const production = latestTotals.find(x => x.dataset_id === FingridRealTimeEvents.AllProduction)
    const consumption = latestTotals.find(x => x.dataset_id === FingridRealTimeEvents.AllConsumption)

    const getConsumption = () => {
        return (
            <Descriptions.Item key={'consumption'} label={'Kulutus'} style={{ padding: 8 }}>
                <Tag color={'red'} key='consumption' style={{ fontSize: isSx ? 14 : 15, padding: 4, width: '100%', textAlign: 'center' }}>
                    {(consumption?.value ?? 0).toLocaleString('fi-FI', {minimumFractionDigits: 2, maximumFractionDigits: 2})} MW
                </Tag>
            </Descriptions.Item>
        )
    }

    const getProduction = () => {
        return (
            <Descriptions.Item key={'production'} label={'Tuotanto'} style={{ padding: 8 }}>
                <Tag color={'green'} key='production' style={{ fontSize: isSx ? 14 : 15, padding: 4, width: '100%', textAlign: 'center' }}>
                    {(production?.value ?? 0).toLocaleString('fi-FI', {minimumFractionDigits: 2, maximumFractionDigits: 2})} MW
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
            {getConsumption()}
            {getProduction()}
        </Descriptions>
    );
}
