'use client';
import React, { type CSSProperties } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
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
import { Chart } from 'react-chartjs-2';
import dayjs from 'dayjs';
import { type HomewizardResponse, type HomewizardMeasurement } from '@energyapp/shared/interfaces';
import { TimePeriod } from '@energyapp/shared/enums';
import { SkeletonBarChart } from '@energyapp/app/_components/Skeletons/bar-chart-skeleton';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
);

declare module 'chart.js' {
    interface TooltipPositionerMap {
        top: TooltipPositionerFunction<ChartType>;
    }
}

Tooltip.positioners.top = function (items: readonly ActiveElement[]) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const pos = Tooltip.positioners.average(items);
    if (pos === false) return false;
    return {
        x: pos.x,
        y: this.chart.chartArea.top + 65,
        xAlign: 'center',
        yAlign: 'bottom',
    };
};

interface HomewizardChartProps {
    response?: HomewizardResponse;
    isLoading?: boolean;
    style?: CSSProperties;
}

export default function HomewizardChart({ response, isLoading, style }: HomewizardChartProps) {
    if (isLoading) {
        return <SkeletonBarChart />;
    }
    if (!response?.measurements.length) return null;

    const timePeriod = response.timePeriod;
    const data = response.measurements;

    const tooltipTitle = (tooltipItems: TooltipItem<ChartType>[]) => {
        const item = tooltipItems[0];
        const row = data[item?.dataIndex ?? 0];
        if (!row) return '';
        const d = dayjs(row.bucket);
        switch (timePeriod) {
            case TimePeriod.PT15M:
                return `${d.format('HH:mm')} – ${d.add(15, 'minute').format('HH:mm')}`;
            case TimePeriod.PT1H:
                return `${d.format('HH:00')} – ${d.add(1, 'hour').format('HH:00')}`;
            case TimePeriod.P1D:
                return `${d.format('DD.MM.YYYY')} – ${d.format('dddd')}`;
            case TimePeriod.P1M:
                return `${d.format('MMMM YYYY')}`;
            case TimePeriod.P1Y:
                return `${d.format('YYYY')}`;
            default:
                return d.format('DD.MM.YYYY HH:mm');
        }
    };

    const { labels, imports, exports, nets } = mapper({ data, timePeriod });

    const options: ChartOptions<'bar'> = {
        locale: 'fi-FI',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                display: true,
            },
            title: {
                display: false,
            },
            tooltip: {
                position: 'top',
                callbacks: {
                    title: tooltipTitle,
                    label: (item) => {
                        const val = (item.raw as number).toLocaleString('fi-FI', {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                        });
                        return ` ${item.dataset.label}: ${val} kWh`;
                    },
                },
            },
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: false,
                title: {
                    display: true,
                    text: 'kWh',
                },
            },
        },
    };

    const chartData: ChartData<'bar' | 'line'> = {
        labels,
        datasets: [
            {
                type: 'bar' as const,
                label: 'Osto (kWh)',
                data: imports,
                backgroundColor: 'rgba(59, 130, 246, 0.75)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                order: 2,
            },
            {
                type: 'bar' as const,
                label: 'Myynti (kWh)',
                data: exports,
                backgroundColor: 'rgba(34, 197, 94, 0.75)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1,
                order: 2,
            },
            {
                type: 'line' as const,
                label: 'Netto (kWh)',
                data: nets,
                borderColor: 'rgba(168, 85, 247, 0.9)',
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                borderWidth: 2,
                pointRadius: 2,
                tension: 0.3,
                order: 1,
                yAxisID: 'y',
            },
        ],
    };

    return (
        <div className="text-center">
            <div
                id="homewizard-canvas-container"
                style={{ height: '40vh', width: 'calc(100vw - (2 * 16px))', position: 'relative' }}
            >
                <Chart type="bar" style={style} options={options} data={chartData as ChartData<'bar'>} />
            </div>
        </div>
    );
}

const bucketLabel = (row: HomewizardMeasurement, timePeriod: TimePeriod): string => {
    const d = dayjs(row.bucket);
    switch (timePeriod) {
        case TimePeriod.PT15M: return d.format('HH:mm');
        case TimePeriod.PT1H:  return d.format('HH');
        case TimePeriod.P1D:   return d.format('DD');
        case TimePeriod.P1M:   return d.format('MMM');
        case TimePeriod.P1Y:   return d.format('YYYY');
        default:               return d.format('DD.MM HH:mm');
    }
};

const mapper = ({ data, timePeriod }: { data: HomewizardMeasurement[]; timePeriod: TimePeriod }) => {
    const labels: string[] = [];
    const imports: DefaultDataPoint<'bar'> = [];
    const exports: DefaultDataPoint<'bar'> = [];
    const nets: DefaultDataPoint<'bar'> = [];

    for (const row of data) {
        labels.push(bucketLabel(row, timePeriod));
        imports.push(parseFloat(row.grid_import_kwh.toFixed(3)));
        exports.push(parseFloat(row.grid_export_kwh.toFixed(3)));
        nets.push(parseFloat(row.net_kwh.toFixed(3)));
    }

    return { labels, imports, exports, nets };
};
