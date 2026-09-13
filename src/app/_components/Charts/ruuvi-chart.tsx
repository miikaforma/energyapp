'use client';
import React, { type CSSProperties, useRef, useState, useCallback } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
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
import { Line } from 'react-chartjs-2';
import dayjs, { type Dayjs } from "dayjs";
import { TimePeriod } from '@energyapp/shared/enums';
import { SkeletonBarChart } from '@energyapp/app/_components/Skeletons/bar-chart-skeleton';
import { getIAQSByValues } from '@energyapp/utils/ruuviHelpers';

export type RuuviMetricType =
    | 'temperature'
    | 'humidity'
    | 'pressure'
    | 'movementCount'
    | 'airQuality'
    | 'co2'
    | 'pm2_5'
    | 'voc'
    | 'nox';

export interface IRuuviMeasurement {
    time: Dayjs;
    temperature?: number | null;
    humidity?: number | null;
    pressure?: number | null;
    movement_counter?: number | null;
    co2?: number | null;
    pm2_5?: number | null;
    voc?: number | null;
    nox?: number | null;
}

export interface IRuuviChartResponse {
    timePeriod: TimePeriod;
    measurements: IRuuviMeasurement[];
    mac: string;
    deviceName?: string;
}

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
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

interface RuuviChartProps {
    ruuviResponse?: IRuuviChartResponse;
    metricType: RuuviMetricType;
    startDate: Dayjs;
    endDate?: Dayjs;
    isLoading?: boolean;
    style?: CSSProperties;
    onDateRangeChange?: (startDate: Dayjs, endDate: Dayjs) => void;
}

const getMetricConfig = (metricType: RuuviMetricType) => {
    const configs = {
        temperature: { label: 'Lämpötila', unit: '°C', color: 'rgba(255, 99, 132, 1)', bgColor: 'rgba(255, 99, 132, 0.5)', title: 'Lämpötila' },
        humidity: { label: 'Kosteus', unit: '%', color: 'rgba(54, 162, 235, 1)', bgColor: 'rgba(54, 162, 235, 0.5)', title: 'Suhteellinen kosteus' },
        pressure: { label: 'Ilmanpaine', unit: 'hPa', color: 'rgba(75, 192, 192, 1)', bgColor: 'rgba(75, 192, 192, 0.5)', title: 'Ilmanpaine' },
        movementCount: { label: 'Liikemäärä', unit: '', color: 'rgba(153, 102, 255, 1)', bgColor: 'rgba(153, 102, 255, 0.5)', title: 'Liikemäärä' },
        airQuality: { label: 'Ilmanlaatu', unit: '(0-100)', color: 'rgba(255, 159, 64, 1)', bgColor: 'rgba(255, 159, 64, 0.5)', title: 'Ilmanlaatu' },
        co2: { label: 'CO₂', unit: 'ppm', color: 'rgba(255, 206, 86, 1)', bgColor: 'rgba(255, 206, 86, 0.5)', title: 'Hiilidioksidi' },
        pm2_5: { label: 'PM2.5', unit: 'µg/m³', color: 'rgba(201, 203, 207, 1)', bgColor: 'rgba(201, 203, 207, 0.5)', title: 'Pienhiukkaset 2.5' },
        voc: { label: 'VOC-indeksi', unit: '', color: 'rgba(255, 159, 64, 1)', bgColor: 'rgba(255, 159, 64, 0.5)', title: 'Haihtuvien orgaanisten yhdisteiden indeksi' },
        nox: { label: 'NOx-indeksi', unit: '', color: 'rgba(153, 102, 255, 1)', bgColor: 'rgba(153, 102, 255, 0.5)', title: 'Typen oksidien indeksi' },
    };
    return configs[metricType];
};

