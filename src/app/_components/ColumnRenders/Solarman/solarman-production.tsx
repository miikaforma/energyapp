import { Tag } from "antd";
import { type SolarmanProduction } from "@energyapp/shared/interfaces";
import { TimePeriod } from "@energyapp/shared/enums";
import { formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
import dayjs from "dayjs";

export function SolarmanProductionColumn({ production, timePeriod }: { production: SolarmanProduction, timePeriod: TimePeriod }) {
    let color = 'none';

    const produced = production.production / 1000;

    if (production.production > 0) {
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
        <Tag color={color} key={dayjs(production.time).toISOString()}>
            {formatNumberToFI(produced)} kWh
        </Tag>
    );
}
