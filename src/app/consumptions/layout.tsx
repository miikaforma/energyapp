import ConsumptionNavigation from "@energyapp/app/_components/Navigation/consumption-navigation";
import { getServerAuthSession } from "@energyapp/server/auth";
import { type ReactNode } from "react";
import { api } from "@energyapp/trpc/server";

export default async function ConsumptionLayout({
  children, // will be a page or nested layout
}: {
  children: ReactNode,
}) {
  const userAccesses = await api.access.getUserAccesses.query();

  const hasMelcloud = userAccesses.some((access: { type: string }) => access.type === "MELCLOUD");
  const hasWattivahtiConsumption = userAccesses.some((access: { type: string }) => access.type === "WATTIVAHTI_CONSUMPTION");

  const hasBothTypes = hasMelcloud && hasWattivahtiConsumption;

  

  return (
    <main className="flex min-h-screen-nhf flex-col items-center justify-center app-main-background text-white">
      {hasBothTypes && (
        <div className="text-center">
          <ConsumptionNavigation />
        </div>
      )}
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        {children}
      </div>
    </main>
  )
}
