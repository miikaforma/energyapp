import { Tag } from "antd";
import { TimePeriod } from "@energyapp/shared/enums";
import dayjs from "dayjs";
import { convertMilliwatts, convertWatts } from "@energyapp/utils/powerHelpers";
import { Divider, Stack } from "@mui/material";
import { styled } from '@mui/material/styles';

const Root = styled('div')(({ theme }) => ({
    width: '100%',
    ...theme.typography.caption,
    color: (theme.vars || theme).palette.text.disabled,

}));

export function ProductionConsumptionDiffColumn({ production, consumption, time, timePeriod }: { production: number, consumption: number, time: dayjs.Dayjs, timePeriod: TimePeriod }) {
    let color = 'default';
    let consumptionColor = 'default';

    const produced = production / 1000;
    const difference = (production * 1000) - consumption;

    if (production > 0) {
        switch (timePeriod) {
            case TimePeriod.PT15M:
                color = produced < 0.25 ? 'yellow' : produced < 0.5 ? 'gold' : produced < 1 ? 'orange' : 'volcano';
                break;
            case TimePeriod.PT1H:
                color = produced < 1 ? 'yellow' : produced < 2 ? 'gold' : produced < 4 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1D:
                color = produced < 10 ? 'yellow' : produced < 20 ? 'gold' : produced < 30 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1M:
                color = produced < 300 ? 'yellow' : produced < 600 ? 'gold' : produced < 1200 ? 'orange' : 'volcano';
                break;
            case TimePeriod.P1Y:
                color = produced < 4000 ? 'yellow' : produced < 8000 ? 'gold' : produced < 16000 ? 'orange' : 'volcano';
                break;
        }
    }

    const consumptionInWatts = consumption / 1000;

    if (consumptionInWatts > 0) {
        switch (timePeriod) {
            case TimePeriod.PT15M:
                consumptionColor = consumptionInWatts < 0.25 ? 'midnightblue' : consumptionInWatts < 0.5 ? 'blue' : consumptionInWatts < 1 ? 'darkblue' : 'navy';
                break;
            case TimePeriod.PT1H:
                consumptionColor = consumptionInWatts < 1 ? 'midnightblue' : consumptionInWatts < 2 ? 'blue' : consumptionInWatts < 4 ? 'darkblue' : 'navy';
                break;
            case TimePeriod.P1D:
                consumptionColor = consumptionInWatts < 10 ? 'midnightblue' : consumptionInWatts < 20 ? 'blue' : consumptionInWatts < 30 ? 'darkblue' : 'navy';
                break;
            case TimePeriod.P1M:
                consumptionColor = consumptionInWatts < 300 ? 'midnightblue' : consumptionInWatts < 600 ? 'blue' : consumptionInWatts < 1200 ? 'darkblue' : 'navy';
                break;
            case TimePeriod.P1Y:
                consumptionColor = consumptionInWatts < 4000 ? 'midnightblue' : consumptionInWatts < 8000 ? 'blue' : consumptionInWatts < 16000 ? 'darkblue' : 'navy';
                break;
        }
    }

    return <Root>
        <Divider>
            Kulutus
        </Divider>
        <Tag color={consumptionColor} style={{ width: '100%', textAlign: 'center' }} key={`${time.toISOString()}-consumption`}>
            {convertMilliwatts(consumption)}
        </Tag>
        <Divider>
            Tuotanto
        </Divider>
        <Tag color={color} style={{ width: '100%', textAlign: 'center' }} key={`${time.toISOString()}-production`}>
            {convertWatts(production)}
        </Tag>
        <Divider>
            Erotus
        </Divider>
        <Tag color={difference >= 0 ? 'green' : 'red'} style={{ width: '100%', textAlign: 'center' }} key={`${time.toISOString()}-difference`}>
            {difference >= 0 ? '+' : ''}{convertMilliwatts(difference)}
        </Tag>
    </Root>

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: '0.875rem', color: 'gray' }}>Tuotanto ja erotus</p>
            <Tag color={color} key={time.toISOString()}>
                {convertWatts(production)}
            </Tag>
            <Tag color={difference >= 0 ? 'green' : 'red'} key={time.add(1, 'second').toISOString()}>
                {difference >= 0 ? '+' : ''}{convertMilliwatts(difference)}
            </Tag>
        </div>
    );
}
