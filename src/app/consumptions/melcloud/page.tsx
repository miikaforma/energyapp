import { api } from "@energyapp/trpc/server";
import DeviceConsumptions from "@energyapp/app/_components/device-consumptions";

export const metadata = {
  title: "Ilmalämpöpumppu",
  description: "This is a description of the air source heat pump.",
  // other metadata...
};

export default async function Page() {
  const devices = await api.melCloud.getDevices.query();

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-[2rem]">
        <span className="text-[hsl(280,100%,70%)]">Arvioitu</span>{" "}
        energiankulutus
      </h1>
      <DeviceConsumptions devices={devices} />
    </>
  );
}
