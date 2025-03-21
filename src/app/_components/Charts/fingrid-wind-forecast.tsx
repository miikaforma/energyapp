import dayjs from "dayjs";
import {Line} from "react-chartjs-2";
import { type fingrid_time_series_data } from "@prisma/client";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler,
    type ChartOptions,
    type ChartDataset,
    // type Point,
} from 'chart.js';
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';
import annotationPlugin from 'chartjs-plugin-annotation';
// import { formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
import { Col, Row, Statistic } from "antd";
import WindPowerIcon from '@mui/icons-material/WindPower';
import AirIcon from '@mui/icons-material/Air';

ChartJS.register(  CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler,
    annotationPlugin);

interface FingridWindForecastProps {
    produced?: fingrid_time_series_data[]
    hourlyForecast?: fingrid_time_series_data[]
    dailyForecast?: fingrid_time_series_data[]
}

export default function FingridWindForecast({ produced, hourlyForecast, dailyForecast }: FingridWindForecastProps) {
    if (!produced || !hourlyForecast || !dailyForecast) {
        return <p>Ladataan...</p>
    }

    const hourlyForecastData = mapEventsToData(hourlyForecast, 'Ennuste tunneittain', 'rgb(0,210,255)', false, true)

    const mappedData = {
        labels: [], // generate the labels
        datasets: [
            mapEventsToData(produced, 'Toteutunut', 'rgb(0,93,255)', true),
            hourlyForecastData,
            mapEventsToData(dailyForecast, 'Ennuste päivittäin', 'rgb(194,243,250)', false, true, true),
        ],
    }

    const minYPoint = hourlyForecast?.reduce((minPoint, point) => point.value < minPoint.value ? point : minPoint);
    const maxYPoint = hourlyForecast?.reduce((maxPoint, point) => point.value > maxPoint.value ? point : maxPoint);    
/*
    const minXValue = Math.min(...hourlyForecastData.data.map(point => new Date((point as Point).x).getTime()));
    const maxXValue = Math.max(...hourlyForecastData.data.map(point => new Date((point as Point).x).getTime()));    

    const getXAdjustByValue = (timestamp: number): number => {
        const oneHour = 3600000; // milliseconds in one hour
        const twoHours = 2 * oneHour;

        if (Math.abs(timestamp - maxXValue) <= oneHour) {
            return -100;
        } else if (Math.abs(timestamp - maxXValue) <= twoHours) {
            return -60;
        } else if (Math.abs(timestamp - minXValue) <= oneHour) {
            return 100;
        } else if (Math.abs(timestamp - minXValue) <= twoHours) {
            return 60;
        }
        return 0;
    }

    function getYAdjustByValue(value: number): number {
        if (value < 3000) {
            return -50;
        } else if (value < 4000) {
            return 40;
        } else {
            return 50;
        }
    }

    const annotations = hourlyForecastData.hidden ? {} : {
        minLabel: {
            type: 'label',
            xValue: new Date(minYPoint.start_time).getTime(),
            yValue: minYPoint.value,
            xAdjust: getXAdjustByValue(new Date(minYPoint.start_time).getTime()),
            yAdjust: getYAdjustByValue(minYPoint.value),
            color: 'white',
            content: `${formatNumberToFI(minYPoint.value)} MW`,
            textAlign: 'start',
            font: {
                size: 14
            },
            callout: {
                display: true,
                side: 10
            }
        },
        maxLabel: {
            type: 'label',
            xValue: new Date(maxYPoint.start_time).getTime(),
            yValue: maxYPoint.value,
            xAdjust: getXAdjustByValue(new Date(maxYPoint.start_time).getTime()),
            yAdjust: getYAdjustByValue(maxYPoint.value),
            color: 'white',
            content: `${formatNumberToFI(maxYPoint.value)} MW`,
            textAlign: 'start',
            font: {
                size: 14
            },
            callout: {
                display: true,
                side: 10
            }
        },
        // minLine: {
        //     type: 'line',
        //     yMin: minYValue,
        //     yMax: minYValue,
        //     borderColor: 'red',
        //     borderWidth: 2,
        //     label: {
        //         content: `Min: ${minYValue}`,
        //         enabled: true,
        //         position: 'center'
        //     }
        // },
        // maxLine: {
        //     type: 'line',
        //     yMin: maxYValue,
        //     yMax: maxYValue,
        //     borderColor: 'green',
        //     borderWidth: 2,
        //     label: {
        //         content: `Max: ${maxYValue}`,
        //         enabled: true,
        //         position: 'center'
        //     }
        // }
    };*/

    const options = {
        locale: 'fi-FI',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
            },
            title: {
                display: true,
                text: `Tuulituotanto Suomessa - ${dayjs().format('DD.MM.YYYY HH:mm')}`,
            },
            // annotation: {
            //     annotations
            // },
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day'  // or 'hour', 'minute', 'second'  depending on your needs
                }
            },
            y: {
                ticks: {
                    // Include a sign in the ticks
                    callback: function(value, _index, _values) {
                        return value + ' MW';
                    }
                },
                min: 0,
                suggestedMax: 7700,
            },
        },
        elements: {
            point:{
                radius: 0.5
            }
        },
        tooltips: {
            enabled: true,
        },
        interaction: {
            mode: 'x',
            intersect: false,
        },
    } as ChartOptions<'line'>;

    const getProductionColor = (value: number): string => {
        if (value < 3000) {
            return 'rgb(0,210,255)';
        } else if (value < 4000) {
            return 'rgb(0, 135, 255)';
        } else {
            return 'rgb(0, 108, 204)';
        }
    }

    return (
        <div className='text-center'>
            <div id="canvas-container" style={{ height: '30vh', width: 'calc(100vw - (2 * 16px))', position: 'relative' }}>
                <Line
                    options={options}
                    data={mappedData}
                />
            </div>
            <Row gutter={16}>
                <Col span={12}>
                    <Statistic title="Pienin tuotanto" value={minYPoint.value} suffix="MW" prefix={<WindPowerIcon/>} valueStyle={{ color: getProductionColor(minYPoint.value) }} />
                </Col>
                <Col span={12}>
                    <Statistic title="Suurin tuotanto" value={maxYPoint.value} precision={2} suffix="MW" prefix={<AirIcon/>} valueStyle={{ color: getProductionColor(maxYPoint.value) }} />
                </Col>
            </Row>
        </div>
    )
}

const mapEventsToData = (events: fingrid_time_series_data[], label: string, color: string, fill = false, dashed = false, hidden = false) => {
    const dataset = {
        label: label,
        data: [],
        fill: fill,
        borderColor: color,
        backgroundColor: 'rgba(0,93,255, 0.2)',
        tension: 0.2,
        hidden: hidden,
        borderDash: dashed ? [5, 5] : [],
    } as ChartDataset<'line'>;

    events.sort((a, b) => {
        const dateA = a.start_time ? new Date(a.start_time) : null;
        const dateB = b.start_time ? new Date(b.start_time) : null;
        if (dateA && dateB) {
            return dateA.getTime() - dateB.getTime();
        }
        return 0;
    }).forEach(event => {
        if (event.start_time) {
            dataset.data.push({
                x: new Date(event.start_time).getTime(),
                y: event.value ?? 0,
            });
        }
    });

    return dataset;
};
