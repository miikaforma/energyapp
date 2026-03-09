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
import { formatNumberToFI } from "@energyapp/utils/wattivahtiHelpers";
import { getAirPressureString, getHumidityString, getPictureUrl, isBatteryLow } from "@energyapp/utils/ruuviHelpers";
import DeviceImage from "./device-image";
import BigValue from "./progress-bar";
import { orange } from "@mui/material/colors";
import Battery2BarTwoToneIcon from '@mui/icons-material/Battery2BarTwoTone';

type Device = Awaited<
    ReturnType<typeof api.ruuvi.getDevicesWithInfo.query>
>[number];

export default function RuuviTagDevice({ device }: { device: Device }) {
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

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: '1rem', pb: 1 }}>
                    <span style={{ fontStyle: 'italic', color: "gray", whiteSpace: 'nowrap', fontSize: 12 }}><RelativeTime timestamp={dayjs(device?.latestData?.time)}></RelativeTime></span>
                    {isBatteryLow(device.latestData?.battery_voltage ?? 0, device.latestData?.temperature ?? 0) && (
                        <span style={{ color: "gray", whiteSpace: 'nowrap', fontSize: 12 }}>Paristo vähissä <Battery2BarTwoToneIcon sx={{ fontSize: 12, verticalAlign: 'middle', color: orange[500] }} /></span>
                    )}
                </Box>
            </Box>
        </Card>
    );
}
