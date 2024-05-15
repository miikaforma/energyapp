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
import { type cbase_pv_forecast } from "@prisma/client";

ChartJS.register(  CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler);

type CBasePvForecastProps = {
    hourlyForecast?: cbase_pv_forecast[]
}

export default function CBasePvForecast({ hourlyForecast }: CBasePvForecastProps) {
    if (!hourlyForecast) {
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
                text: `Aurinkoennuste - ${dayjs().format('DD.MM.YYYY HH:mm')}`,
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
                        return value + ' W';
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
            mapEventsToData(hourlyForecast, 'Ennuste (W)', 'rgb(255,255,0)', false, true),
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

const mapEventsToData = (events: cbase_pv_forecast[], label: string, color: string, fill = false, dashed = false, hidden = false) => {
    const dataset = {
        label: label,
        data: [],
        fill: fill,
        borderColor: color,
        backgroundColor: 'rgba(255,255,100, 0.2)',
        tension: 0.2,
        hidden: hidden,
        borderDash: dashed ? [5, 5] : [],
    } as ChartDataset<'line'>;

    events.sort((a, b) => {
        const dateA = a.time ? new Date(a.time) : null;
        const dateB = b.time ? new Date(b.time) : null;
        if (dateA && dateB) {
            return dateA.getTime() - dateB.getTime();
        }
        return 0;
    }).forEach(event => {
        if (event.time) {
            dataset.data.push({
                x: new Date(event.time).getTime(),
                y: event.pv_po ?? 0,
            });
        }
    });

    return dataset;
};
