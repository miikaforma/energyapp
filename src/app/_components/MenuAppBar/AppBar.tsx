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
import ThermostatIcon from "@mui/icons-material/Thermostat";
import useGetCurrentSpotPrice from "@energyapp/app/_hooks/queries/useGetCurrentSpotPrice";
import useHomewizardSubscription from "@energyapp/app/_hooks/subscriptions/useHomewizardSubscription";
import { Grid, Stack } from "@mui/material";
import { getColorForTotalPower, getTagColorForWatts, getTemperatureC, kwhOrWattsShortString, kwhOrWattsString } from "@energyapp/utils/powerHelpers";
import RelativeTime from "@energyapp/app/_components/Helpers/relative-time";
import { type Dayjs } from "dayjs";
import { TimePeriod } from "@energyapp/shared/enums";
import { dateToShortSpotTimeString } from "@energyapp/utils/timeHelpers";
import { formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
import { type IUserAccessResponse } from "@energyapp/shared/interfaces";
import useGetRuuviDevicesWithInfo from "@energyapp/app/_hooks/queries/ruuvi/useGetRuuviDevicesWithInfo";
import { type homewizard_measurements } from "@energyapp/generated/client";

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
  const hasRuuvi = userAccesses.some((access: { type: string }) => access.type === "RUUVI");
  const hasHomewizard = userAccesses.some((access: { type: string }) => access.type === "HOMEWIZARD");

  // Get current spot price
  const { data: currentSpotPrice } = useGetCurrentSpotPrice();

  // Get latest production
  const { data: latestProduction } = useGetLatestSolarmanProduction({ enabled: hasSolarman });

  // Get ruuvi devices with info
  const { data: devices } = useGetRuuviDevicesWithInfo({ enabled: hasRuuvi });
  const ruuviAir = devices?.find(device => device.latestData?.mac?.includes("C6D1A71DE3F8"));

  // Homewizard subscription for latest measurement
  const [homewizardData, setHomewizardData] = React.useState<homewizard_measurements | null>(null);
  useHomewizardSubscription((data) => setHomewizardData(data));

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
    : "default";

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
    : "default";
  const latestTemperatureColor = ruuviAir?.latestData?.temperature
    ? ruuviAir.latestData.temperature < 0
      ? "cyan"
      : ruuviAir.latestData.temperature < 15
        ? "green"
        : ruuviAir.latestData.temperature < 25
          ? "yellow"
          : "red"
    : "default";

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
            <Grid container rowSpacing={1} columnSpacing={{ xs: 0 }}>
              <Grid size="auto">
                {currentSpotPrice && (
                  <Box sx={{ userSelect: "none" }}>
                    <Tag color={spotPriceColor}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <EuroIcon fontSize="small" />
                        <Tooltip
                          placement={"left"}
                          title={`${formatNumberToFI(currentSpotPrice.price) ?? "0"
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
                        TimePeriod.PT15M,
                      )}
                    </Box>
                  </Box>
                )}
              </Grid>
              <Grid size="grow" textAlign="center">
                {hasSolarman && latestProduction && (
                  <Box onClick={() => router.push(`/productions/solarman/${TimePeriod.PT15M}`)} sx={{ cursor: "pointer", userSelect: "none" }}>
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
              </Grid>
              <Grid size="grow" textAlign="center">
                {
                  hasRuuvi && ruuviAir && ruuviAir.latestData && (
                    <Box onClick={() => router.push("/statistics/ruuvi")} sx={{ cursor: "pointer", userSelect: "none" }}>
                      <Tag color={latestTemperatureColor}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <ThermostatIcon fontSize="small" />
                          <Typography variant="body1">
                            {getTemperatureC(ruuviAir.latestData.temperature ?? undefined)}
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
                        {getRelativeTimeStamp(ruuviAir.latestData.time)}
                      </Box>
                    </Box>
                  )
                }
              </Grid>
              {hasHomewizard && homewizardData && (
                <Grid size="auto">
                  <Box>
                    <Tag color={getTagColorForWatts(homewizardData.power_l1_w)} variant="outlined">
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          L1: {kwhOrWattsShortString(homewizardData.power_l1_w)}
                        </Typography>
                      </Stack>
                    </Tag>
                    <Tag color={getTagColorForWatts(homewizardData.power_l2_w)} variant="outlined">
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          L2: {kwhOrWattsShortString(homewizardData.power_l2_w)}
                        </Typography>
                      </Stack>
                    </Tag>
                    <Tag color={getTagColorForWatts(homewizardData.power_l3_w)} variant="outlined">
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          L3: {kwhOrWattsShortString(homewizardData.power_l3_w)}
                        </Typography>
                      </Stack>
                    </Tag>
                  </Box>
                </Grid>
              )}
              {hasHomewizard && homewizardData && (
                <Grid size="grow" textAlign="end">
                  <Box>
                    <Tag color={getColorForTotalPower(homewizardData.power_w)} variant="outlined">
                      <Stack direction="row" alignItems="center" gap={1}>
                        {/* <BoltIcon fontSize="small" /> */}
                        <Typography variant="body2">
                          {(homewizardData?.power_w ?? 0) < 0 ? "↓" : "↑"} {kwhOrWattsString(homewizardData.power_w)}
                        </Typography>
                      </Stack>
                    </Tag>
                  </Box>
                </Grid>
              )}
            </Grid>
            {/* {currentSpotPrice && (
              <Box sx={{ userSelect: "none" }}>
                <Tag color={spotPriceColor}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <EuroIcon fontSize="small" />
                    <Tooltip
                      placement={"left"}
                      title={`${formatNumberToFI(currentSpotPrice.price) ?? "0"
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
                    TimePeriod.PT15M,
                  )}
                </Box>
              </Box>
            )}
            {hasSolarman && latestProduction && (
              <Box onClick={() => router.push(`/productions/solarman/${TimePeriod.PT15M}`)} sx={{ cursor: "pointer", userSelect: "none" }}>
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
            {
              hasRuuvi && ruuviAir && ruuviAir.latestData && (
                <Box onClick={() => router.push("/statistics/ruuvi")} sx={{ cursor: "pointer", userSelect: "none" }}>
                  <Tag color={latestTemperatureColor}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <ThermostatIcon fontSize="small" />
                      <Typography variant="body1">
                        {getTemperatureC(ruuviAir.latestData.temperature ?? undefined)}
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
                    {getRelativeTimeStamp(ruuviAir.latestData.time)}
                  </Box>
                </Box>
              )
            } */}

            {/* {hasHomewizard && homewizardData && (
              <Box sx={{ userSelect: "none", display: "flex", flexDirection: "row", gap: 1 }}>
                {[1, 2, 3].map((vaihe) => {
                  const value = homewizardData[`power_l${vaihe}_w`];
                  if (typeof value !== "number") return null;
                  return (
                    <Tag key={vaihe} color={value >= 0 ? "green" : "red"}>
                      <Typography variant="body2">
                        Vaihe {vaihe}: {value} W
                      </Typography>
                    </Tag>
                  );
                })}
              </Box>
            )} */}
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
