"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import AccountCircle from "@mui/icons-material/AccountCircle";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import { type Session } from "next-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useGetLatestSolarmanProduction from "@energyapp/app/_hooks/queries/useGetLatestSolarmanProduction";
import { Flex, Tag, Tooltip } from "antd";
import EuroIcon from "@mui/icons-material/Euro";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import useGetCurrentSpotPrice from "@energyapp/app/_hooks/queries/useGetCurrentSpotPrice";
import { Stack } from "@mui/material";
import { kwhOrWattsString } from "@energyapp/utils/powerHelpers";
import RelativeTime from "@energyapp/app/_components/Helpers/relative-time";
import { type Dayjs } from "dayjs";
import { TimePeriod } from "@energyapp/shared/enums";
import { dateToShortSpotTimeString } from "@energyapp/utils/timeHelpers";
import { formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
import { type IUserAccessResponse } from "@energyapp/shared/interfaces";

const getRelativeTimeStamp = (time: string | number | Date | Dayjs) => {
  if (!time) {
    return (
      <span
        style={{ fontStyle: "italic", color: "gray", whiteSpace: "nowrap" }}
      >
        ei tiedossa
      </span>
    );
  }

  return (
    <span style={{ fontStyle: "italic", color: "gray", whiteSpace: "nowrap" }}>
      <RelativeTime timestamp={time}></RelativeTime>
    </span>
  );
};

export default function MenuAppBar({ session, userAccesses }: { session: Session | null, userAccesses: IUserAccessResponse[]; }) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const hasSolarman = userAccesses.some((access: { type: string }) => access.type === "SOLARMAN");

  // Get current spot price
  const { data: currentSpotPrice } = useGetCurrentSpotPrice();

  // Get latest production
  const { data: latestProduction } = useGetLatestSolarmanProduction({ enabled: hasSolarman });

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    router.push("/api/auth/signout");
  };

  const spotPriceColor = currentSpotPrice
    ? currentSpotPrice.price_with_tax < 10
      ? "green"
      : currentSpotPrice.price_with_tax < 15
        ? "yellow"
        : currentSpotPrice.price_with_tax < 20
          ? "orange"
          : "red"
    : "none";

  const production = latestProduction
    ? latestProduction.output_power_active / 1000
    : 0;
  const latestProductionColor = latestProduction
    ? production < 1
      ? "yellow"
      : production < 2
        ? "gold"
        : production < 4
          ? "orange"
          : "volcano"
    : "none";

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          {/* <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton> */}
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1 }}
          ></Typography>
          <Flex gap="4px 0" style={{ flexGrow: 1 }}>
            {currentSpotPrice && (
              <Box>
                <Tag color={spotPriceColor}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <EuroIcon fontSize="small" />
                    <Tooltip
                      placement={"left"}
                      title={`${
                        formatNumberToFI(currentSpotPrice.price) ?? "0"
                      } c/kWh`}
                      trigger={"click"}
                      // style={tooltipStyles}
                    >
                      <Typography variant="body1">
                        {formatNumberToFI(currentSpotPrice.price_with_tax)}{" "}
                        c/kWh
                      </Typography>
                    </Tooltip>
                  </Stack>
                </Tag>
                <Box
                  sx={{
                    fontStyle: "italic",
                    color: "gray",
                    whiteSpace: "nowrap",
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  {dateToShortSpotTimeString(
                    currentSpotPrice.time,
                    TimePeriod.PT1H,
                  )}
                </Box>
              </Box>
            )}
            {hasSolarman && latestProduction && (
              <Box>
                <Tag color={latestProductionColor}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <SolarPowerIcon fontSize="small" />
                    <Typography variant="body1">
                      {kwhOrWattsString(latestProduction.output_power_active)}
                    </Typography>
                  </Stack>
                </Tag>
                <Box
                  sx={{
                    fontStyle: "italic",
                    color: "gray",
                    whiteSpace: "nowrap",
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  {getRelativeTimeStamp(latestProduction.time)}
                </Box>
              </Box>
            )}
          </Flex>
          {!session && (
            <Link
              href={session ? "/api/auth/signout" : "/api/auth/signin"}
              className="rounded-md bg-white/10 px-5 py-1 font-semibold no-underline transition hover:bg-white/20"
            >
              {session ? "Kirjaudu ulos" : "Kirjaudu sisään"}
            </Link>
          )}
          {session && (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleLogout}>Kirjaudu ulos</MenuItem>
                {/* <MenuItem onClick={handleClose}>My account</MenuItem> */}
              </Menu>
            </div>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
}
