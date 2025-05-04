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
  ReturnType<typeof api.shelly.getDevicesWithInfo.query>
>[number];
type GroupedDevices = Record<string, Device[]>;

const totalConsumption = (devices: Device[]) => {
  return devices.reduce((total, device) => {
    const latestData = device.latestData;
    if (latestData) {
      return total + (latestData.aenergy ?? 0);
    }
    return total;
  }, 0);
};

export default function ShellyGroupList({
  groupedDevices,
}: {
  groupedDevices: GroupedDevices;
}) {
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
      {Object.entries(groupedDevices).map(([groupKey, devices]) => (
        <Card key={groupKey} sx={{ minWidth: 290 }}>
          <CardActionArea
            onClick={() => router.push(`/consumptions/shelly/group/${groupKey}`)}
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
                {groupKey}
              </Typography>
              {devices.map((device) => (
                <Box key={`${groupKey}-${device.accessId}`} sx={{ mb: 1 }}>
                  <Typography
                    gutterBottom
                    sx={{ color: "text.secondary", fontSize: 13 }}
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
                      <Chip
                        icon={<BoltIcon />}
                        label={convertWatts(device.latestData?.apower ?? 0)}
                        variant="outlined"
                      />
                      <Chip
                        icon={<OfflineBoltIcon />}
                        label={convertVoltage(device.latestData?.voltage ?? 0)}
                        variant="outlined"
                      />
                      <Chip
                        icon={<DeviceThermostatIcon />}
                        label={getTemperatureC(
                          device.latestData?.temperature_c ?? 0,
                        )}
                        variant="outlined"
                      />
                    </Stack>
                  </Typography>
                </Box>
              ))}
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
                <Typography
                  gutterBottom
                  sx={{ color: "text.secondary", fontSize: 14 }}
                >
                  Kokonaiskulutus
                </Typography>
                <Chip
                  icon={<BoltIcon />}
                  label={convertWatts(totalConsumption(devices))}
                  variant="outlined"
                />
                <span style={{ fontStyle: 'italic', color: "gray", whiteSpace: 'nowrap', fontSize: 12 }}><RelativeTime timestamp={dayjs(devices[0]?.latestData?.time)}></RelativeTime></span>
              </Stack>
            </Box>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
}
