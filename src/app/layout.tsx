import "@energyapp/styles/globals.css";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';

import { Inter } from "next/font/google";
import { cookies } from "next/headers";

import { TRPCReactProvider } from "@energyapp/trpc/react";
import { getServerAuthSession } from "@energyapp/server/auth";
import BottomNav from "./_components/Navigation/bottom-navigation";
import { CssBaseline } from "@mui/material";

import ThemeRegistry from "./_components/ThemeRegistry/ThemeRegistry";
import MenuAppBar from "./_components/MenuAppBar/AppBar";
import SessionProvider from "./_components/session-provider";
import AuthUpdater from "./_components/auth-updater";

import AntdTheme from "@energyapp/app/_components/ThemeRegistry/AntdTheme";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { type Metadata, type Viewport } from "next";

import { Toaster } from "react-hot-toast";
import { api } from "@energyapp/trpc/server";
import { type IUserAccessResponse } from "@energyapp/shared/interfaces";
import PushSubscriber from "./_components/Helpers/push-subscriber";
import { env } from "@energyapp/env";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "EnergyApp",
  description: "Sovellus spottihintojen, sähkönkulutuksen ja sähköntuotannon seurantaan.",
  icons: [{ rel: "icon", type: "image/svg+xml", url: "/electricity-icon.svg" }],
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["energyapp", "spottihinnat", "tuntihinnat", "sähkönkulutus", "sähköntuotanto", "seuranta"],
  authors: [
    { name: "Miika" },
  ]
};

export const viewport: Viewport = {
  minimumScale: 1,
  initialScale: 1,
  width: "device-width",
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#171719" }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  const userAccesses: IUserAccessResponse[] = session ? await api.access.getUserAccesses.query()
    .catch(() => []) : [];

  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable} dark`}>
        <TRPCReactProvider cookies={cookies().toString()}>
          <AppRouterCacheProvider>
            <AntdRegistry>
              <AntdTheme>
                <ThemeRegistry>
                  <SessionProvider>
                    <CssBaseline />
                    <Toaster position="bottom-left" toastOptions={{
                      style: {
                        background: '#333',
                        color: '#fff',
                      },
                    }} />
                    <AuthUpdater />
                    <PushSubscriber applicationServerKey={env.VAPID_PUBLIC_KEY} />
                    <MenuAppBar session={session} userAccesses={userAccesses} />
                    <BottomNav session={session} userAccesses={userAccesses}>
                      {children}
                    </BottomNav>
                  </SessionProvider>
                </ThemeRegistry>
              </AntdTheme>
            </AntdRegistry>
          </AppRouterCacheProvider>
        </TRPCReactProvider>
      </body>
    </html >
  );
}
