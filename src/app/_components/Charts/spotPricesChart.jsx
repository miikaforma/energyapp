'use client';
import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {calculateElectricityPrice, calculateTotalPrice} from "../utils/spotPriceHelpers.jsx";
import {isCurrentDay, isCurrentHour, isCurrentMonth, isCurrentYear} from "../utils/timeHelpers.jsx";
import dayjs from "dayjs";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Create a custom tooltip positioner to put at the bottom of the chart area
Tooltip.positioners.top = function(items) {
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

export default function SpotPricesChart({data, startDate, endDate, settings, timeType = 1}) {
    if (!data) {
        return <p>Ladataan...</p>
    }

    const title = (tooltipItems) => {
        const tooltipItem = tooltipItems[0];
        const row = data[tooltipItem.dataIndex];

        const date = dayjs(row.time)
        switch (timeType) {
            case 1:
            default:
                return `${date.hour()}:00 - ${date.hour()}:59`;
            case 2:
                return `${date.format('DD.MM.YYYY - dddd')}`;
            case 3:
                return `${date.format('YYYY - MMMM')}`;
            case 4:
                return `${date.format('YYYY')}`;
        }
    }

    const { labels, electricityPrices, totalPrices, bgColors1, bgColors2, min, max } = mapper(data, settings, timeType);

    let graphTitle = `Spottihinnat ${new Date(startDate).toLocaleDateString('fi-FI')}`
    switch (timeType) {
        case 2:
            graphTitle = `Spottihinnat - ${dayjs(startDate).format('MMMM YYYY')}`
            break;
        case 3:
            graphTitle = `Spottihinnat - ${dayjs(startDate).format('YYYY')}`
            break;
        case 4:
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
    };

    let datasetLabel = 'Sähkö (c/kWh)'
    switch (timeType) {
        case 2:
            datasetLabel = 'Keskihinta (c/kWh)';
            break;
        case 3:
            datasetLabel = 'Keskihinta (c/kWh)';
            break;
        case 4:
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
    };

    if (timeType === 1) {
        mappedData.datasets.push({
            label: 'Hinta (c/kWh)',
            data: totalPrices,
            backgroundColor: bgColors2,
            hidden: true,
        })
    }

    return <Bar
        options={options}
        data={mappedData}
    />;
}

const mapper = (data, settings, timeType) => {
    if (!data || !data.length) return {
        labels: [],
        values: [],
        prices: [],
    }

    let labels = []
    let electricityPrices = []
    let totalPrices = []
    let bgColors1 = []
    let bgColors2 = []

    let min = 0
    let max = 30

    data.map(row => {
        const electricityPrice = calculateElectricityPrice(row, settings)
        const totalPrice = calculateTotalPrice(row, settings)

        electricityPrices.push(electricityPrice.toFixed(2))
        totalPrices.push(totalPrice.toFixed(2))

        const parsedTime = dayjs(row.time)
        switch (timeType) {
            case 1: {
                labels.push(`${new Date(row.time).getHours().toString().padStart(2, '0')}`)
                // labels.push(`klo ${new Date(row.time).getHours().toString().padStart(2, '0')} - ${(new Date(row.time).getHours() + 1).toString().padStart(2, '0')}`)
                break;
            }
            case 2: {
                labels.push(parsedTime.format('DD'))
                break;
            }
            case 3: {
                labels.push(parsedTime.format('MMM'))
                break;
            }
            case 4: {
                labels.push(parsedTime.format('YYYY'))
                break;
            }
        }

        let isCurrent = false
        switch (timeType) {
            case 1:
            default:
                isCurrent = isCurrentHour(row.time)
                break;
            case 2:
                isCurrent = isCurrentDay(row.time)
                break;
            case 3:
                isCurrent = isCurrentMonth(row.time)
                break;
            case 4:
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
