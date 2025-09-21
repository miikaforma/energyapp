import dayjs from "dayjs";
import { Line } from "react-chartjs-2";
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
  // type Point,
} from "chart.js";
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm";
import annotationPlugin from "chartjs-plugin-annotation";
// import { formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
// import { Col, Row, Statistic } from "antd";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import { useState } from "react";
import { displayFuelType } from "@energyapp/utils/valueHelpers";
import type { PriceHistory } from "@energyapp/server/api/routers/tankille";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  annotationPlugin,
);

type TankillePriceHistoryProps = {
  priceHistory?: PriceHistory[];
  fuelType: string;
  isLoading?: boolean;
};

export default function TankillePriceHistory({
  priceHistory,
  fuelType,
  isLoading,
}: TankillePriceHistoryProps) {
  if (isLoading) {
    return <p>Ladataan...</p>;
  }

  if (!priceHistory || priceHistory.length === 0) {
    return <p style={{ color: "grey" }}>Historiatietoja ei löytynyt</p>;
  }

  const filteredPriceHistory = priceHistory.filter(
    (item) => item.fuel === fuelType,
  );

  if (filteredPriceHistory.length === 0) {
    return (
      <p style={{ color: "grey" }}>Ei hintatietoja valitulle polttoaineelle</p>
    );
  }
  console.log("priceHistory", filteredPriceHistory);

  const groupedPriceHistory = filteredPriceHistory.reduce<
    Record<string, typeof filteredPriceHistory>
  >((acc, item) => {
    const stationId = item.station_id;
    if (!acc[stationId]) {
      acc[stationId] = [];
    }
    acc[stationId].push(item);
    return acc;
  }, {});

  console.log("groupedPriceHistory", groupedPriceHistory);

  const generateRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const dataSets = Object.entries(groupedPriceHistory).map(([, items]) => {
    return mapEventsToData(
      items,
      items[0]?.tankille_gas_stations?.name ?? "Tuntematon",
      generateRandomColor(),
      false,
      true,
    );
  });

  //   const cheapest = getCheapestWeekday(priceHistory);
  //   console.log(
  //     `The cheapest weekday is ${
  //       cheapest.weekday
  //     } with an average price of ${cheapest.avgPrice.toFixed(2)} €`,
  //   );

  const mappedData = {
    labels: [], // generate the labels
    datasets: dataSets,
  };

  //   const minYPoint = hourlyForecast?.reduce((minPoint, point) =>
  //     point.value < minPoint.value ? point : minPoint,
  //   );
  //   const maxYPoint = hourlyForecast?.reduce((maxPoint, point) =>
  //     point.value > maxPoint.value ? point : maxPoint,
  //   );

  const timeRange = Math.abs(
    new Date(
      filteredPriceHistory[filteredPriceHistory.length - 1]?.time ??
        new Date(0),
    ).getTime() - new Date(filteredPriceHistory[0]?.time ?? 0).getTime(),
  );

  let timeUnit: "minute" | "hour" | "day" = "minute";

  if (timeRange > 7 * 24 * 60 * 60 * 1000) {
    // More than 7 days
    timeUnit = "day";
  } else if (timeRange > 24 * 60 * 60 * 1000) {
    // More than 1 day
    timeUnit = "hour";
  }

  const options = {
    locale: "fi-FI",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
      },
      title: {
        display: true,
        text: `Polttoaineen hintahistoria - ${dayjs().format(
          "DD.MM.YYYY HH:mm",
        )}`,
      },
      // annotation: {
      //     annotations
      // },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: timeUnit, // or 'hour', 'minute', 'second'  depending on your needs
        },
      },
      y: {
        ticks: {
          // Include a sign in the ticks
          callback: function (value, _index, _values) {
            return value + " €";
          },
        },
        //   min: 0,
        //   suggestedMax: 2.5,
      },
    },
    elements: {
      point: {
        radius: 0.5,
      },
    },
    tooltips: {
      enabled: true,
    },
    interaction: {
      mode: "x",
      intersect: false,
    },
  } as ChartOptions<"line">;

  return (
    <div className="text-center">
      <div
        id="canvas-container"
        style={{
          height: "30vh",
          width: "calc(100vw - (2 * 16px))",
          position: "relative",
        }}
      >
        <Line options={options} data={mappedData} />
      </div>
      {/* <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="Pienin tuotanto"
              value={minYPoint.value}
              suffix="MW"
              prefix={<WindPowerIcon />}
              valueStyle={{ color: getProductionColor(minYPoint.value) }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Suurin tuotanto"
              value={maxYPoint.value}
              precision={2}
              suffix="MW"
              prefix={<AirIcon />}
              valueStyle={{ color: getProductionColor(maxYPoint.value) }}
            />
          </Col>
        </Row> */}
    </div>
  );
}

const mapEventsToData = (
  events: PriceHistory[],
  label: string,
  color: string,
  fill = false,
  dashed = false,
  hidden = false,
) => {
  const dataset = {
    label: label,
    data: [],
    fill: fill,
    borderColor: color,
    backgroundColor: "rgba(0,93,255, 0.2)",
    tension: 0.2,
    hidden: hidden,
    borderDash: dashed ? [5, 5] : [],
  } as ChartDataset<"line">;

  events
    .sort((a, b) => {
      const dateA = a.time ? new Date(a.time) : null;
      const dateB = b.time ? new Date(b.time) : null;
      if (dateA && dateB) {
        return dateA.getTime() - dateB.getTime();
      }
      return 0;
    })
    .forEach((event) => {
      if (event.time) {
        dataset.data.push({
          x: new Date(event.time).getTime(),
          y: Number(event.price),
        });
      }
    });

  return dataset;
};
