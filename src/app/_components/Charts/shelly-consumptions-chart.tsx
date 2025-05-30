// 'use client';
// import React, { type CSSProperties } from 'react';
// import {
//     Chart as ChartJS,
//     CategoryScale,
//     LinearScale,
//     BarElement,
//     Title,
//     Tooltip,
//     Legend,
//     type ChartType,
//     type TooltipPositionerFunction,
//     type ActiveElement,
//     type ChartOptions,
//     type ChartData,
//     type DefaultDataPoint,
//     type TooltipItem,
// } from 'chart.js';
// import { Bar } from 'react-chartjs-2';
// import dayjs, { type Dayjs } from "dayjs";
// import { type ShellyConsumptionResponse, type ShellyConsumption } from '@energyapp/shared/interfaces';
// import { TimePeriod } from '@energyapp/shared/enums';
// import { SkeletonBarChart } from '@energyapp/app/_components/Skeletons/bar-chart-skeleton';

// ChartJS.register(
//     CategoryScale,
//     LinearScale,
//     BarElement,
//     Title,
//     Tooltip,
//     Legend
// );

// declare module 'chart.js' {
//     // Extend tooltip positioner map
//     interface TooltipPositionerMap {
//         top: TooltipPositionerFunction<ChartType>;
//     }
// }

// // Create a custom tooltip positioner to put at the bottom of the chart area
// Tooltip.positioners.top = function (items: readonly ActiveElement[]) {
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-expect-error
//     const pos = Tooltip.positioners.average(items);

//     // Happens when nothing is found
//     if (pos === false) {
//         return false;
//     }

//     const chart = this.chart;

//     return {
//         x: pos.x,
//         y: chart.chartArea.top + 65,
//         xAlign: 'center',
//         yAlign: 'bottom',
//     };
// };

// interface ShellyConsumptionChartProps {
//     response?: ShellyConsumptionResponse
//     startDate: Dayjs
//     endDate: Dayjs
//     isLoading?: boolean
//     style?: CSSProperties
// }

// export default function ShellyConsumptionsChart({ response, startDate, endDate, isLoading, style }: ShellyConsumptionChartProps) {
//     if (isLoading) {
//         return <SkeletonBarChart />
//     }
//     if (!response) return null;

//     const timePeriod = response.timePeriod;
//     const data = response.consumptions;

//     const title = (tooltipItems: TooltipItem<'bar'>[]) => {
//         const tooltipItem = tooltipItems[0];
//         const row = data[tooltipItem?.dataIndex ?? 0];
//         if (!row) return '';

//         const date = dayjs(row.time)
//         switch (timePeriod) {
//             case TimePeriod.PT15M:
//                 return `${date.format('HH:mm')}`;
//             case TimePeriod.PT1H:
//             default:
//                 return `${date.hour()}:00 - ${date.hour()}:59`;
//             case TimePeriod.P1D:
//                 return `${date.format('DD.MM.YYYY - dddd')}`;
//             case TimePeriod.P1M:
//                 return `${date.format('YYYY - MMMM')}`;
//             case TimePeriod.P1Y:
//                 return `${date.format('YYYY')}`;
//         }
//     }

//     const { labels, consumptions, totalPrices, bgColors1, bgColors2, min, max } = mapper({ data, timePeriod });

//     let graphTitle = `Kulutukset ${dayjs(startDate).format('DD.MM.YYYY')}`
//     switch (timePeriod) {
//         case TimePeriod.P1D:
//             graphTitle = `Kulutukset - ${dayjs(startDate).format('MMMM YYYY')}`
//             break;
//         case TimePeriod.P1M:
//             graphTitle = `Kulutukset - ${dayjs(startDate).format('YYYY')}`
//             break;
//         case TimePeriod.P1Y:
//             graphTitle = `Kulutukset - (${dayjs(startDate).format('YYYY')} - ${dayjs(endDate).format('YYYY')})`
//             break;
//     }

//     const options = {
//         locale: 'fi-FI',
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//             legend: {
//                 position: 'top',
//                 display: true,
//                 labels: {
//                     boxWidth: 0,
//                 }
//             },
//             title: {
//                 display: true,
//                 text: graphTitle,
//             },
//             tooltip: {
//                 position: 'top',
//                 callbacks: {
//                     title: title,
//                 }
//             },
//         },
//         interaction: {
//             mode: 'index',
//             intersect: false,
//         },
//         scales: {
//             x: {
//                 // stacked: true,
//             },
//             y: {
//                 // stacked: true,
//                 min: min,
//                 max: max,
//             },
//         },
//     } as ChartOptions<'bar'>;

//     const mappedData = {
//         labels,
//         datasets: [
//             {
//                 label: 'Kulutus (kWh)',
//                 data: consumptions,
//                 backgroundColor: bgColors1,
//             },
//             {
//                 label: 'Hinta (€)',
//                 data: totalPrices,
//                 backgroundColor: bgColors2,
//             }
//         ],
//     } as ChartData<'bar'>;

//     return (
//         <div className='text-center'>
//             {/* <div className="text-sm mb-3 mt-3">{deviceName} {fromDate.format('DD.MM.YYYY')} - {toDate.format('DD.MM.YYYY')}</div> */}
//             <div id="canvas-container" style={{ height: '40vh', width: 'calc(100vw - (2 * 16px))', position: 'relative' }}>
//                 <Bar
//                     style={style}
//                     options={options}
//                     data={mappedData}
//                 />
//             </div>
//         </div>
//     )
// }

// const mapper = ({ data, timePeriod }: { data: ShellyConsumption[], timePeriod: TimePeriod }) => {
//     if (!data?.length) return {
//         labels: [],
//         values: [],
//         prices: [],
//     }

//     const labels: string[] = []
//     const consumptions: DefaultDataPoint<'bar'> = []
//     const totalPrices: DefaultDataPoint<'bar'> = []
//     const bgColors1: string[] = []
//     const bgColors2: string[] = []

//     let min = 0
//     let max = timePeriod === TimePeriod.PT15M ? 2 : 10

//     data.map(row => {
//         const consumption = row.energy_consumption
//         const totalPrice = row.price / 100

//         consumptions.push(parseFloat(consumption.toFixed(2)))
//         totalPrices.push(parseFloat(totalPrice.toFixed(2)))

//         const parsedTime = dayjs(row.time)
//         switch (timePeriod) {
//             case TimePeriod.PT15M: {
//                 labels.push(`${dayjs(row.time).format('HH:mm')}`)
//                 break;
//             }
//             case TimePeriod.PT1H: {
//                 labels.push(`${dayjs(row.time).hour().toString().padStart(2, '0')}`)
//                 break;
//             }
//             case TimePeriod.P1D: {
//                 labels.push(parsedTime.format('DD'))
//                 break;
//             }
//             case TimePeriod.P1M: {
//                 labels.push(parsedTime.format('MMM'))
//                 break;
//             }
//             case TimePeriod.P1Y: {
//                 labels.push(parsedTime.format('YYYY'))
//                 break;
//             }
//         }

//         bgColors1.push('green')
//         bgColors2.push('red')
//         // bgColors2.push(totalPrice < 15 ? 'green' : totalPrice < 20 ? 'yellow' : totalPrice < 30 ? 'orange' : 'red')

//         min = Math.min(min, consumption)
//         min = Math.min(min, totalPrice)

//         max = Math.max(max, consumption)
//         max = Math.max(max, totalPrice)
//     });

//     return {
//         labels,
//         consumptions,
//         totalPrices,
//         bgColors1,
//         bgColors2,
//         min: Math.floor(min),
//         max: Math.ceil(max),
//     }
// }
