import { type ReactNode } from "react";
import StatisticsNavigation from "@energyapp/app/_components/Navigation/statistics-navigation";

export default async function StatisticsLayout({
  children, // will be a page or nested layout
}: {
  children: ReactNode;
}) {
  return (
    <main className="app-main-background flex min-h-screen-nhf flex-col items-center justify-center text-white">
      <div className="container flex flex-col items-center justify-center gap-2 px-4 py-16 ">
        <div className="text-center">
          <StatisticsNavigation />
        </div>
        {children}
      </div>
    </main>
  );
}