// Get color based on temperature value
const getTemperatureColor = (temp: number | null): string => {
    if (temp === null) return 'rgba(128, 128, 128, 1)'; // Gray for null
    
    // Color scale:
    // < -10°C: Dark blue (0, 0, 139)
    // -10 to 0°C: Blue gradient to light blue
    // 0°C: Light blue (135, 206, 250)
    // 0 to 15°C: Light blue to yellow
    // 15 to 25°C: Yellow to orange
    // > 25°C: Orange to red
    
    if (temp < -10) {
        return 'rgb(0, 0, 139)'; // Dark blue
    } else if (temp < 0) {
        // Dark blue to light blue
        const ratio = (temp + 10) / 10;
        const r = Math.round(0 + ratio * 135);
        const g = Math.round(0 + ratio * 206);
        const b = Math.round(139 + ratio * 111);
        return `rgb(${r}, ${g}, ${b})`;
    } else if (temp < 15) {
        // Light blue to yellow
        const ratio = temp / 15;
        const r = Math.round(135 + ratio * 120);
        const g = Math.round(206 + ratio * 49);
        const b = Math.round(250 - ratio * 250);
        return `rgb(${r}, ${g}, ${b})`;
    } else if (temp < 25) {
        // Yellow to orange
        const ratio = (temp - 15) / 10;
        const r = 255;
        const g = Math.round(255 - ratio * 90);
        const b = 0;
        return `rgb(${r}, ${g}, ${b})`;
    } else {
        // Orange to red
        const ratio = Math.min((temp - 25) / 10, 1);
        const r = 255;
        const g = Math.round(165 - ratio * 165);
        const b = 0;
        return `rgb(${r}, ${g}, ${b})`;
    }
};

