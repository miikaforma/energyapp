import { api } from "@energyapp/trpc/server";

import { Typography } from "@mui/material";
import ShellyGroupList from "@energyapp/app/_components/Shelly/group-list";
import ShellyDeviceList from "@energyapp/app/_components/Shelly/device-list";

type Device = Awaited<
  ReturnType<typeof api.shelly.getDevicesWithInfo.query>
>[number];
type GroupedDevices = Record<string, Device[]>;

export default async function Shelly() {
  const devices = await api.shelly.getDevicesWithInfo.query();
  // console.log("devices", devices);

  if (devices.length === 0) {
    return (
      <div className="text-center text-2xl font-bold text-white">
        No Shelly devices found.
      </div>
    );
  }

  // Filter devices with a valid groupKey and group them
  const groupedDevices = devices
    .filter((device) => {
      const groupKey = (
        device.serviceAccess.customData as { groupKey?: string }
      )?.groupKey;
      return groupKey !== undefined && groupKey !== null;
    })
    .reduce<GroupedDevices>((acc, device) => {
      const groupKey = (device.serviceAccess.customData as { groupKey: string })?.groupKey;
      if (groupKey && acc) {
        acc[groupKey] = acc[groupKey] ?? [];
        acc[groupKey]?.push(device);
      }
      return acc;
    }, {});

  console.log(groupedDevices);

  return (
    <>
      {groupedDevices && Object.keys(groupedDevices).length > 0 ? (
        <>
          <Typography variant="h6" gutterBottom>
            Ryhmät
          </Typography>
          <ShellyGroupList groupedDevices={groupedDevices} />
        </>
      ) : null}
      <Typography variant="h6" gutterBottom>
        Shelly laitteet
      </Typography>
      <ShellyDeviceList devices={devices} />
    </>
  );
}
