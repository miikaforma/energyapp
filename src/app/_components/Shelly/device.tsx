"use client";

import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    IconButton,
    Menu,
    MenuItem
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/navigation";
import { type api } from "@energyapp/trpc/server";
import RelativeTime from "../Helpers/relative-time";
import dayjs from "dayjs";
import { getPictureUrl } from "@energyapp/utils/ruuviHelpers";
import DeviceImage from "../DeviceComponents/device-image";
import ShellyImageUpload from "../ShellyImageUpload";
import BigValue from "../DeviceComponents/progress-bar";
import { formatMeasurement } from "@energyapp/utils/valueHelpers";
import MeasurementValue from "../DeviceComponents/measurement-value";
import { useRef, useState } from "react";
import { ShellyViewType } from "@energyapp/shared/enums";

type Device = Awaited<
    ReturnType<typeof api.shelly.getDevicesWithInfo.query>
>[number];

export default function ShellyDevice({ device }: { device: Device }) {
    const router = useRouter();
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [showDots, setShowDots] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleClick = () => {
        router.push(`/consumptions/shelly/device/${device.accessId}`);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchor(event.currentTarget);
    };
    const handleMenuClose = () => {
        setMenuAnchor(null);
    };
    const handleEditImage = () => {
        handleMenuClose();
        inputRef.current?.click();
    };

    const getConsumptionValue = () => {
        const measurement = formatMeasurement('power', device.latestData?.apower ?? 0);
        return <BigValue
            value={measurement?.value ?? "0"}
            unit={measurement?.unit ?? "W"}
            alertActive={false}
            label="Kulutus"
        />
    }

    return (
        <Card
            key={device.accessId}
            sx={{ minWidth: 320, display: 'flex', cursor: 'pointer', position: 'relative', '&:hover': { boxShadow: 'rgb(0, 140, 255) 0px 0px 0px 1px' }, pointerEvents: 'auto' }}
            onMouseEnter={() => setShowDots(true)}
            onMouseLeave={() => setShowDots(false)}
        >
            {/* Overlay for navigation, only triggers when clicking outside menu/image */}
            <Box
                sx={{ position: 'absolute', inset: 0, zIndex: 1 }}
                onClick={handleClick}
            />
            {/* Three dots menu */}
            {showDots && (
                <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                    <IconButton
                        size="small"
                        onClick={handleMenuOpen}
                    >
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={handleMenuClose}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <MenuItem
                            onClick={handleEditImage}
                        >Vaihda kuva</MenuItem>
                    </Menu>
                </Box>
            )}
            <DeviceImage imageUrl={getPictureUrl(device.serviceAccess.customData)} alt="Shelly Device" />
            <ShellyImageUpload deviceId={device.accessId} viewType={ShellyViewType.DEVICE} inputRef={inputRef} />
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
                    {getConsumptionValue()}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', pl: '1rem', pb: 1 }}>
                    <Grid container spacing={1} columns={2}>
                        <MeasurementValue value={device.latestData?.voltage} label="Jännite" measurementType="voltage" />
                        <MeasurementValue value={device.latestData?.temperature_c} label="Lämpötila" measurementType="temperatureC" />
                        <MeasurementValue value={device.latestData?.aenergy} label="Kokonaiskulutus" measurementType="power" />
                    </Grid>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: '1rem', pb: 1 }}>
                    <span style={{ fontStyle: 'italic', color: "gray", whiteSpace: 'nowrap', fontSize: 12 }}><RelativeTime timestamp={dayjs(device?.latestData?.time)}></RelativeTime></span>
                </Box>
            </Box>
        </Card>
    );
}
