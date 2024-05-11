import ProductionNavigation from "@energyapp/app/_components/Navigation/production-navigation";
import { type ReactNode } from "react";
import { api } from "@energyapp/trpc/server";

export default async function ProductionLayout({
  children, // will be a page or nested layout
}: {
  children: ReactNode,
}) {
  const userAccesses = await api.access.getUserAccesses.query();

  const hasSolarman = false //userAccesses.some((access: { type: string }) => access.type === "SOLARMAN");
  const hasWattivahtiProduction = userAccesses.some((access: { type: string }) => access.type === "WATTIVAHTI_PRODUCTION");

  return (
    <main className="flex min-h-screen-nhf flex-col items-center justify-center app-main-background text-white">
      <div className="container flex flex-col items-center justify-center gap-2 px-4 py-16 ">
        <div className="text-center">
          <ProductionNavigation hasSolarman={hasSolarman} hasWattivahti={hasWattivahtiProduction} />
        </div>
        {children}
      </div>
    </main>
  )
}
