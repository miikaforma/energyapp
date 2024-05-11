import { Col, Descriptions, Row, Space, Tooltip, Tag } from "antd";
import { InfoCircleFilled } from "@ant-design/icons";
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import BoltIcon from '@mui/icons-material/Bolt';
import { type IWattiVahtiProduction } from "@energyapp/shared/interfaces";
import { formatNumberToEuros, formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
import { TimePeriod } from "@energyapp/shared/enums";
import dayjs from "dayjs";
import ProductionDescriptionSkeleton from "@energyapp/app/_components/Skeletons/production-description-skeleton";

export default function WattiVahtiProductionSummary({ timePeriod, summary, isLoading }: { timePeriod: TimePeriod, summary?: IWattiVahtiProduction | null, isLoading: boolean }) {
    if (isLoading || !summary) {
        return <ProductionDescriptionSkeleton isPulsing={isLoading} />
    }

    const getEnergy = () => {
        return (
            <Descriptions.Item key='energy' label={<Tooltip placement="bottom" title='Veroton spot-tuntihinta * tuotto' trigger={'click'}><span>Energia</span> <InfoCircleFilled /></Tooltip>} style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
                <Row align="middle">
                    <Col span={8}>{`${formatNumberToFI(summary?.energy_production)} kWh`}</Col>
                    <Col span={8}>{<Tooltip title={`Spot-keskihinta tuotannossa`} trigger={'click'}>{`${formatNumberToFI(summary?.spot_price)} c/kWh`}</Tooltip>}</Col>
                    <Col span={8}>{<Tooltip title={`${formatNumberToFI(summary?.energy_fee_spot_no_margin)} snt`} trigger={'click'}>{`${formatNumberToEuros(summary?.energy_fee_spot_no_margin)} €`}</Tooltip>}</Col>
                </Row>
            </Descriptions.Item>
        )
    }

    // const getTransferTax = () => {
    //     if (!summary.transfer_tax_fee_avg || !summary.transfer_tax_fee_day || !summary.transfer_tax_fee_night || !summary.transfer_tax_fee) {
    //         return null;
    //     }

    //     return (
    //         <Descriptions.Item key='tax' label={'Sähkövero'} style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
    //             <Row align="middle">
    //                 <Col span={8}>{`${formatNumberToFI(summary?.energy_production)} kWh`}</Col>
    //                 <Col span={8}>{`${formatNumberToFI(summary?.transfer_tax_fee_avg, 5, 5)} c/kWh`}</Col>
    //                 <Col span={8}>{<Tooltip placement="left" title={<>Sähkövero, Päivä: <strong>{formatNumberToEuros(summary?.transfer_tax_fee_day)} €</strong><br />Sähkövero, Yö: <strong>{formatNumberToEuros(summary?.transfer_tax_fee_night)} €</strong></>} trigger={'click'}>{`${formatNumberToEuros(summary?.transfer_tax_fee)} €`}</Tooltip>}</Col>
    //             </Row>
    //         </Descriptions.Item>
    //     )
    // }

    const getTransferDay = () => {
        if (!summary.energy_production_day) {
            return null;
        }

        const transfer = summary?.transfer_fee_day > 100
            ? `${formatNumberToEuros(summary?.transfer_fee_day)} €`
            : `${formatNumberToFI(summary?.transfer_fee_day)} snt`

        return (
            <Descriptions.Item key='transferDay' label={'Siirtomaksu, Päivä'} style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
                <Row align="middle">
                    <Col span={8}>{`${formatNumberToFI(summary?.energy_production_day)} kWh`}</Col>
                    <Col span={8}>{`${formatNumberToFI((summary?.transfer_fee_day ?? 0) / (summary?.energy_production_day ?? 0))} c/kWh`}</Col>
                    <Col span={8}>{<Tooltip title={`Kaikki, Päivä: ${formatNumberToEuros(summary?.price_day)} €`} trigger={'click'}>{transfer}</Tooltip>}</Col>
                </Row>
            </Descriptions.Item>
        )
    }

    const getTransferNight = () => {
        if (!summary.energy_production_night) {
            return null;
        }

        const transfer = summary?.transfer_fee_night > 100
            ? `${formatNumberToEuros(summary?.transfer_fee_night)} €`
            : `${formatNumberToFI(summary?.transfer_fee_night)} snt`

        return (
            <Descriptions.Item key='transferNight' label={'Siirtomaksu, Yö'} style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
                <Row align="middle">
                    <Col span={8}>{`${formatNumberToFI(summary?.energy_production_night)} kWh`}</Col>
                    <Col span={8}>{`${formatNumberToFI((summary?.transfer_fee_night ?? 0) / (summary?.energy_production_night ?? 0))} c/kWh`}</Col>
                    <Col span={8}>{<Tooltip title={`Kaikki, Yö: ${formatNumberToEuros(summary?.price_night)} €`} trigger={'click'}>{transfer}</Tooltip>}</Col>
                </Row>
            </Descriptions.Item>
        )
    }

    const ensureValue = (value?: number | null) => {
        return value ?? 0;
    }

    const getBasicFeesAndBill = () => {
        const price = summary?.price ?? 0;
        let color = '';

        let transferBasicFee = 0;
        let energyBasicFee = 0;
        let total = price;
        let quickPrice = price;
        switch (timePeriod) {
            case TimePeriod.PT15M:
            case TimePeriod.PT1H:
                const daysInMonth = dayjs(summary.time).daysInMonth();
                transferBasicFee = ensureValue(summary.transfer_basic_fee) / daysInMonth;
                energyBasicFee = ensureValue(summary.energy_basic_fee) / daysInMonth;
                total = price / 100 - transferBasicFee - energyBasicFee;
                quickPrice = price / 100;
                color = price <= 1000.0 ? 'green' : price <= 2000.0 ? 'orange' : 'red';
                break;
            case TimePeriod.P1D:
                transferBasicFee = ensureValue(summary.transfer_basic_fee);
                energyBasicFee = ensureValue(summary.energy_basic_fee);
                total = price / 100 - transferBasicFee - energyBasicFee;
                quickPrice = price / 100;
                color = price <= 5000.0 ? 'green' : price <= 10000.0 ? 'orange' : 'red';
                break;
            case TimePeriod.P1M:
                // Assuming summary.time is a string in ISO 8601 format (e.g., "2022-01-01T00:00:00Z")
                const startOfYear = dayjs(summary.time).startOf('year');

                // Get the current date
                const currentDate = dayjs();

                // Calculate the number of months so far this year
                let monthsSoFar = currentDate.diff(startOfYear, 'month') + 1;

                // Only show up to 12 months
                if (monthsSoFar > 12) {
                    monthsSoFar = 12;
                }

                // This should never happen but in case it does, set monthsSoFar to 0
                if (monthsSoFar < 0) {
                    monthsSoFar = 0;
                }

                transferBasicFee = ensureValue(summary.transfer_basic_fee) * monthsSoFar;
                energyBasicFee = ensureValue(summary.energy_basic_fee) * monthsSoFar;
                total = price / 100 - transferBasicFee - energyBasicFee;
                quickPrice = price / 100;
                color = price <= 130000.0 ? 'green' : price <= 150000.0 ? 'orange' : 'red';
                break;
            case TimePeriod.P1Y:
                break;
        }

        return (
            <Descriptions.Item key='basic' label={'Perusmaksut ja tuoton arvo'} style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
                <Row align="middle">
                    <Col span={8}><Tooltip title={`Siirron perusmaksu ${formatNumberToFI(ensureValue(summary?.transfer_basic_fee))} €/kk`} trigger={'click'}><Space align="center"><ElectricalServicesIcon />{formatNumberToFI(transferBasicFee)} €</Space></Tooltip></Col>
                    <Col span={8}><Tooltip title={`Energian perusmaksu ${formatNumberToFI(ensureValue(summary?.energy_basic_fee))} €/kk`} trigger={'click'}><Space align="center"><BoltIcon />{formatNumberToFI(energyBasicFee)} €</Space></Tooltip></Col>
                    <Col span={8}>
                        <Tooltip title={`Arvo ilman perusmaksuja: ${formatNumberToFI(quickPrice)} €`} trigger={'click'}>
                            <Space align="center">
                                <Tag color={color} key='total' style={{ display: 'flex', alignItems: 'center', paddingTop: '4px', paddingBottom: '4px', marginRight: 0 }}>
                                    <RequestQuoteIcon />{formatNumberToFI(total)} €
                                </Tag>
                            </Space>
                        </Tooltip>
                    </Col>
                </Row>
            </Descriptions.Item>
        )
    }

    return (
        <Descriptions size={'small'} title="" layout="vertical" bordered>
            {getEnergy()}
            {/* {getTransferTax()} */}
            {getTransferDay()}
            {getTransferNight()}
            {getBasicFeesAndBill()}
        </Descriptions>
    );
}
