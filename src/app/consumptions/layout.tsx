import ConsumptionNavigation from "@energyapp/app/_components/Navigation/consumption-navigation";
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
  const hasShelly = userAccesses.some((access: { type: string }) => access.type === "SHELLY");

  const hasMultiple = [hasMelcloud, hasWattivahtiConsumption, hasShelly].filter(Boolean).length > 1;

  return (
    <main className="flex min-h-screen-nhf flex-col items-center justify-center app-main-background text-white">
      <div className="container flex flex-col items-center justify-center gap-2 px-4 py-16 ">
        {hasMultiple && (
          <div className="text-center">
            <ConsumptionNavigation hasMelcloud hasShelly hasWattivahti />
          </div>
        )}
        {children}
      </div>
    </main>
  )
}
