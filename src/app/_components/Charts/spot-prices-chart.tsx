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
    type ChartDataset,
    type TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { calculateTotalPrice } from "@energyapp/utils/spotPriceHelpers";
import { isCurrentDay, isCurrentHour, isCurrentMonth, isCurrentYear } from "@energyapp/utils/timeHelpers";
import dayjs, { type Dayjs } from "dayjs";
import { type ISettings, type ISpotPrice, type ISpotPriceResponse } from '@energyapp/shared/interfaces';
import { TimePeriod } from '@energyapp/shared/enums';

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

interface SpotPriceChartProps {
    spotPriceResponse?: ISpotPriceResponse
    startDate: Dayjs
    endDate: Dayjs
    settings: ISettings
    style?: CSSProperties
}

export default function SpotPricesChart({ spotPriceResponse, startDate, endDate, settings, style }: SpotPriceChartProps) {
    if (!spotPriceResponse) return null;

    const timePeriod = spotPriceResponse.timePeriod;
    const data = spotPriceResponse.prices;

    const title = (tooltipItems: TooltipItem<'bar'>[]) => {
        const tooltipItem = tooltipItems[0];
        const row = data[tooltipItem?.dataIndex ?? 0];
        if (!row) return '';

        const date = dayjs(row.time)
        switch (timePeriod) {
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

    const { labels, electricityPrices, totalPrices, bgColors1, bgColors2, min, max } = mapper({ data, settings, timePeriod });

    let graphTitle = `Spottihinnat ${dayjs(startDate).format('DD.MM.YYYY')}`
    switch (timePeriod) {
        case TimePeriod.P1D:
            graphTitle = `Spottihinnat - ${dayjs(startDate).format('MMMM YYYY')}`
            break;
        case TimePeriod.P1M:
            graphTitle = `Spottihinnat - ${dayjs(startDate).format('YYYY')}`
            break;
        case TimePeriod.P1Y:
            graphTitle = `Spottihinnat - (${dayjs(startDate).format('YYYY')} - ${dayjs(endDate).format('YYYY')})`
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
                // text: `Spottihinnat ${new Date(startDate).toLocaleDateString('fi-FI')} - ${new Date(endDate).toLocaleDateString('fi-FI')}`,
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

    let datasetLabel = 'Sähkö (c/kWh)'
    switch (timePeriod) {
        case TimePeriod.P1D:
            datasetLabel = 'Keskihinta (c/kWh)';
            break;
        case TimePeriod.P1M:
            datasetLabel = 'Keskihinta (c/kWh)';
            break;
        case TimePeriod.P1Y:
            datasetLabel = 'Keskihinta (c/kWh)';
            break;
    }

    const mappedData = {
        labels,
        datasets: [
            {
                label: datasetLabel,
                data: electricityPrices,
                backgroundColor: bgColors1,
            },
        ],
    } as ChartData<'bar'>;

    if (timePeriod === TimePeriod.PT1H) {
        mappedData.datasets.push({
            label: 'Hinta (c/kWh)',
            data: totalPrices,
            backgroundColor: bgColors2,
            hidden: true,
        } as ChartDataset<'bar'>)
    }

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

const mapper = ({ data, settings, timePeriod }: { data: ISpotPrice[], settings: ISettings, timePeriod: TimePeriod }) => {
    if (!data?.length) return {
        labels: [],
        values: [],
        prices: [],
    }

    const labels: string[] = []
    const electricityPrices: DefaultDataPoint<'bar'> = []
    const totalPrices: DefaultDataPoint<'bar'> = []
    const bgColors1: string[] = []
    const bgColors2: string[] = []

    let min = 0
    let max = 30

    data.map(row => {
        const electricityPrice = row.price_with_tax
        const totalPrice = calculateTotalPrice({ data: row, settings })

        electricityPrices.push(parseFloat(electricityPrice.toFixed(2)))
        totalPrices.push(parseFloat(totalPrice.toFixed(2)))

        const parsedTime = dayjs(row.time)
        switch (timePeriod) {
            case TimePeriod.PT1H: {
                labels.push(`${dayjs(row.time).hour().toString().padStart(2, '0')}`)
                // labels.push(`klo ${new Date(row.time).getHours().toString().padStart(2, '0')} - ${(new Date(row.time).getHours() + 1).toString().padStart(2, '0')}`)
                break;
            }
            case TimePeriod.P1D: {
                labels.push(parsedTime.format('DD'))
                break;
            }
            case TimePeriod.P1M: {
                labels.push(parsedTime.format('MMM'))
                break;
            }
            case TimePeriod.P1Y: {
                labels.push(parsedTime.format('YYYY'))
                break;
            }
        }

        let isCurrent = false
        switch (timePeriod) {
            case TimePeriod.PT1H:
            default:
                isCurrent = isCurrentHour(row.time)
                break;
            case TimePeriod.P1D:
                isCurrent = isCurrentDay(row.time)
                break;
            case TimePeriod.P1M:
                isCurrent = isCurrentMonth(row.time)
                break;
            case TimePeriod.P1Y:
                isCurrent = isCurrentYear(row.time)
                break;
        }

        bgColors1.push(isCurrent ? '#00a6cc' : electricityPrice < 10 ? 'green' : electricityPrice < 15 ? 'yellow' : electricityPrice < 20 ? 'orange' : 'red')
        bgColors2.push(isCurrent ? '#00a6cc' : totalPrice < 15 ? 'green' : totalPrice < 20 ? 'yellow' : totalPrice < 30 ? 'orange' : 'red')

        min = Math.min(min, electricityPrice)
        min = Math.min(min, totalPrice)

        max = Math.max(max, electricityPrice)
        max = Math.max(max, totalPrice)
    });

    return {
        labels,
        electricityPrices,
        totalPrices,
        bgColors1,
        bgColors2,
        min: Math.floor(min),
        max: Math.ceil(max),
    }
}
