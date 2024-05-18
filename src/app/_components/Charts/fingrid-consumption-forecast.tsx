import dayjs from "dayjs";
import {Line} from "react-chartjs-2";
import { type fingrid_time_series_data } from '@prisma/client'
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
} from 'chart.js';
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';

ChartJS.register(  CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler);

interface FingridConsumptionForecastProps {
    hourEnergyConsumptionForecast?: fingrid_time_series_data[]
    hourEnergyProductionForecast?: fingrid_time_series_data[]
}

export default function FingridConsumptionForecast({ hourEnergyConsumptionForecast, hourEnergyProductionForecast }: FingridConsumptionForecastProps) {
    if (!hourEnergyConsumptionForecast || !hourEnergyProductionForecast) {
        return <p>Ladataan...</p>
    }

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
                text: `Kulutusennuste Suomessa - ${dayjs().format('DD.MM.YYYY HH:mm')}`,
            },
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
                }
            },
        },
        elements: {
            point:{
                radius: 0.5
            }
        },
        tooltips: {
            enabled: true
        },
        interaction: {
            mode: 'x',
            intersect: false,
        },
    } as ChartOptions<'line'>;

    // Convert the 5 minute interval forecast to hourly forecast
    const hourlyConsumptionForecast: fingrid_time_series_data[] = [];
    hourEnergyConsumptionForecast.forEach((dataPoint) => {
        const date = dataPoint.start_time ? new Date(dataPoint.start_time) : new Date();
        if (date.getMinutes() === 0) {
            hourlyConsumptionForecast.push(dataPoint);
        }
    });

    const mappedData = {
        labels: [],
        datasets: [
            // mapEventsToData(nextDayForecast, 'Kulutusennuste - seuraava vuorokausi', 'rgb(0,210,255)', false, false),
            mapEventsToData(hourlyConsumptionForecast, 'Kulutusennuste', 'rgb(255,56,56)', false, false),
            mapEventsToData(hourEnergyProductionForecast, 'Tuotantoennuste', 'rgb(100,255,0)', false, false),
        ],
    };

    return (
        <div className='text-center'>
            <div id="canvas-container" style={{ height: '30vh', width: 'calc(100vw - (2 * 16px))', position: 'relative' }}>
                <Line
                    options={options}
                    data={mappedData}
                />
            </div>
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
