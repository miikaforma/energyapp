"use client";

import {
    Box,
    Card,
    CardContent,
    Grid,
    Stack,
    Typography,
} from "@mui/material";
import { type api } from "@energyapp/trpc/server";
import RelativeTime from "../Helpers/relative-time";
import dayjs from "dayjs";
import { formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
import { getAirPressureString, getHumidityString, getPictureUrl } from "@energyapp/utils/ruuviHelpers";
import DeviceImage from "./device-image";
import BigValue from "./progress-bar";

type Device = Awaited<
    ReturnType<typeof api.ruuvi.getDevicesWithInfo.query>
>[number];

export default function RuuviTagDevice({ device }: { device: Device }) {
    return (
        <Card key={device.accessId} sx={{ minWidth: 320, display: 'flex' }}>
            <DeviceImage imageUrl={getPictureUrl(device.serviceAccess.customData)} alt="RuuviTag Device" />
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <CardContent sx={{ pl: '1rem', pb: 0 }}>
                    <Typography
                        gutterBottom
                        sx={{ color: "text.secondary", fontSize: 16, fontWeight: "bold" }}
                        justifyContent="flex-start"
                        alignItems="center"
                        display="flex"
                    >
                        {device.serviceAccess.accessName}
                    </Typography>
                </CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', pl: '1rem', pb: 1 }}>
                    <BigValue
                        value={formatNumberToFI(device.latestData?.temperature ?? 0)}
                        unit="°C"
                        alertActive={false} //{getAlertState(getIAQS(device.latestData)) > 0}
                        label="Lämpötila"
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', pl: '1rem', pb: 1 }}>
                    <Grid container spacing={3} columns={2}>
                        {device.latestData?.humidity && (
                            <Grid size={1} sx={{ display: 'flex', alignItems: 'center' }}>
                                <Stack spacing={0}>
                                    <Typography
                                        sx={{ color: "text.secondary", fontSize: "16px", fontWeight: "bold" }}
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        display="flex"
                                        component="div"
                                    >
                                        {getHumidityString(device.latestData?.humidity)}
                                    </Typography>
                                    <Typography
                                        sx={{ color: "text.secondary", fontSize: "12px" }}
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        display="flex"
                                        component="div"
                                    >
                                        Suht.&nbsp;ilmankosteus
                                    </Typography>
                                </Stack>
                            </Grid>
                        )}
                        {device.latestData?.pressure && (
                            <Grid size={1} sx={{ display: 'flex', alignItems: 'center' }}>
                                <Stack spacing={0}>
                                    <Typography
                                        sx={{ color: "text.secondary", fontSize: "16px", fontWeight: "bold" }}
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        display="flex"
                                        component="div"
                                    >
                                        {getAirPressureString(device.latestData?.pressure)}
                                    </Typography>
                                    <Typography
                                        sx={{ color: "text.secondary", fontSize: "12px" }}
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        display="flex"
                                        component="div"
                                    >
                                        Ilmanpaine
                                    </Typography>
                                </Stack>
                            </Grid>
                        )}

                    </Grid>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', pl: '1rem', pb: 1 }}>
                    <span style={{ fontStyle: 'italic', color: "gray", whiteSpace: 'nowrap', fontSize: 12 }}><RelativeTime timestamp={dayjs(device?.latestData?.time)}></RelativeTime></span>
                </Box>
            </Box>
        </Card>
    );
}
