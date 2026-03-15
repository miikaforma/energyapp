"use client";

import {
    Box,
    Card,
    CardContent,
    Grid,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Typography,
} from "@mui/material";
import UploadIcon from '@mui/icons-material/Upload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { red } from '@mui/material/colors';
import Divider from '@mui/material/Divider';
import { useRouter } from "next/navigation";
import { type api } from "@energyapp/trpc/server";
import RelativeTime from "../Helpers/relative-time";
import dayjs from "dayjs";
import { getPictureUrl } from "@energyapp/utils/ruuviHelpers";
import DeviceImage from "../DeviceComponents/device-image";
import BigValue from "../DeviceComponents/progress-bar";
import { formatMeasurement } from "@energyapp/utils/valueHelpers";
import MeasurementValue from "../DeviceComponents/measurement-value";
import { useRef, useState } from "react";
import ShellyImageUpload from "../ShellyImageUpload";
import { ShellyViewType } from "@energyapp/shared/enums";
import ShellyGroupDelete from '../Dialogs/ShellyGroupDelete';
import useDeleteShellyGroup from "@energyapp/app/_hooks/mutations/Shelly/useDeleteShellyGroup";
import { useMediaQuery } from '@mui/material';

type DeviceGroup = Awaited<
    ReturnType<typeof api.shelly.getGroups.query>
>[number];
type Device = Awaited<
    ReturnType<typeof api.shelly.getDevicesWithInfo.query>
>[number];

export default function ShellyGroup({ group, devices }: { group: DeviceGroup, devices: Device[] }) {
    const router = useRouter();
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [showDots, setShowDots] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const isMobile = useMediaQuery('(max-width:600px)');
    const deleteGroupMutation = useDeleteShellyGroup({
        onSuccess: () => {
            setDeleteDialogOpen(false);
        },
    });

    const handleClick = () => {
        router.push(`/consumptions/shelly/group/${group.groupKey}`);
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

    const handleEditGroup = () => {
        handleMenuClose();
        router.push(`/consumptions/shelly/group/edit/${group.groupKey}`);
    };

    const handleDeleteGroup = () => {
        handleMenuClose();
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        deleteGroupMutation.mutate({ groupKey: group.groupKey });
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    const getConsumptionValue = () => {
        const totalPower = devices.reduce((total, device) => {
            return total + (device.latestData?.apower ?? 0);
        }, 0);

        const measurement = formatMeasurement('power', totalPower);
        return <BigValue
            value={measurement?.value ?? "0"}
            unit={measurement?.unit ?? "W"}
            alertActive={false}
            label="Kulutus"
        />
    }

    const getTotalConsumption = () => {
        const totalEnergy = devices.reduce((total, device) => {
            return total + (device.latestData?.aenergy ?? 0);
        }, 0);

        return <MeasurementValue
            value={totalEnergy}
            label="Kokonaiskulutus"
            measurementType="power"
        />
    }

    if (devices?.length === 0) {
        // Group has no devices, render a placeholder card
        return (
            <Card
                key={group.groupKey}
                onClick={handleClick}
                sx={{ minWidth: 320, display: 'flex', cursor: 'pointer', '&:hover': { boxShadow: 'rgb(0, 140, 255) 0px 0px 0px 1px' } }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <CardContent sx={{ pl: '1rem', pb: 0 }}>
                        <Typography
                            gutterBottom
                            sx={{ color: "text.secondary", fontSize: 16, fontWeight: "bold" }}
                            justifyContent="flex-start"
                            alignItems="center"
                            display="flex"
                        >
                            {group.name}
                        </Typography>
                    </CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', pl: '1rem', pb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Ei laitteita tässä ryhmässä
                        </Typography>
                    </Box>
                </Box>
            </Card>
        );
    }

    return (
        <>
            <Card
                key={group.groupKey}
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
                {(isMobile || showDots) && (
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
                            <MenuItem onClick={handleEditImage}>
                                <ListItemIcon>
                                    <UploadIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Vaihda kuva</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={handleEditGroup}>
                                <ListItemIcon>
                                    <EditIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Muokkaa ryhmää</ListItemText>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleDeleteGroup}>
                                <ListItemIcon>
                                    <DeleteIcon fontSize="small" sx={{ color: red[500] }} />
                                </ListItemIcon>
                                <ListItemText>Poista ryhmä</ListItemText></MenuItem>
                        </Menu>
                    </Box>
                )}
                <DeviceImage imageUrl={getPictureUrl(group)} alt="Shelly Group" />
                <ShellyImageUpload deviceId={group.groupKey} viewType={ShellyViewType.GROUP} inputRef={inputRef} />
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <CardContent sx={{ pl: '1rem', pb: 0 }}>
                        <Typography
                            gutterBottom
                            sx={{ color: "text.secondary", fontSize: 16, fontWeight: "bold" }}
                            justifyContent="flex-start"
                            alignItems="center"
                            display="flex"
                        >
                            {group.name}
                        </Typography>
                    </CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', pl: '1rem', pb: 1 }}>
                        {getConsumptionValue()}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', pl: '1rem', pb: 1 }}>
                        <Grid container spacing={1} columns={2}>
                            {getTotalConsumption()}
                            {/* <MeasurementValue value={device.latestData?.voltage} label="Jännite" measurementType="voltage" />
                        <MeasurementValue value={device.latestData?.temperature_c} label="Lämpötila" measurementType="temperatureC" />
                        <MeasurementValue value={device.latestData?.aenergy} label="Kokonaiskulutus" measurementType="power" /> */}
                        </Grid>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: '1rem', pb: 1 }}>
                        <span style={{ fontStyle: 'italic', color: "gray", whiteSpace: 'nowrap', fontSize: 12 }}><RelativeTime timestamp={dayjs(devices[0]?.latestData?.time)}></RelativeTime></span>
                    </Box>
                </Box>
            </Card>
            <ShellyGroupDelete
                open={deleteDialogOpen}
                groupName={group.name}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
}
