import { type ReactNode } from "react";

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
  return (
    <main className="app-main-background flex min-h-screen-nhf flex-col items-center justify-center text-white">
      <div className="container flex flex-col items-center justify-center gap-2 px-4 py-16 ">
        {children}
      </div>
    </main>
  );
}
