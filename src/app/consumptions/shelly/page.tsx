'use client'
import { type api } from "@energyapp/trpc/server";

import { Box, Button, Grid, Typography } from "@mui/material";
import ShellyGroupList from "@energyapp/app/_components/Shelly/group-list";
import ShellyDeviceList from "@energyapp/app/_components/Shelly/device-list";
import useGetShellyDevicesWithInfo from "@energyapp/app/_hooks/queries/shelly/useGetShellyDevicesWithInfo";
import useGetShellyGroups from "@energyapp/app/_hooks/queries/shelly/useGetShellyGroups";
import { useRouter } from "next/navigation";
import AddIcon from '@mui/icons-material/Add';

type DeviceGroup = Awaited<
  ReturnType<typeof api.shelly.getGroups.query>
>[number];
type Device = Awaited<
  ReturnType<typeof api.shelly.getDevicesWithInfo.query>
>[number];
type GroupedDevices = Record<string, Device[]>;

export default function Shelly() {
  const router = useRouter();
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
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Box />

        <Typography textAlign="center" variant="h6" gutterBottom>
          Ryhmät
        </Typography>

        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              router.push(`/consumptions/shelly/group/edit`);
            }}
            sx={{ whiteSpace: 'nowrap' }}
            startIcon={<AddIcon />}
          >
            Luo ryhmä
          </Button>
        </Box>
      </Box>
      {groupDeviceMap && groupDeviceMap.size > 0 ? (
        <ShellyGroupList groupedDevices={groupDeviceMap} />
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 0 }}>
          Ei ryhmiä
        </Typography>
      )}
      <Typography variant="h6" gutterBottom>
        Shelly laitteet
      </Typography>
      <ShellyDeviceList devices={devices} />
    </>
  );
}
