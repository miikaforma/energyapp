"use client";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import EuroIcon from "@mui/icons-material/Euro";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import StackedLineChartIcon from "@mui/icons-material/StackedLineChart";
import Paper from "@mui/material/Paper";
import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { type Session } from "next-auth";
import { type IUserAccessResponse } from "@energyapp/shared/interfaces";

export default function BottomNav({
  children,
  session,
  userAccesses,
}: {
  children: ReactNode;
  session: Session | null;
  userAccesses: IUserAccessResponse[];
}) {
  const pathname = usePathname();

  let currentRoute = "/";
  if (pathname) {
    const pathArray = pathname.split("/");
    if (pathArray.length > 1 && pathArray[1]) {
      currentRoute = "/" + pathArray[1];
    }
  }

  const hasMelcloud = userAccesses.some(
    (access: { type: string }) => access.type === "MELCLOUD",
  );
  const hasWattivahtiConsumption = userAccesses.some(
    (access: { type: string }) => access.type === "WATTIVAHTI_CONSUMPTION",
  );
  const hasWattivahtiProduction = userAccesses.some(
    (access: { type: string }) => access.type === "WATTIVAHTI_PRODUCTION",
  );
  const hasSolarman = userAccesses.some(
    (access: { type: string }) => access.type === "SOLARMAN",
  );

  const showConsumption = hasMelcloud || hasWattivahtiConsumption;
  const showProduction = hasSolarman || hasWattivahtiProduction;

  return (
    <Box sx={{ pb: 7, pt: 0 }}>
      <CssBaseline />
      {children}
      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1071 }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={currentRoute}
          sx={{ overflowX: "auto" }}
        >
          <BottomNavigationAction
            sx={{ minWidth: "60px" }}
            label="Tuntihinnat"
            href="/spotPrices"
            value="/spotPrices"
            icon={<EuroIcon />}
            LinkComponent={Link}
          />
          {session && showConsumption && (
            <BottomNavigationAction
              sx={{ minWidth: "60px" }}
              label="Kulutus"
              href="/consumptions"
              value="/consumptions"
              icon={<ElectricBoltIcon />}
              LinkComponent={Link}
            />
          )}
          {session && showProduction && (
            <BottomNavigationAction
              sx={{ minWidth: "60px" }}
              label="Tuotto"
              href="/productions"
              value="/productions"
              icon={<SolarPowerIcon />}
              LinkComponent={Link}
            />
          )}
          <BottomNavigationAction
            sx={{ minWidth: "60px" }}
            label="Tilastot"
            href="/statistics"
            value="/statistics"
            icon={<StackedLineChartIcon />}
            LinkComponent={Link}
          />
          {/* <BottomNavigationAction sx={{ minWidth: "60px" }} label="Asetukset" href="/settings" value="/settings" icon={<SettingsIcon />} LinkComponent={Link} /> */}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
