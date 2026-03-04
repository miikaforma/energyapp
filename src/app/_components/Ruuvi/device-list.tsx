"use client";

import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { type api } from "@energyapp/trpc/server";
import RelativeTime from "../Helpers/relative-time";
import dayjs from "dayjs";
import { formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
import { getAirPressureString, getHumidityString, getPictureUrl } from "@energyapp/utils/ruuviHelpers";
import DeviceImage from "./device-image";

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
        gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
        gap: 2,
      }}
    >
      {devices.map((device) => (
        <Card key={device.accessId} sx={{ minWidth: 320, display: 'flex' }}>
          <DeviceImage imageUrl={getPictureUrl(device.serviceAccess.customData)} alt="Ruuvi Device" />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ pl: '1rem', pb: 0 }}>
              <Typography
                gutterBottom
                sx={{ color: "text.secondary", fontSize: 16, fontWeight: "bold" }}
                justifyContent="flex-start"
                alignItems="center"
                display="flex"
              >
                {device.serviceAccess.accessName}
              </Typography>
            </CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', pl: '1rem', pb: 1 }}>
              <Grid container spacing={3} columns={2}>
                <Grid size={1}>
                  <Typography
                    sx={{ color: "text.secondary", fontSize: "38px", fontWeight: "bold" }}
                    justifyContent="flex-start"
                    alignItems="center"
                    display="flex"
                    component="div"
                  >
                    {formatNumberToFI(device.latestData?.temperature ?? 0)}
                  </Typography>
                </Grid>
                <Grid size={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Stack spacing={0}>
                    <Typography
                      sx={{ color: "text.secondary", fontSize: "14px" }}
                      justifyContent="flex-start"
                      alignItems="center"
                      display="flex"
                      component="div"
                    >
                      °C
                    </Typography>
                    <Typography
                      sx={{ color: "text.secondary", fontSize: "14px" }}
                      justifyContent="flex-start"
                      alignItems="center"
                      display="flex"
                      component="div"
                    >
                      Lämpötila
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', pl: '1rem', pb: 1 }}>
              <Grid container spacing={3} columns={2}>
                <Grid size={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Stack spacing={0}>
                    <Typography
                      sx={{ color: "text.secondary", fontSize: "16px", fontWeight: "bold" }}
                      justifyContent="flex-start"
                      alignItems="center"
                      display="flex"
                      component="div"
                    >
                      {getHumidityString(device.latestData?.humidity)}
                    </Typography>
                    <Typography
                      sx={{ color: "text.secondary", fontSize: "12px" }}
                      justifyContent="flex-start"
                      alignItems="center"
                      display="flex"
                      component="div"
                    >
                      Suht.&nbsp;ilmankosteus
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Stack spacing={0}>
                    <Typography
                      sx={{ color: "text.secondary", fontSize: "16px", fontWeight: "bold" }}
                      justifyContent="flex-start"
                      alignItems="center"
                      display="flex"
                      component="div"
                    >
                      {getAirPressureString(device.latestData?.pressure)}
                    </Typography>
                    <Typography
                      sx={{ color: "text.secondary", fontSize: "12px" }}
                      justifyContent="flex-start"
                      alignItems="center"
                      display="flex"
                      component="div"
                    >
                      Ilmanpaine
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', pl: '1rem', pb: 1 }}>
              <span style={{ fontStyle: 'italic', color: "gray", whiteSpace: 'nowrap', fontSize: 12 }}><RelativeTime timestamp={dayjs(device?.latestData?.time)}></RelativeTime></span>
            </Box>
          </Box>
        </Card>
      ))}
    </Box>
  );
}
