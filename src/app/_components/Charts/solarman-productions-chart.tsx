'use client';
import React, { type CSSProperties } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    type ChartType,
    type TooltipPositionerFunction,
    type ActiveElement,
    type ChartOptions,
    type ChartData,
    type DefaultDataPoint,
    type TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import dayjs, { type Dayjs } from "dayjs";
import { type SolarmanProductionResponse, type SolarmanProduction } from '@energyapp/shared/interfaces';
import { TimePeriod } from '@energyapp/shared/enums';
import { SkeletonBarChart } from '@energyapp/app/_components/Skeletons/bar-chart-skeleton';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

declare module 'chart.js' {
    // Extend tooltip positioner map
    interface TooltipPositionerMap {
        top: TooltipPositionerFunction<ChartType>;
    }
}

// Create a custom tooltip positioner to put at the bottom of the chart area
Tooltip.positioners.top = function (items: readonly ActiveElement[]) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const pos = Tooltip.positioners.average(items);

    // Happens when nothing is found
    if (pos === false) {
        return false;
    }

    const chart = this.chart;

    return {
        x: pos.x,
        y: chart.chartArea.top + 65,
        xAlign: 'center',
        yAlign: 'bottom',
    };
};

type SolarmanProductionChartProps = {
    response?: SolarmanProductionResponse
    startDate: Dayjs
    endDate: Dayjs
    isLoading?: boolean
    style?: CSSProperties
}

export default function SolarmanProductionsChart({ response, startDate, endDate, isLoading, style }: SolarmanProductionChartProps) {
    if (isLoading) {
        return <SkeletonBarChart />
    }
    if (!response) return null;

    const timePeriod = response.timePeriod;
    const data = response.productions;

    const title = (tooltipItems: TooltipItem<'bar'>[]) => {
        const tooltipItem = tooltipItems[0];
        const row = data[tooltipItem?.dataIndex ?? 0];
        if (!row) return '';

        const date = dayjs(row.time)
        switch (timePeriod) {
            case TimePeriod.PT15M:
                return `${date.format('HH:mm')}`;
            case TimePeriod.PT1H:
            default:
                return `${date.hour()}:00 - ${date.hour()}:59`;
            case TimePeriod.P1D:
                return `${date.format('DD.MM.YYYY - dddd')}`;
            case TimePeriod.P1M:
                return `${date.format('YYYY - MMMM')}`;
            case TimePeriod.P1Y:
                return `${date.format('YYYY')}`;
        }
    }

    const { labels, productions, bgColors, min, max } = mapper({ data, timePeriod });

    let graphTitle = `Tuotot ${dayjs(startDate).format('DD.MM.YYYY')}`
    switch (timePeriod) {
        case TimePeriod.P1D:
            graphTitle = `Tuotot - ${dayjs(startDate).format('MMMM YYYY')}`
            break;
        case TimePeriod.P1M:
            graphTitle = `Tuotot - ${dayjs(startDate).format('YYYY')}`
            break;
        case TimePeriod.P1Y:
            graphTitle = `Tuotot - (${dayjs(startDate).format('YYYY')} - ${dayjs(endDate).format('YYYY')})`
            break;
    }

    const options = {
        locale: 'fi-FI',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                display: true,
                labels: {
                    boxWidth: 0,
                }
            },
            title: {
                display: true,
                text: graphTitle,
            },
            tooltip: {
                position: 'top',
                callbacks: {
                    title: title,
                }
            },
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            x: {
                // stacked: true,
            },
            y: {
                // stacked: true,
                min: min,
                max: max,
            },
        },
    } as ChartOptions<'bar'>;

    const mappedData = {
        labels,
        datasets: [
            {
                label: 'Tuotto (kWh)',
                data: productions,
                backgroundColor: bgColors,
            }
        ],
    } as ChartData<'bar'>;

    return (
        <div className='text-center'>
            {/* <div className="text-sm mb-3 mt-3">{deviceName} {fromDate.format('DD.MM.YYYY')} - {toDate.format('DD.MM.YYYY')}</div> */}
            <div id="canvas-container" style={{ height: '40vh', width: 'calc(100vw - (2 * 16px))', position: 'relative' }}>
                <Bar
                    style={style}
                    options={options}
                    data={mappedData}
                />
            </div>
        </div>
    )
}

const mapper = ({ data, timePeriod }: { data: SolarmanProduction[], timePeriod: TimePeriod }) => {
    if (!data?.length) return {
        labels: [],
        values: [],
        prices: [],
    }

    const labels: string[] = []
    const productions: DefaultDataPoint<'bar'> = []
    const bgColors: string[] = []

    let min = 0
    let max = timePeriod === TimePeriod.PT15M ? 2 : 10

    data.map(row => {
        const production = row.production / 1000
        productions.push(parseFloat(production.toFixed(2)))

        const parsedTime = dayjs(row.time)
        switch (timePeriod) {
            case TimePeriod.PT15M: {
                labels.push(`${dayjs(row.time).format('HH:mm')}`)
                bgColors.push(production < 0.25 ? 'yellow' : production < 0.5 ? 'gold' : production < 1 ? 'orange' : '#e87040')
                break;
            }
            case TimePeriod.PT1H: {
                labels.push(`${dayjs(row.time).hour().toString().padStart(2, '0')}`)
                bgColors.push(production < 1 ? 'yellow' : production < 2 ? 'gold' : production < 4 ? 'orange' : '#e87040')
                break;
            }
            case TimePeriod.P1D: {
                labels.push(parsedTime.format('DD'))
                bgColors.push(production < 10 ? 'yellow' : production < 20 ? 'gold' : production < 30 ? 'orange' : '#e87040')
                break;
            }
            case TimePeriod.P1M: {
                labels.push(parsedTime.format('MMM'))
                bgColors.push(production < 300 ? 'yellow' : production < 600 ? 'gold' : production < 1200 ? 'orange' : '#e87040')
                break;
            }
            case TimePeriod.P1Y: {
                labels.push(parsedTime.format('YYYY'))
                bgColors.push(production < 4000 ? 'yellow' : production < 8000 ? 'gold' : production < 16000 ? 'orange' : '#e87040')
                break;
            }
        }

        min = Math.min(min, production)
        max = Math.max(max, production)
    });

    return {
        labels,
        productions,
        bgColors,
        min: Math.floor(min),
        max: Math.ceil(max),
    }
}
