import { Col, Descriptions, Row } from 'antd';

interface IConsumptionDescriptionSkeletonProps {
    isPulsing?: boolean;
}

const ConsumptionDescriptionSkeleton = ({ isPulsing = true }: IConsumptionDescriptionSkeletonProps) => {
    const getDescriptionItem = (label: string) => {
        return (
            <Descriptions.Item key={label} label={label} style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
                <Row align="middle">
                    <Col span={8} style={{ display: 'flex' }} className='justify-center'><div className={`w-1/3 h-5 ${isPulsing ? 'bg-gray-200 dark:bg-gray-700 rounded animate-pulse' : ''}`}></div></Col>
                    <Col span={8} style={{ display: 'flex' }} className='justify-center'><div className={`w-1/3 h-5 ${isPulsing ? 'bg-gray-200 dark:bg-gray-700 rounded animate-pulse' : ''}`}></div></Col>
                    <Col span={8} style={{ display: 'flex' }} className='justify-center'><div className={`w-1/3 h-5 ${isPulsing ? 'bg-gray-200 dark:bg-gray-700 rounded animate-pulse' : ''}`}></div></Col>
                </Row>
            </Descriptions.Item>
        )
    }

    return (
        <Descriptions size={'small'} title="" layout="vertical" bordered>
            {getDescriptionItem("Energia")}
            {getDescriptionItem("Sähkövero")}
            {getDescriptionItem("Siirtomaksu, Päivä")}
            {getDescriptionItem("Siirtomaksu, Yö")}
            {getDescriptionItem("Perusmaksut ja lasku")}
        </Descriptions>
    );
};

export default ConsumptionDescriptionSkeleton;