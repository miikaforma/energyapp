import { type Dayjs } from "dayjs";
import { Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    type Chart,
    type ChartOptions,
    type Plugin,
    type TooltipItem,
    type DefaultDataPoint,
} from 'chart.js';
// import ChartDataLabels from 'chartjs-plugin-datalabels';

const totalValuePlugin = {
    id: 'totalValue',
    beforeDraw: (chart: Chart) => {
        const ctx = chart.ctx;
        ctx.save();
        ctx.font = '16px Arial'; // Adjust font size and family to your needs
        ctx.fillStyle = 'white'; // Change the color to white
        const totalValue = chart.data?.datasets[0]?.data.reduce((a, b) => {
            if (typeof a === 'number' && typeof b === 'number') {
                return a + b;
            }
            return a;
        }, 0) ?? 0;
        const text = `${(totalValue as number).toFixed(1)} kWh`;
        const textX = Math.round((chart.width - ctx.measureText(text).width) / 2) + 5;
        const chartHeight = chart.chartArea.bottom - chart.chartArea.top;
        const textY = chart.chartArea.top + (chartHeight / 2) - (parseInt(ctx.font) / 2) + 5; // Adjust the y-coordinate
        ctx.fillText(text, textX, textY);
        ctx.restore();
    },
} as Plugin<'doughnut'>;

// ChartJS.register(ChartDataLabels);
ChartJS.register(ArcElement, Tooltip, Legend/*, totalValuePlugin*/);

interface MelCloudEnergyReportTotals {
    totalHeatingConsumed: number
    totalCoolingConsumed: number
    totalAutoConsumed: number
    totalDryConsumed: number
    totalFanConsumed: number
    totalOtherConsumed: number
}

interface MelCloudEnergyReportPieProps extends MelCloudEnergyReportTotals {
    fromDate: Dayjs
    toDate: Dayjs
    deviceName: string
}

export default function MelCloudEnergyReportPie({ fromDate, toDate,
    deviceName, totalHeatingConsumed, totalCoolingConsumed, totalAutoConsumed, totalDryConsumed, totalFanConsumed, totalOtherConsumed
}: MelCloudEnergyReportPieProps) {
    const options = {
        locale: 'fi-FI',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: "bottom",
                labels: {
                    generateLabels: function (chart: Chart<'doughnut'>) {
                        const data = chart.data;
                        if (data.labels?.length && data.datasets.length) {
                            // Calculate total
                            const total = data.datasets[0]?.data.reduce((a: number, b: number) => a + b, 0) ?? 0;

                            return data.labels.map((label, i) => {
                                const ds = data.datasets[0];
                                const arcOpts = chart.options.elements?.arc;
                                const fill = String(ds?.backgroundColor?.[i] ?? arcOpts?.backgroundColor);
                                const stroke = String(ds?.borderColor?.[i] ?? arcOpts?.borderColor);
                                const bw = arcOpts?.borderWidth

                                // Calculate percentage
                                const dataPoint = ds?.data[i] ?? 0;
                                const percentage = (dataPoint / total * 100).toFixed(2);

                                return {
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                                    text: `${String(label)}: ${parseFloat(dataPoint.toFixed(1))} kWh (${percentage}%)`,
                                    fillStyle: fill,
                                    strokeStyle: stroke,
                                    lineWidth: bw,
                                    // hidden: isNaN(ds.data[i]) || meta.data[i].hidden,
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
            tooltip: {
                callbacks: {
                    label: function (context: TooltipItem<'doughnut'>) {
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((total, num) => total + num, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return ` ${value.toFixed(1)} kWh (${percentage}%)`;
                    }
                }
            },
        },
    } as ChartOptions<'doughnut'>;

    const { labels, values, backgroundColors, borderColors } = dataMapper({
        totalHeatingConsumed, totalCoolingConsumed, totalAutoConsumed, totalDryConsumed, totalFanConsumed, totalOtherConsumed
    });

    const mappedData = {
        labels,
        datasets: [
            {
                label: '',
                data: values,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
            }
        ],
    };

    return (
        <div className='text-center'>
            <div className="text-sm mb-3 mt-3">{deviceName} {fromDate.format('DD.MM.YYYY')} - {toDate.format('DD.MM.YYYY')}</div>
            <div id="canvas-container" style={{ paddingBottom: 8, height: 400 }}>
                <Doughnut
                    options={options}
                    data={mappedData}
                    plugins={[totalValuePlugin]}
                />
            </div>
        </div>
    )
}

const dataMapper = ({ totalHeatingConsumed, totalCoolingConsumed, totalAutoConsumed, totalDryConsumed, totalFanConsumed, totalOtherConsumed }: MelCloudEnergyReportTotals) => {
    const labels: string[] = []
    const values: DefaultDataPoint<'doughnut'> = []
    const backgroundColors: string[] = []
    const borderColors: string[] = []

    // Heating
    if (totalHeatingConsumed > 0) {
        labels.push('Lämmitys')
        values.push(totalHeatingConsumed)
        backgroundColors.push('rgb(208, 16, 14)')
        borderColors.push('rgb(255, 255, 255)')
    }

    // Cooling
    if (totalCoolingConsumed > 0) {
        labels.push('Jäähdytys')
        values.push(totalCoolingConsumed)
        backgroundColors.push('rgb(16, 128, 232)')
        borderColors.push('rgb(255, 255, 255)')
    }

    // Auto
    if (totalAutoConsumed > 0) {
        labels.push('Auto')
        values.push(totalAutoConsumed)
        backgroundColors.push('rgb(162, 43, 132)')
        borderColors.push('rgb(255, 255, 255)')
    }

    // Dry
    if (totalDryConsumed > 0) {
        labels.push('Kuivaus')
        values.push(totalDryConsumed)
        backgroundColors.push('rgb(164, 96, 20)')
        borderColors.push('rgb(255, 255, 255)')
    }

    // Fan
    if (totalFanConsumed > 0) {
        labels.push('Tuuletus')
        values.push(totalFanConsumed)
        backgroundColors.push('rgb(191, 224, 255)')
        borderColors.push('rgb(255, 255, 255)')
    }

    // Other
    if (totalOtherConsumed > 0) {
        labels.push('Muu')
        values.push(totalOtherConsumed)
        backgroundColors.push('rgb(255, 228, 191)')
        borderColors.push('rgb(255, 255, 255)')
    }

    return {
        labels,
        values,
        backgroundColors,
        borderColors,
    }
}
