import { getServerAuthSession } from "@energyapp/server/auth";
import { type ReactNode } from "react";
import SettingsNavigation from "../_components/Navigation/settings-navigation";

export const metadata = {
  title: "Asetukset",
  description: "Täältä voit muuttaa sovelluksessa käytettäviä asetuksia.",
  // other metadata...
};

export default async function SettingsLayout({
  children, // will be a page or nested layout
}: {
  children: ReactNode;
}) {
  const session = await getServerAuthSession();

  return (
    <main className="flex min-h-screen-nhf flex-col items-center justify-center app-main-background text-white">
      <div className="container flex flex-col items-center justify-center gap-2 px-4 py-16 ">
        <div className="text-center">
          <SettingsNavigation hasSession={Boolean(session)} />
        </div>
        {children}
      </div>
    </main>
  );
}