export default function RuuviChart({ ruuviResponse, metricType, startDate, endDate, isLoading, style, onDateRangeChange }: RuuviChartProps) {
    // All hooks must be at the top, before any conditional returns
    const chartRef = useRef<ChartJS<'line'>>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<number | null>(null);

    const data = ruuviResponse?.measurements ?? [];

    // Mouse event handlers for selection - defined before conditional returns
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!chartRef.current || !onDateRangeChange) return;

        const chart = chartRef.current;
        const rect = chart.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        setIsSelecting(true);
        setSelectionStart(x);
        setSelection(null);
    }, [onDateRangeChange]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!isSelecting || selectionStart === null || !chartRef.current) return;

        const chart = chartRef.current;
        const rect = chart.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        setSelection({ start: selectionStart, end: x });
    }, [isSelecting, selectionStart]);

    const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!isSelecting || selectionStart === null || !chartRef.current || !onDateRangeChange) return;

        const chart = chartRef.current;
        const rect = chart.canvas.getBoundingClientRect();
        const xScale = chart.scales.x;

        if (!xScale) return;

        const endX = e.clientX - rect.left;

        // Convert pixel coordinates to data indices
        const startIndex = Math.round(xScale.getValueForPixel(Math.min(selectionStart, endX)) ?? 0);
        const endIndex = Math.round(xScale.getValueForPixel(Math.max(selectionStart, endX)) ?? data.length - 1);

        if (startIndex >= 0 && endIndex < data.length && startIndex !== endIndex) {
            const newStartDate = data[startIndex]?.time;
            const newEndDate = data[endIndex]?.time;

            if (newStartDate && newEndDate) {
                onDateRangeChange(newStartDate, newEndDate);
            }
        }

        setIsSelecting(false);
        setSelectionStart(null);
        setSelection(null);
    }, [isSelecting, selectionStart, onDateRangeChange, data]);

    const handleMouseLeave = useCallback(() => {
        if (isSelecting) {
            setIsSelecting(false);
            setSelectionStart(null);
            setSelection(null);
        }
    }, [isSelecting]);

    // Now conditional returns come after all hooks
    if (isLoading) {
        return <SkeletonBarChart />
    }
    if (!ruuviResponse) return null;

    const timePeriod = ruuviResponse.timePeriod;
    const metricConfig = getMetricConfig(metricType);

    const title = (tooltipItems: TooltipItem<'line'>[]) => {
        const tooltipItem = tooltipItems[0];
        const row = data[tooltipItem?.dataIndex ?? 0];
        if (!row) return '';

        const date = dayjs(row.time)
        switch (timePeriod) {
            case TimePeriod.PT15M:
            case TimePeriod.PT5M:
                return `${date.format('DD.MM.YYYY HH:mm')}`;
            case TimePeriod.PT1H:
            default:
                return `${date.format('DD.MM.YYYY HH:mm')} - ${date.add(1, 'hour').format('HH:mm')}`;
            case TimePeriod.P1D:
                return `${date.format('DD.MM.YYYY - dddd')}`;
            case TimePeriod.P1M:
                return `${date.format('YYYY - MMMM')}`;
            case TimePeriod.P1Y:
                return `${date.format('YYYY')}`;
        }
    }

    const { labels, values, bgColor, borderColor, pointColors, stepSize, min, max } = mapper({ data, timePeriod, metricType });

    // Calculate point radius based on number of data points
    const dataPointCount = values.length;
    const pointRadius = dataPointCount > 96 ? 0 : dataPointCount > 48 ? 1 : dataPointCount > 24 ? 2 : 3;
    const pointHoverRadius = pointRadius === 0 ? 3 : pointRadius + 2;

    let graphTitle = `${metricConfig.title} (${dayjs(startDate).format('DD.MM.YYYY')} - ${dayjs(endDate).format('DD.MM.YYYY')})`
    switch (timePeriod) {
        case TimePeriod.P1D:
            graphTitle = `${metricConfig.title} - (${dayjs(startDate).format('MMMM YYYY')} - ${dayjs(endDate).format('MMMM YYYY')})`
            break;
        case TimePeriod.P1M:
            graphTitle = `${metricConfig.title} - (${dayjs(startDate).format('YYYY')} - ${dayjs(endDate).format('YYYY')})`
            break;
        case TimePeriod.P1Y:
            graphTitle = `${metricConfig.title} - (${dayjs(startDate).format('YYYY')} - ${dayjs(endDate).format('YYYY')})`
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
                    boxWidth: 20,
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
                    label: (context: TooltipItem<'line'>) => {
                        const value = context.parsed.y;
                        return `${metricConfig.label}: ${value !== null ? value.toFixed(2) : 'N/A'} ${metricConfig.unit}`;
                    }
                }
            },
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Aika'
                }
            },
            y: {
                title: {
                    display: true,
                    text: `${metricConfig.label} (${metricConfig.unit})`,
                },
                min: min,
                max: max,
                ticks: {
                    stepSize: stepSize,
                    callback: function(value) {
                        return value;
                    },
                },
                beginAtZero: false,
            },
        },
    } as ChartOptions<'line'>;

    const mappedData = {
        labels,
        datasets: [
            {
                label: `${metricConfig.label} ${metricConfig.unit}`,
                data: values,
                backgroundColor: bgColor,
                borderColor: pointColors ? (ctx: any) => {
                    // Use point colors for line segments when temperature
                    const index = ctx.p0DataIndex;
                    return pointColors[index] || borderColor;
                } : borderColor,
                borderWidth: 2,
                tension: 0.1,
                fill: false,
                pointRadius: pointRadius,
                pointHoverRadius: pointHoverRadius,
                pointBackgroundColor: pointColors || borderColor,
                pointBorderColor: pointColors || borderColor,
                segment: pointColors ? {
                    borderColor: (ctx: any) => {
                        // Color each segment based on the starting point's color
                        const index = ctx.p0DataIndex;
                        return pointColors[index] || borderColor;
                    }
                } : undefined,
            }
        ],
    } as ChartData<'line'>;

    return (
        <div className='text-center'>
            {/* {onDateRangeChange && (
                <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                    💡 Vedä ja valitse aikaväli kartalla
                </div>
            )} */}
            <div
                ref={containerRef}
                id="canvas-container"
                style={{ height: '40vh', width: 'calc(100vw - (2 * 16px))', position: 'relative', cursor: isSelecting ? 'crosshair' : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                <Line
                    ref={chartRef}
                    style={style}
                    options={options}
                    data={mappedData}
                />
                {selection && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: Math.min(selection.start, selection.end),
                            width: Math.abs(selection.end - selection.start),
                            height: '100%',
                            backgroundColor: 'rgba(0, 123, 255, 0.2)',
                            border: '2px solid rgba(0, 123, 255, 0.5)',
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </div>
        </div>
    )
}

const mapper = ({ data, timePeriod, metricType }: { data: IRuuviMeasurement[], timePeriod: TimePeriod, metricType: RuuviMetricType }) => {
    if (!data?.length) return {
        labels: [],
        values: [],
        bgColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        pointColors: [],
        stepSize: 1,
        min: 0,
        max: 10,
    }

    const labels: string[] = []
    const values: DefaultDataPoint<'line'> = []
    const pointColors: string[] = []
    const metricConfig = getMetricConfig(metricType);

    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    // Check if data spans multiple days/months/years for smart label formatting
    const firstDate = dayjs(data[0]?.time);
    const lastDate = dayjs(data[data.length - 1]?.time);
    const spansMultipleDays = !firstDate.isSame(lastDate, 'day');
    const spansMultipleMonths = !firstDate.isSame(lastDate, 'month');
    const spansMultipleYears = !firstDate.isSame(lastDate, 'year');

    data.forEach(row => {
        let value: number | null = null;

        // Extract the value based on metric type
        switch (metricType) {
            case 'temperature':
                value = row.temperature ?? null;
                break;
            case 'humidity':
                value = row.humidity ?? null;
                break;
            case 'pressure':
                value = row.pressure ?? null;
                break;
            case 'movementCount':
                value = row.movement_counter ?? null;
                break;
            case 'airQuality':
                // Air quality is derived from multiple factors
                value = getIAQSByValues(row.co2, row.pm2_5);
                break;
            case 'co2':
                value = row.co2 ?? null;
                break;
            case 'pm2_5':
                value = row.pm2_5 ?? null;
                break;
            case 'voc':
                value = row.voc ?? null;
                break;
            case 'nox':
                value = row.nox ?? null;
                break;
        }

        values.push(value);
        
        // Add color for temperature metric
        if (metricType === 'temperature') {
            pointColors.push(getTemperatureColor(value));
        }

        if (value !== null) {
            min = Math.min(min, value);
            max = Math.max(max, value);
        }

        const parsedTime = dayjs(row.time)
        switch (timePeriod) {
            case TimePeriod.PT15M:
            case TimePeriod.PT5M: {
                // Show date if spanning multiple days
                if (spansMultipleDays) {
                    labels.push(parsedTime.format('DD.MM HH:mm'));
                } else {
                    labels.push(parsedTime.format('HH:mm'));
                }
                break;
            }
            case TimePeriod.PT1H: {
                // Show date if spanning multiple days
                if (spansMultipleDays) {
                    labels.push(parsedTime.format('DD.MM HH:00'));
                } else {
                    labels.push(parsedTime.hour().toString().padStart(2, '0'));
                }
                break;
            }
            case TimePeriod.P1D: {
                // Show month if spanning multiple months
                if (spansMultipleMonths) {
                    labels.push(parsedTime.format('DD.MM'));
                } else {
                    labels.push(parsedTime.format('DD'));
                }
                break;
            }
            case TimePeriod.P1M: {
                // Show year if spanning multiple years
                if (spansMultipleYears) {
                    labels.push(parsedTime.format('MMM YY'));
                } else {
                    labels.push(parsedTime.format('MMM'));
                }
                break;
            }
            case TimePeriod.P1Y: {
                labels.push(parsedTime.format('YYYY'))
                break;
            }
        }
    });

    // Set reasonable defaults if no data found
    if (min === Number.MAX_VALUE) min = 0;
    if (max === Number.MIN_VALUE) max = 10;

    // Add some padding to min/max
    const padding = (max - min) * 0.1;
    let paddedMin = min - padding;
    let paddedMax = max + padding;
    
    // Determine appropriate step size based on range
    const range = paddedMax - paddedMin;
    let stepSize;
    
    if (range > 100) {
        stepSize = 10;
    } else if (range > 50) {
        stepSize = 5;
    } else if (range > 20) {
        stepSize = 2;
    } else if (range > 10) {
        stepSize = 1;
    } else if (range > 5) {
        stepSize = 1;
    } else {
        stepSize = 1;
    }
    
    // Round min DOWN to nearest multiple of stepSize, max UP to nearest multiple
    min = Math.floor(paddedMin / stepSize) * stepSize;
    max = Math.ceil(paddedMax / stepSize) * stepSize;

    return {
        labels,
        values,
        bgColor: metricConfig.bgColor,
        borderColor: metricConfig.color,
        pointColors: pointColors.length > 0 ? pointColors : undefined,
        stepSize,
        min,
        max,
    }
}
