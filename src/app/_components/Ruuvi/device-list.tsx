"use client";

import {
  convertVoltage,
  convertWatts,
  getTemperatureC,
} from "@energyapp/utils/powerHelpers";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import { useRouter } from "next/navigation";
import { type api } from "@energyapp/trpc/server";
import RelativeTime from "../Helpers/relative-time";
import dayjs from "dayjs";

type Device = Awaited<
  ReturnType<typeof api.ruuvi.getDevicesWithInfo.query>
>[number];

export default function RuuviDeviceList({ devices }: { devices: Device[] }) {
  const router = useRouter();

  return (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(290px, 100%), 1fr))",
        gap: 2,
      }}
    >
      {devices.map((device) => (
        <Card key={device.accessId} sx={{ minWidth: 290 }}>
          <CardActionArea
            onClick={() =>
              router.push(`/statistics/ruuvi/device/${device.accessId}`)
            }
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
                {device.serviceAccess.accessName}
              </Typography>
              <Typography
                sx={{ color: "text.secondary" }}
                justifyContent="center"
                alignItems="center"
                display="flex"
                component="div"
              >
                <Stack direction="row" spacing={1}>
                  {/* <Chip
                    icon={<BoltIcon />}
                    label={convertWatts(device.latestData?.apower ?? 0)}
                    variant="outlined"
                  />
                  <Chip
                    icon={<OfflineBoltIcon />}
                    label={convertVoltage(device.latestData?.voltage ?? 0)}
                    variant="outlined"
                  /> */}
                  <Chip
                    icon={<DeviceThermostatIcon />}
                    label={getTemperatureC(
                      device.latestData?.temperature ?? 0,
                    )}
                    variant="outlined"
                  />
                </Stack>
              </Typography>
            </CardContent>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                justifyContent="center"
                alignItems="center"
                display="flex"
              >
                <span style={{ fontStyle: 'italic', color: "gray", whiteSpace: 'nowrap', fontSize: 12 }}><RelativeTime timestamp={dayjs(device?.latestData?.time)}></RelativeTime></span>
              </Stack>
            </Box>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
}
