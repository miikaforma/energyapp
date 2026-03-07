"use client";

import {
  Box,
} from "@mui/material";
import { type api } from "@energyapp/trpc/server";
import RuuviTagDevice from "./device-ruuvitag";
import RuuviAirDevice from "./device-ruuviair";

type Device = Awaited<
  ReturnType<typeof api.ruuvi.getDevicesWithInfo.query>
>[number];

export default function RuuviDeviceList({ devices }: { devices: Device[] }) {
  const ruuviTagDevices = devices.filter((device) => device.latestData?.data_format === '5');
  const ruuviAirDevices = devices.filter((device) => device.latestData?.data_format === 'E1');

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
          gap: 2,
        }}
      >
        {ruuviTagDevices.map((device) =>
          <RuuviTagDevice key={device.accessId} device={device} />
        )}
      </Box>
      <Box
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
          gap: 2,
        }}
      >
        {ruuviAirDevices.map((device) =>
          <RuuviAirDevice key={device.accessId} device={device} />
        )}
      </Box>
    </Box>
  );

  // return (
  //   <Box
  //     sx={{
  //       width: "100%",
  //       display: "grid",
  //       gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
  //       gap: 2,
  //     }}
  //   >
  //     {devices.map((device) => {
  //       if (device.latestData?.data_format == '5') {
  //         return <RuuviTagDevice key={device.accessId} device={device} />;
  //       }
  //       if (device.latestData?.data_format == 'E1') {
  //         return <RuuviAirDevice key={device.accessId} device={device} />;
  //       }
  //       return null;
  //     })}
  //   </Box>
  // );
}
