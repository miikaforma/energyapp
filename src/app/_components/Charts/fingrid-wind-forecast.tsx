import dayjs from "dayjs";
import {Line} from "react-chartjs-2";
import { type Event } from '@energyapp/app/_fingrid/api'
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

interface FingridWindForecastProps {
    produced?: Event[]
    hourlyForecast?: Event[]
    dailyForecast?: Event[]
}

export default function FingridWindForecast({ produced, hourlyForecast, dailyForecast }: FingridWindForecastProps) {
    if (!produced || !hourlyForecast || !dailyForecast) {
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
                text: `Tuulituotanto Suomessa - ${dayjs().format('DD.MM.YYYY HH:mm')}`,
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
            enabled: true,
        },
        interaction: {
            mode: 'x',
            intersect: false,
        },
    } as ChartOptions<'line'>;

    const mappedData = {
        labels: [], // generate the labels
        datasets: [
            mapEventsToData(produced, 'Toteutunut', 'rgb(0,93,255)', true),
            mapEventsToData(hourlyForecast, 'Ennuste tunneittain', 'rgb(0,210,255)', false, true),
            mapEventsToData(dailyForecast, 'Ennuste päivittäin', 'rgb(194,243,250)', false, true, true),
        ],
    };

    return (
        <div className='text-center'>
            <div id="canvas-container" style={{ paddingBottom: 8, height: 300, width: 'calc(100vw - 8px)' }}>
                <Line
                    options={options}
                    data={mappedData}
                />
            </div>
        </div>
    )
}

const mapEventsToData = (events: Event[], label: string, color: string, fill = false, dashed = false, hidden = false) => {
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
