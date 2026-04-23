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
import { Tag, Tooltip } from "antd";
import EuroIcon from "@mui/icons-material/Euro";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import useGetCurrentSpotPrice from "@energyapp/app/_hooks/queries/useGetCurrentSpotPrice";
import useHomewizardSubscription from "@energyapp/app/_hooks/subscriptions/useHomewizardSubscription";
import { Stack } from "@mui/material";
import { getColorForTotalPower, getTagColorForWatts, getTemperatureC, kwhOrWattsShortString, kwhOrWattsString, wattsString } from "@energyapp/utils/powerHelpers";
import RelativeTime from "@energyapp/app/_components/Helpers/relative-time";
import { type Dayjs } from "dayjs";
import { TimePeriod } from "@energyapp/shared/enums";
import { dateToShortSpotTimeString } from "@energyapp/utils/timeHelpers";
import { formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
import { type IUserAccessResponse } from "@energyapp/shared/interfaces";
import useGetRuuviDevicesWithInfo from "@energyapp/app/_hooks/queries/ruuvi/useGetRuuviDevicesWithInfo";
import { type homewizard_measurements } from "@energyapp/generated/client";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

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

export default function MenuAppBar({ session, userAccesses, homeWizardData }: { session: Session | null, userAccesses: IUserAccessResponse[]; homeWizardData: homewizard_measurements | null; }) {
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
  const [homewizardData, setHomewizardData] = React.useState<homewizard_measurements | null>(homeWizardData);
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

  const getPowerDirectionIcon = (power: number | null | undefined, isMobile: boolean) => {
    if (power === null || power === undefined) {
      return null;
    }

    if (isMobile) {
      return power < 0 ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />;
    }

    return power < 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />;
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: 1,
            py: 1,
          }}
        >
          <Box
            sx={{
              flex: "1 1 0",
              minWidth: 0,
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              justifyContent: {
                xs: "center",
                md: "flex-start",
              },
              alignItems: "flex-start",
            }}
          >
            {currentSpotPrice && (
              <Box
                sx={{
                  flex: { xs: "1 1 calc(33.333% - 8px)", sm: "0 0 auto" },
                  minWidth: { xs: 92, sm: "auto" },
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Box sx={{ userSelect: "none" }}>
                  <Tag color={spotPriceColor}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <EuroIcon fontSize="small" />
                      <Tooltip
                        placement={"left"}
                        title={`${formatNumberToFI(currentSpotPrice.price) ?? "0"
                          } c/kWh`}
                        trigger={"click"}
                      >
                        <Typography variant="body1">
                          {formatNumberToFI(currentSpotPrice.price_with_tax)} c/kWh
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
                      TimePeriod.PT15M
                    )}
                  </Box>
                </Box>
              </Box>
            )}

            {hasSolarman && latestProduction && (
              <Box
                sx={{
                  flex: { xs: "1 1 calc(33.333% - 8px)", sm: "0 0 auto" },
                  minWidth: { xs: 92, sm: "auto" },
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Box
                  onClick={() =>
                    router.push(`/productions/solarman/${TimePeriod.PT15M}`)
                  }
                  sx={{ cursor: "pointer", userSelect: "none" }}
                >
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
              </Box>
            )}

            {hasRuuvi && ruuviAir && ruuviAir.latestData && (
              <Box
                sx={{
                  flex: { xs: "1 1 calc(33.333% - 8px)", sm: "0 0 auto" },
                  minWidth: { xs: 92, sm: "auto" },
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Box
                  onClick={() => router.push("/statistics/ruuvi")}
                  sx={{ cursor: "pointer", userSelect: "none" }}
                >
                  <Tag color={latestTemperatureColor}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <ThermostatIcon fontSize="small" />
                      <Typography variant="body1">
                        {getTemperatureC(
                          ruuviAir.latestData.temperature ?? undefined
                        )}
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
              </Box>
            )}

            {hasHomewizard && homewizardData && (
              <>
                {/* Mobile: compact 4-item row */}
                <Box
                  sx={{
                    display: { xs: "flex", sm: "none" },
                    width: "100%",
                    gap: 0.5,
                    justifyContent: "center",
                    alignItems: "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      flex: "1 1 0",
                      minWidth: 0,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Box sx={{ cursor: "pointer", userSelect: "none" }}>
                      <Tag color={getTagColorForWatts(homewizardData.power_l1_w)}>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                          {getPowerDirectionIcon(homewizardData.power_l1_w, true)}
                          <Typography variant="body2">
                            {wattsString(homewizardData.power_l1_w)}
                          </Typography>
                        </Stack>
                      </Tag>
                      <Box
                        sx={{
                          fontStyle: "italic",
                          color: "gray",
                          whiteSpace: "nowrap",
                          fontSize: 11,
                          textAlign: "center",
                        }}
                      >
                        L1
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      flex: "1 1 0",
                      minWidth: 0,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Box sx={{ cursor: "pointer", userSelect: "none" }}>
                      <Tag color={getTagColorForWatts(homewizardData.power_l2_w)}>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                          {getPowerDirectionIcon(homewizardData.power_l2_w, true)}
                          <Typography variant="body2">
                            {wattsString(homewizardData.power_l2_w)}
                          </Typography>
                        </Stack>
                      </Tag>
                      <Box
                        sx={{
                          fontStyle: "italic",
                          color: "gray",
                          whiteSpace: "nowrap",
                          fontSize: 11,
                          textAlign: "center",
                        }}
                      >
                        L2
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      flex: "1 1 0",
                      minWidth: 0,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Box sx={{ cursor: "pointer", userSelect: "none" }}>
                      <Tag color={getTagColorForWatts(homewizardData.power_l3_w)}>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                          {getPowerDirectionIcon(homewizardData.power_l3_w, true)}
                          <Typography variant="body2">
                            {wattsString(homewizardData.power_l3_w)}
                          </Typography>
                        </Stack>
                      </Tag>
                      <Box
                        sx={{
                          fontStyle: "italic",
                          color: "gray",
                          whiteSpace: "nowrap",
                          fontSize: 11,
                          textAlign: "center",
                        }}
                      >
                        L3
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      flex: "1 1 0",
                      minWidth: 0,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Box sx={{ cursor: "pointer", userSelect: "none" }}>
                      <Tag color={getColorForTotalPower(homewizardData.power_w)}>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                          {getPowerDirectionIcon(homewizardData.power_w, true)}
                          <Typography variant="body2">
                            {wattsString(homewizardData.power_w)}
                          </Typography>
                        </Stack>
                      </Tag>
                      <Box
                        sx={{
                          fontStyle: "italic",
                          color: "gray",
                          whiteSpace: "nowrap",
                          fontSize: 11,
                          textAlign: "center",
                        }}
                      >
                        {getRelativeTimeStamp(homewizardData.timestamp)}
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Desktop/tablet: separate items */}
                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    flex: "0 0 auto",
                    justifyContent: "center",
                  }}
                >
                  <Box sx={{ cursor: "pointer", userSelect: "none" }}>
                    <Tag color={getTagColorForWatts(homewizardData.power_l1_w)}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        {getPowerDirectionIcon(homewizardData.power_l1_w, false)}
                        <Typography variant="body1">
                          {kwhOrWattsShortString(homewizardData.power_l1_w)}
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
                      L1
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    flex: "0 0 auto",
                    justifyContent: "center",
                  }}
                >
                  <Box sx={{ cursor: "pointer", userSelect: "none" }}>
                    <Tag color={getTagColorForWatts(homewizardData.power_l2_w)}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        {getPowerDirectionIcon(homewizardData.power_l2_w, false)}
                        <Typography variant="body1">
                          {kwhOrWattsShortString(homewizardData.power_l2_w)}
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
                      L2
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    flex: "0 0 auto",
                    justifyContent: "center",
                  }}
                >
                  <Box sx={{ cursor: "pointer", userSelect: "none" }}>
                    <Tag color={getTagColorForWatts(homewizardData.power_l3_w)}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        {getPowerDirectionIcon(homewizardData.power_l3_w, false)}
                        <Typography variant="body1">
                          {kwhOrWattsShortString(homewizardData.power_l3_w)}
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
                      L3
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    flex: "0 0 auto",
                    justifyContent: "center",
                  }}
                >
                  <Box sx={{ userSelect: "none" }}>
                    <Tag
                      color={getColorForTotalPower(homewizardData.power_w)}
                      variant="outlined"
                    >
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="body1">
                          {getPowerDirectionIcon(homewizardData.power_w, false)}{" "}
                          {kwhOrWattsString(homewizardData.power_w)}
                        </Typography>
                      </Stack>
                    </Tag>
                  </Box>
                </Box>
              </>
            )}
          </Box>

          <Box
            sx={{
              flex: "0 0 auto",
              ml: "auto",
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
            }}
          >
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
                </Menu>
              </div>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
