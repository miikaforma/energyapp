"use client";

import {
  Box,
} from "@mui/material";
import { type api } from "@energyapp/trpc/server";
import ShellyGroup from "./group";

type DeviceGroup = Awaited<
  ReturnType<typeof api.shelly.getGroups.query>
>[number];
type Device = Awaited<
  ReturnType<typeof api.shelly.getDevicesWithInfo.query>
>[number];
type GroupedDevices = Map<DeviceGroup, Device[]>;

export default function ShellyGroupList({
  groupedDevices,
}: {
  groupedDevices: GroupedDevices;
}) {
  return (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
        gap: 2,
      }}
    >
      {Array.from(groupedDevices.entries()).map(([group, devices]) => (
        <ShellyGroup key={group.id} group={group} devices={devices} />
      ))}
    </Box>
  )
}
