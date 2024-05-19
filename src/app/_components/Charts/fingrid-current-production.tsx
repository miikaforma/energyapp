import dayjs from "dayjs";
import {Doughnut} from "react-chartjs-2";
import { type fingrid_latest_data } from '@prisma/client'
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    type DefaultDataPoint,
    type ChartOptions,
    type Chart,
} from 'chart.js';
import {FingridRealTimeEvents} from "@energyapp/shared/constants";
import useIsXs from "@energyapp/app/_hooks/mediaQuerys/useIsXs";

ChartJS.register(ArcElement, Tooltip, Legend);

interface FingridProductionDataProps {
    data?: fingrid_latest_data[]
}

export default function FingridProductionData({ data }: FingridProductionDataProps) {
    const isXs = useIsXs()

    if (!data) {
        return <p>Ladataan...</p>
    }

    const options = {
        locale: 'fi-FI',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: isXs ? 'bottom' : 'right',
                labels: {
                    generateLabels: function(chart: Chart<'doughnut'>) {
                        const data = chart.data;
                        if (data.labels?.length && data.datasets.length) {
                            return data.labels.map((label, i) => {
                                const ds = data.datasets[0];
                                const arcOpts = chart.options.elements?.arc;
                                const fill = String(ds?.backgroundColor?.[i] ?? arcOpts?.backgroundColor);
                                const stroke = String(ds?.borderColor?.[i] ?? arcOpts?.borderColor);
                                const bw = arcOpts?.borderWidth

                                return {
                                    text: String(label) + ": " + String(ds?.data[i]) + " MW",
                                    fillStyle: fill,
                                    strokeStyle: stroke,
                                    lineWidth: bw,
                                    // hidden: isNaN(ds?.data[i]) || meta.data[i].hidden,
                                    index: i,
                                    font: {
                                        color: '#fff',
                                    },
                                    fontColor: '#fff',
                                };
                            });
                        } else {
                            return [];
                        }
                    }
                }
            },
            title: {
                display: true,
                text: `Sähkötuotanto Suomessa - ${dayjs().format('DD.MM.YYYY HH:mm')}`,
            },
        }
    } as ChartOptions<'doughnut'>;

    const { labels, values, backgroundColors, borderColors } = dataMapper(data);

    const mappedData = {
        labels,
        datasets: [
            {
                label: 'Tuotto',
                data: values,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
            }
        ],
    };

    const timeNow = dayjs();
    return (
        <div className='text-center'>
            <div className="text-sm mb-3 mt-3">Tuotanto {timeNow.format('DD.MM.YYYY HH:mm')}</div>
            <div id="canvas-container" style={{ height: '30vh', width: 'calc(100vw - (2 * 16px))', position: 'relative' }}>
                <Doughnut
                    options={options}
                    data={mappedData}
                />
            </div>
        </div>
    )
}

const dataMapper = (data: fingrid_latest_data[]) => {
    if (!data?.length) return {
        labels: [],
        values: [],
        backgroundColors: [],
        borderColors: [],
    }

    const labels: string[] = []
    const values: DefaultDataPoint<'doughnut'> = []
    const backgroundColors: string[] = []
    const borderColors: string[] = []

    data.sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

    data.forEach(row => {
        values.push((row.value ?? 0))

        switch (row.dataset_id) {
            case FingridRealTimeEvents.Nuclear: {
                labels.push('Ydinvoima')
                backgroundColors.push('rgb(255,220,0)')
                borderColors.push('rgb(124,108,0)')
                break;
            }
            case FingridRealTimeEvents.Water: {
                labels.push('Vesivoima')
                backgroundColors.push('rgb(0,81,255)')
                borderColors.push('rgb(0,34,112)')
                break;
            }
            case FingridRealTimeEvents.DistrictHeating: {
                labels.push('Kaukolämpö')
                backgroundColors.push('rgb(255,127,0)')
                borderColors.push('rgb(128,63,0)')
                break;
            }
            case FingridRealTimeEvents.Industrial: {
                labels.push('Teollisuus')
                backgroundColors.push('rgb(49,49,49)')
                borderColors.push('rgb(28,28,28)')
                break;
            }
            case FingridRealTimeEvents.Wind: {
                labels.push('Tuulivoima')
                backgroundColors.push('rgb(144,235,255)')
                borderColors.push('rgb(0,131,161)')
                break;
            }
            case FingridRealTimeEvents.Other: {
                labels.push('Muu tuotanto')
                backgroundColors.push('rgb(136,136,136)')
                borderColors.push('rgb(72,72,72)')
                break;
            }
            case FingridRealTimeEvents.Condensation: {
                labels.push('Lauhdevoima')
                backgroundColors.push('rgb(52,133,150)')
                borderColors.push('rgb(9,203,252)')
                break;
            }
            default: {
                labels.push((row.dataset_id ?? '').toString())
                backgroundColors.push('rgb(0,0,0)')
                borderColors.push('rgb(54,54,54)')
                break;
            }
        }
    });

    return {
        labels,
        values,
        backgroundColors,
        borderColors,
    }
}
