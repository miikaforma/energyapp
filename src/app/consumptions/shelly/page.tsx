'use client'
import { type api } from "@energyapp/trpc/server";

import { Typography } from "@mui/material";
import ShellyGroupList from "@energyapp/app/_components/Shelly/group-list";
import ShellyDeviceList from "@energyapp/app/_components/Shelly/device-list";
import useGetShellyDevicesWithInfo from "@energyapp/app/_hooks/queries/shelly/useGetShellyDevicesWithInfo";
import useGetShellyGroups from "@energyapp/app/_hooks/queries/shelly/useGetShellyGroups";

type DeviceGroup = Awaited<
  ReturnType<typeof api.shelly.getGroups.query>
>[number];
type Device = Awaited<
  ReturnType<typeof api.shelly.getDevicesWithInfo.query>
>[number];
type GroupedDevices = Record<string, Device[]>;

export default function Shelly() {
  const { data: devices } = useGetShellyDevicesWithInfo();
  const { data: groups } = useGetShellyGroups();
  // console.log("devices", devices);

  if (!devices) {
    return (
      <div className="text-center text-2xl font-bold text-white">
        Ladataan laitteita...
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="text-center text-2xl font-bold text-white">
        Ei laitteita
      </div>
    );
  }

  const groupDeviceMap = new Map<DeviceGroup, Device[]>();
  groups?.forEach((group) => {
    const devicesInGroup = devices.filter((device) => {
      return group.devices.some((groupDevice) => groupDevice.accessId === device.accessId);
    });
    groupDeviceMap.set(group, devicesInGroup);
  });

  return (
    <>
      {groupDeviceMap && groupDeviceMap.size > 0 ? (
        <>
          <Typography variant="h6" gutterBottom>
            Ryhmät
          </Typography>
          <ShellyGroupList groupedDevices={groupDeviceMap} />
        </>
      ) : null}
      <Typography variant="h6" gutterBottom>
        Shelly laitteet
      </Typography>
      <ShellyDeviceList devices={devices} />
    </>
  );
}
