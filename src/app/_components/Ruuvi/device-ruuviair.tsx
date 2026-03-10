"use client";

import {
    Box,
    Card,
    CardContent,
    Grid,
    Stack,
    Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { type api } from "@energyapp/trpc/server";
import RelativeTime from "../Helpers/relative-time";
import dayjs from "dayjs";
import { getAirPressureString, getCO2String, getHumidityString, getIAQS, getNOxIndexString, getPictureUrl, getPM25String, getTemperatureC, getVocIndexString } from "@energyapp/utils/ruuviHelpers";
import DeviceImage from "./device-image";
import BigValue from "./progress-bar";
import { isValueDefined } from "@energyapp/utils/valueHelpers";

type Device = Awaited<
    ReturnType<typeof api.ruuvi.getDevicesWithInfo.query>
>[number];

export default function RuuviAirDevice({ device }: { device: Device }) {
    const router = useRouter();

    const handleClick = () => {
        router.push(`./ruuvi/${device.accessId}`);
    };

    return (
        <Card
            key={device.accessId}
            onClick={handleClick}
            sx={{ minWidth: 320, display: 'flex', cursor: 'pointer', '&:hover': { boxShadow: 'rgb(31, 147, 133) 0px 0px 0px 1px' } }}
        >
            <DeviceImage imageUrl={getPictureUrl(device.serviceAccess.customData)} alt="Ruuvi Air Device" />
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
                        value={Math.round(getIAQS(device.latestData))}
                        unit="/100"
                        alertActive={false} //{getAlertState(getIAQS(device.latestData)) > 0}
                        label="Ilmanlaatu"
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', pl: '1rem', pb: 1 }}>
                    <Grid container spacing={1} columns={2}>
                        {isValueDefined(device.latestData?.co2) && (
                            <Grid size={1} sx={{ display: 'flex', alignItems: 'center' }}>
                                <Stack spacing={0}>
                                    <Typography
                                        sx={{ color: "text.secondary", fontSize: "16px", fontWeight: "bold" }}
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        display="flex"
                                        component="div"
                                    >
                                        {getCO2String(device.latestData?.co2)}
                                    </Typography>
                                    <Typography
                                        sx={{ color: "text.secondary", fontSize: "12px" }}
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        display="flex"
                                        component="div"
                                    >
                                        CO₂
                                    </Typography>
                                </Stack>
                            </Grid>
                        )}
                        {isValueDefined(device.latestData?.pm2_5) && (
                            <Grid size={1} sx={{ display: 'flex', alignItems: 'center' }}>
                                <Stack spacing={0}>
                                    <Typography
                                        sx={{ color: "text.secondary", fontSize: "16px", fontWeight: "bold" }}
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        display="flex"
                                        component="div"
                                    >
                                        {getPM25String(device.latestData?.pm2_5)}
                                    </Typography>
                                    <Typography
                                        sx={{ color: "text.secondary", fontSize: "12px" }}
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        display="flex"
                                        component="div"
                                    >
                                        PM2.5
                                    </Typography>
                                </Stack>
                            </Grid>
                        )}
                        {isValueDefined(device.latestData?.voc) && (
                            <Grid size={1} sx={{ display: 'flex', alignItems: 'center' }}>
                                <Stack spacing={0}>
                                    <Typography
                                        sx={{ color: "text.secondary", fontSize: "16px", fontWeight: "bold" }}
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        display="flex"
                                        component="div"
                                    >
                                        {getVocIndexString(device.latestData?.voc)}
                                    </Typography>
                                    <Typography
                                        sx={{ color: "text.secondary", fontSize: "12px" }}
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        display="flex"
                                        component="div"
                                    >
                                        VOC-indeksi
                                    </Typography>
                                </Stack>
                            </Grid>
                        )}
                        {isValueDefined(device.latestData?.nox) && (
                            <Grid size={1} sx={{ display: 'flex', alignItems: 'center' }}>
                                <Stack spacing={0}>
                                    <Typography
                                        sx={{ color: "text.secondary", fontSize: "16px", fontWeight: "bold" }}
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        display="flex"
                                        component="div"
                                    >
                                        {getNOxIndexString(device.latestData?.nox)}
                                    </Typography>
                                    <Typography
                                        sx={{ color: "text.secondary", fontSize: "12px" }}
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        display="flex"
                                        component="div"
                                    >
                                        NOx-indeksi
                                    </Typography>
                                </Stack>
                            </Grid>
                        )}
                        {isValueDefined(device.latestData?.temperature) && (
                            <Grid size={1} sx={{ display: 'flex', alignItems: 'center' }}>
                                <Stack spacing={0}>
                                    <Typography
                                        sx={{ color: "text.secondary", fontSize: "16px", fontWeight: "bold" }}
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        display="flex"
                                        component="div"
                                    >
                                        {getTemperatureC(device.latestData?.temperature)}
                                    </Typography>
                                    <Typography
                                        sx={{ color: "text.secondary", fontSize: "12px" }}
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        display="flex"
                                        component="div"
                                    >
                                        Lämpötila
                                    </Typography>
                                </Stack>
                            </Grid>
                        )}
                        {isValueDefined(device.latestData?.humidity) && (
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
                        {isValueDefined(device.latestData?.pressure) && (
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
