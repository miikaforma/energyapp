import { getServerAuthSession } from "@energyapp/server/auth";
import { api } from "@energyapp/trpc/server";
import DeviceConsumptions from "../_components/device-consumptions";

export const metadata = {
  title: "Ilmalämpöpumppu",
  description: "This is a description of the air source heat pump.",
  // other metadata...
};

export default async function Page() {
  const devices = await api.melCloud.getDevices.query();

  return (
    <main className="flex min-h-screen-nhf flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-zinc-800 text-white">
      <div className="container flex flex-col items-center justify-center gap-6 px-4 py-16 ">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-[2rem]">
          <span className="text-[hsl(280,100%,70%)]">Arvioitu</span> energiankulutus
        </h1>
        <DeviceConsumptions devices={devices} />
      </div>
    </main>
  );
}

