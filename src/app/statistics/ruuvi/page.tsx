'use client'
import { type api } from "@energyapp/trpc/server";

import useGetRuuviDevicesWithInfo from "@energyapp/app/_hooks/queries/useGetRuuviDevicesWithInfo";
import RuuviDeviceList from "@energyapp/app/_components/Ruuvi/device-list";

type Device = Awaited<
  ReturnType<typeof api.ruuvi.getDevicesWithInfo.query>
>[number];

export default function Ruuvi() {
  const { data: devices } = useGetRuuviDevicesWithInfo();
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

  return <RuuviDeviceList devices={devices} />;
}
