import type { PriceHistory } from "@energyapp/server/api/routers/tankille";
import { getWeeklyData } from "@energyapp/utils/tankilleHelpers";
import { formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
import { Table } from "antd";

export default function TankillePriceTable({
  priceHistory,
  fuelType,
  isLoading,
}: {
  priceHistory?: PriceHistory[];
  fuelType: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return <p>Ladataan...</p>;
  }

  if (!priceHistory || priceHistory.length === 0) {
    return <p>Ei saatavilla</p>;
  }

  const filteredPriceHistory = priceHistory.filter(
    (item) => item.fuel === fuelType,
  );

  const tableData = getWeeklyData(filteredPriceHistory);

  // Define columns for the table
  const columns = [
    {
      title: "Week",
      dataIndex: "week",
      key: "week",
    },
    ...[
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ].map((day, index) => ({
      title: day,
      dataIndex: `day${index}`,
      key: `day${index}`,
      render: (value, record) => {
        // Highlight the cheapest price for the week
        const isCheapest = record.cheapestDay === `day${index}`;
        return (
          <span
            style={{
              color: isCheapest ? "green" : "inherit",
              fontWeight: isCheapest ? "bold" : "normal",
            }}
          >
            {value !== null ? `${formatNumberToFI(value, 3, 3)} €` : "-"}
          </span>
        );
      },
    })),
  ];

  return <Table dataSource={tableData} columns={columns} pagination={false} />;
}
