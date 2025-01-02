import { Col, Descriptions, Row, Space, Tooltip, Tag } from "antd";
import { InfoCircleFilled } from "@ant-design/icons";
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import BoltIcon from '@mui/icons-material/Bolt';
import { type IWattiVahtiConsumption } from "@energyapp/shared/interfaces";
import { formatNumberToEuros, formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
import { TimePeriod } from "@energyapp/shared/enums";
import dayjs from "dayjs";
import ConsumptionDescriptionSkeleton from "@energyapp/app/_components/Skeletons/consumption-description-skeleton";
import { useSettingsStore } from "@energyapp/app/_stores/settings/settings";

export default function WattiVahtiConsumptionSummary({ timePeriod, summary, isLoading, hasHybridConsumption }: { timePeriod: TimePeriod, summary?: IWattiVahtiConsumption | null, isLoading: boolean, hasHybridConsumption?: boolean }) {
    const settingsStore = useSettingsStore();
    const settings = settingsStore.settings;
    
    if (isLoading || !summary) {
        return <ConsumptionDescriptionSkeleton isPulsing={isLoading} />
    }

    const getEnergy = () => {
        return (
            <Descriptions.Item key='energy' label={<Tooltip placement="bottom" title={<><span><strong>Kiinteä:</strong><br />Energia</span><br /><br /><span><strong>Spottisähkö:</strong><br />Spot-tuntihinta + Marginaali</span></>} trigger={'click'}><span>Energia</span> <InfoCircleFilled /></Tooltip>} style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
                <Row align="middle">
                    <Col span={8}>{`${formatNumberToFI(summary?.energy_consumption)} kWh`}</Col>
                    <Col span={8}><Tooltip title={<>Keskihinta (kaikki): <strong>{formatNumberToFI(summary?.price_avg)} c/kWh</strong></>} trigger={'click'}>{`${formatNumberToFI(summary?.energy_fee_avg)} c/kWh`}</Tooltip></Col>
                    <Col span={8}>{<Tooltip placement="left" title={<>Energia, Päivä: <strong>{formatNumberToEuros(summary?.energy_fee_day)} €</strong><br />Energia, Yö: <strong>{formatNumberToEuros(summary?.energy_fee_night)} €</strong></>} trigger={'click'}>{`${formatNumberToEuros(summary?.energy_fee)} €`}</Tooltip>}</Col>
                </Row>
            </Descriptions.Item>
        )
    }

    const getTransferTax = () => {
        return (
            <Descriptions.Item key='tax' label={'Sähkövero'} style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
                <Row align="middle">
                    <Col span={8}>{`${formatNumberToFI(summary?.energy_consumption)} kWh`}</Col>
                    <Col span={8}>{`${formatNumberToFI(summary?.transfer_tax_fee_avg, 5, 5)} c/kWh`}</Col>
                    <Col span={8}>{<Tooltip placement="left" title={<>Sähkövero, Päivä: <strong>{formatNumberToEuros(summary?.transfer_tax_fee_day)} €</strong><br />Sähkövero, Yö: <strong>{formatNumberToEuros(summary?.transfer_tax_fee_night)} €</strong></>} trigger={'click'}>{`${formatNumberToEuros(summary?.transfer_tax_fee)} €`}</Tooltip>}</Col>
                </Row>
            </Descriptions.Item>
        )
    }

    const getTransferDay = () => {
        return (
            <Descriptions.Item key='transferDay' label={'Siirtomaksu, Päivä'} style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
                <Row align="middle">
                    <Col span={8}>{`${formatNumberToFI(summary?.energy_consumption_day)} kWh`}</Col>
                    <Col span={8}>{`${formatNumberToFI((summary?.transfer_fee_day ?? 0) / (summary?.energy_consumption_day ?? 0))} c/kWh`}</Col>
                    <Col span={8}>{<Tooltip title={`Kaikki, Päivä: ${formatNumberToEuros(summary?.price_day)} €`} trigger={'click'}>{`${formatNumberToEuros(summary?.transfer_fee_day)} €`}</Tooltip>}</Col>
                </Row>
            </Descriptions.Item>
        )
    }

    const getTransferNight = () => {
        return (
            <Descriptions.Item key='transferNight' label={'Siirtomaksu, Yö'} style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
                <Row align="middle">
                    <Col span={8}>{`${formatNumberToFI(summary?.energy_consumption_night)} kWh`}</Col>
                    <Col span={8}>{`${formatNumberToFI((summary?.transfer_fee_night ?? 0) / (summary?.energy_consumption_night ?? 0))} c/kWh`}</Col>
                    <Col span={8}>{<Tooltip title={`Kaikki, Yö: ${formatNumberToEuros(summary?.price_night)} €`} trigger={'click'}>{`${formatNumberToEuros(summary?.transfer_fee_night)} €`}</Tooltip>}</Col>
                </Row>
            </Descriptions.Item>
        )
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
                transferBasicFee = summary.transfer_basic_fee / daysInMonth;
                energyBasicFee = summary.energy_basic_fee / daysInMonth;
                total = price / 100 + transferBasicFee + energyBasicFee;
                quickPrice = price / 100;
                color = price <= 1000.0 ? 'green' : price <= 2000.0 ? 'orange' : 'red';
                break;
            case TimePeriod.P1D:
                transferBasicFee = summary.transfer_basic_fee;
                energyBasicFee = summary.energy_basic_fee;
                total = price / 100 + transferBasicFee + energyBasicFee;
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

                console.log({ monthsSoFar, currentDate, startOfYear })

                transferBasicFee = summary.transfer_basic_fee * monthsSoFar;
                energyBasicFee = summary.energy_basic_fee * monthsSoFar;
                total = price / 100 + transferBasicFee + energyBasicFee;
                quickPrice = price / 100;
                color = price <= 130000.0 ? 'green' : price <= 150000.0 ? 'orange' : 'red';
                break;
            case TimePeriod.P1Y:
                break;
        }

        return (
            <Descriptions.Item key='basic' label={'Perusmaksut ja lasku'} style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
                <Row align="middle">
                    <Col span={8}><Tooltip title={`Siirron perusmaksu ${formatNumberToFI(summary?.transfer_basic_fee)} €/kk`} trigger={'click'}><Space align="center"><ElectricalServicesIcon />{formatNumberToFI(transferBasicFee)} €</Space></Tooltip></Col>
                    <Col span={8}><Tooltip title={`Energian perusmaksu ${formatNumberToFI(summary?.energy_basic_fee)} €/kk`} trigger={'click'}><Space align="center"><BoltIcon />{formatNumberToFI(energyBasicFee)} €</Space></Tooltip></Col>
                    <Col span={8}>
                        <Tooltip title={`Lasku ilman perusmaksuja: ${formatNumberToFI(quickPrice)} €`} trigger={'click'}>
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

    const getConsumptionEffect = () => {
        const consumptionEffect = (summary?.energy_fee_spot_no_margin - summary?.energy_consumption * summary?.spot_price_with_tax) / summary?.energy_consumption
        const color = consumptionEffect > 0 ? 'red' : 'green'
        return (
            <Descriptions.Item key='consumptionsEffect' label={'Omavaikutus'} style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
                <Row align="middle">
                    <Col span={8}><Tooltip title={`A = tuntikohtaisen sähkönkulutuksen (kWh) ja tuntikohtaisten pörssisähkön hintojen (c/kWh) tulojen summa`} trigger={'click'}><Space align="center"><strong>A</strong>{formatNumberToEuros(summary?.energy_fee_spot_no_margin)} €</Space></Tooltip></Col>
                    <Col span={8}><Tooltip title={`B = Kuukauden sähkönkulutus (kWh) * pörssisähkön (painottamaton) keskiarvohinta koko kuukaudelta (c/kWh)`} trigger={'click'}><Space align="center"><strong>B</strong>{formatNumberToEuros((summary?.energy_consumption) * summary?.spot_price_with_tax)} €</Space></Tooltip></Col>
                    <Col span={8}>
                        <Tooltip title={<>Omavaikutus = (A - B) / E<br/><br/>E = Kuukauden sähkönkulutus (kWh)</>} trigger={'click'}>
                            <Space align="center">
                                <Tag color={color} key='total' style={{ display: 'flex', alignItems: 'center', paddingTop: '4px', paddingBottom: '4px', marginRight: 0 }}>
                                    {formatNumberToFI(consumptionEffect)} c/kWh
                                </Tag>
                            </Space>
                        </Tooltip>
                    </Col>
                </Row>
            </Descriptions.Item>
        )
    }

    console.log(timePeriod)

    return (
        <Descriptions size={'small'} title="" layout="vertical" bordered>
            {getEnergy()}
            {getTransferTax()}
            {getTransferDay()}
            {getTransferNight()}
            {getBasicFeesAndBill()}
            {(settings.showConsumptionEffects || hasHybridConsumption) && getConsumptionEffect()}
        </Descriptions>
    );
}
