"use client";

import {
  Box,
} from "@mui/material";
import { type api } from "@energyapp/trpc/server";
import ShellyDevice from "./device";

type Device = Awaited<
  ReturnType<typeof api.shelly.getDevicesWithInfo.query>
>[number];

export default function ShellyDeviceList({ devices }: { devices: Device[] }) {
  return (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
        gap: 2,
      }}
    >
      {devices.map((device) =>
        <ShellyDevice key={device.accessId} device={device} />
      )}
    </Box>
  )
}
