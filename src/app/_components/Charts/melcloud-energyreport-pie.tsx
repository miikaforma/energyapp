import dayjs, { Dayjs } from "dayjs";
import { Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
// import ChartDataLabels from 'chartjs-plugin-datalabels';

const totalValuePlugin = {
    id: 'totalValue',
    beforeDraw: (chart) => {
        const ctx = chart.ctx;
        ctx.save();
        ctx.font = '16px Arial'; // Adjust font size and family to your needs
        ctx.fillStyle = 'white'; // Change the color to white
        const totalValue = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
        const text = `${totalValue.toFixed(1)} kWh`;
        const textX = Math.round((chart.width - ctx.measureText(text).width) / 2) + 5;
        const chartHeight = chart.chartArea.bottom - chart.chartArea.top;
        const textY = chart.chartArea.top + (chartHeight / 2) - (parseInt(ctx.font) / 2) + 5; // Adjust the y-coordinate
        ctx.fillText(text, textX, textY);
        ctx.restore();
    },
};

// ChartJS.register(ChartDataLabels);
ChartJS.register(ArcElement, Tooltip, Legend, totalValuePlugin);

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
                    generateLabels: function (chart: { data: any; getDatasetMeta: (arg0: number) => any; options: { elements: { arc: any; }; }; }) {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                            // Calculate total
                            const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);

                            return data.labels.map((label: string, i: string | number) => {
                                const meta = chart.getDatasetMeta(0);
                                const ds = data.datasets[0];
                                const arc = meta.data[i];
                                const custom = (arc && arc.custom) || {};
                                const arcOpts = chart.options.elements.arc;
                                const fill = custom.backgroundColor ? custom.backgroundColor : (ds.backgroundColor[i] || arcOpts.backgroundColor);
                                const stroke = custom.borderColor ? custom.borderColor : (ds.borderColor[i] || arcOpts.borderColor);
                                const bw = arcOpts.borderWidth //custom.borderWidth ? custom.borderWidth : (ds.borderWidth[i] || arcOpts.borderWidth);

                                // Calculate percentage
                                const percentage = (ds.data[i] / total * 100).toFixed(2);

                                return {
                                    text: `${label}: ${parseFloat(ds.data[i].toFixed(1))} kWh (${percentage}%)`,
                                    fillStyle: fill,
                                    strokeStyle: stroke,
                                    lineWidth: bw,
                                    hidden: isNaN(ds.data[i]) || meta.data[i].hidden,
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
                    label: function (context: { parsed: any; dataset: { data: any[]; }; }) {
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((total, num) => total + num, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return ` ${value.toFixed(1)} kWh (${percentage}%)`;
                    }
                }
            },
        },
    };

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
                />
            </div>
        </div>
    )
}

const dataMapper = ({ totalHeatingConsumed, totalCoolingConsumed, totalAutoConsumed, totalDryConsumed, totalFanConsumed, totalOtherConsumed }: MelCloudEnergyReportTotals) => {
    let labels = []
    let values = []
    let backgroundColors = []
    let borderColors = []

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
