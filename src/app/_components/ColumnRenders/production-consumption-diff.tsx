import { Tag } from "antd";
import { TimePeriod } from "@energyapp/shared/enums";
import dayjs from "dayjs";
import { convertMilliwatts, convertWatts } from "@energyapp/utils/powerHelpers";

export function ProductionConsumptionDiffColumn({ production, consumption, time, timePeriod }: { production: number, consumption: number, time: dayjs.Dayjs, timePeriod: TimePeriod }) {
    let color = 'default';

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
