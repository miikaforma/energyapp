"use client";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
// import { useRouter } from "next/navigation";
import { type api } from "@energyapp/trpc/server";
import { Col, Descriptions, Row, Tooltip } from "antd";
import type { DescriptionsProps } from "antd";
import { displayFuelType } from "@energyapp/utils/valueHelpers";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import { formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EuroIcon from "@mui/icons-material/Euro";
import RelativeTime from "../Helpers/relative-time";
import dayjs from "dayjs";

type Stations = Awaited<
  ReturnType<typeof api.tankille.getStations.query>
>[number];

export default function TankilleStationList({
  stations,
  loadingStations,
}: {
  stations?: Stations[];
  loadingStations?: boolean;
}) {
  // const router = useRouter();

  if (loadingStations) {
    return (
      <div className="text-center text-2xl font-bold text-white">
        Ladataan asemia...
      </div>
    );
  }

  if (!stations || stations?.length === 0) {
    return (
      <div className="text-center text-2xl font-bold text-white">Ei asemia</div>
    );
  }

  const fuelStats = (fuels: Stations["fuels"]) => {
    const items: DescriptionsProps["items"] = [];

    if (fuels) {
      fuels.forEach((fuel) => {
        items.push({
          key: fuel.fuel,
          label: (
            <Chip
              icon={<LocalGasStationIcon />}
              label={displayFuelType(fuel.fuel)}
              variant="outlined"
            />
          ),
          span: 1,
          children: (
            <Row gutter={[4, 4]}>
              <Col className="gutter-row" span={24}>
                <Tooltip
                  title={
                    <>
                      <RelativeTime timestamp={fuel.time_max} />
                      <br />
                      <span style={{ fontSize: 12 }}>
                        {dayjs(fuel.time_max).format("DD.MM.YYYY HH:mm")}
                      </span>
                    </>
                  }
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="subtitle2">Korkein</Typography>
                    <Chip
                      icon={<EuroIcon fontSize="small" />}
                      color="warning"
                      label={formatNumberToFI(fuel.price_max, 3, 3)}
                      variant="outlined"
                    />
                  </Box>
                </Tooltip>
              </Col>
              <Col className="gutter-row" span={24}>
                <Tooltip
                  title={
                    <>
                      <RelativeTime timestamp={fuel.time_min} />
                      <br />
                      <span style={{ fontSize: 12 }}>
                        {dayjs(fuel.time_min).format("DD.MM.YYYY HH:mm")}
                      </span>
                    </>
                  }
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="subtitle2">Alin</Typography>
                    <Chip
                      icon={<EuroIcon fontSize="small" />}
                      color="success"
                      label={formatNumberToFI(fuel.price_min, 3, 3)}
                      variant="outlined"
                    />
                  </Box>
                </Tooltip>
              </Col>
              <Col className="gutter-row" span={24}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="subtitle2">Trend</Typography>
                  <Chip
                    icon={<TrendingUpIcon />}
                    label={formatNumberToFI(fuel.price_volatility, 3, 3)}
                    variant="outlined"
                  />
                </Box>
              </Col>
            </Row>
          ),
        });
      });
    }

    return items;
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
        gap: 2,
        alignItems: "start",
      }}
    >
      {stations.map((station) => (
        <Card
          key={station.station_id}
          sx={{
            minWidth: 320,
          }}
        >
          <CardActionArea
            // onClick={() =>
            //   router.push(`/consumptions/shelly/device/${device.accessId}`)
            // }
            sx={{
              height: "100%",
              "&[data-active]": {
                backgroundColor: "action.selected",
                "&:hover": {
                  backgroundColor: "action.selectedHover",
                },
              },
            }}
          >
            <CardContent>
              <Typography
                gutterBottom
                sx={{ color: "text.secondary", fontSize: 14 }}
                justifyContent="center"
                alignItems="center"
                display="flex"
              >
                {station.name}
              </Typography>
              <Typography
                sx={{ color: "text.secondary" }}
                justifyContent="center"
                alignItems="center"
                display="flex"
                component="div"
              >
                <Descriptions
                  title=""
                  size="small"
                  bordered
                  layout="horizontal"
                  column={1}
                  items={fuelStats(station.fuels)}
                />
              </Typography>
            </CardContent>
            {/* <Divider />
            <Box sx={{ p: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                justifyContent="center"
                alignItems="center"
                display="flex"
              >
                <Typography
                  gutterBottom
                  sx={{ color: "text.secondary", fontSize: 14 }}
                >
                  Kokonaiskulutus
                </Typography>
                <Chip
                  icon={<BoltIcon />}
                  label={convertWatts(device.latestData?.aenergy ?? 0)}
                  variant="outlined"
                />
                <span style={{ fontStyle: 'italic', color: "gray", whiteSpace: 'nowrap', fontSize: 12 }}><RelativeTime timestamp={dayjs(device?.latestData?.time)}></RelativeTime></span>
              </Stack>
            </Box> */}
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
}
