import { type ReactNode } from "react";
import StatisticsNavigation from "@energyapp/app/_components/Navigation/statistics-navigation";
import { api } from "@energyapp/trpc/server";
import { getServerAuthSession } from "@energyapp/server/auth";
import { IUserAccessResponse } from "@energyapp/shared/interfaces";

export const metadata = {
  title: "Statistiikka",
  description: "Täältä näet statistiikkaa kuten Fingridin tarjoamat sähkön kulutus ja tuotanto arvot sekä ennusteet.",
  // other metadata...
};

export default async function StatisticsLayout({
  children, // will be a page or nested layout
}: {
  children: ReactNode;
}) {
  const session = await getServerAuthSession();
  const userAccesses: IUserAccessResponse[] = session ? await api.access.getUserAccesses.query()
    .catch(() => []) : [];

  const hasRuuvi = userAccesses.some((access: { type: string }) => access.type === "RUUVI");

  return (
    <main className="app-main-background flex min-h-screen-nhf flex-col items-center justify-center text-white">
      <div className="container flex flex-col items-center justify-center gap-2 px-4 py-16 ">
        <div className="text-center">
          <StatisticsNavigation hasRuuvi={hasRuuvi} />
        </div>
        {children}
      </div>
    </main>
  );
}
