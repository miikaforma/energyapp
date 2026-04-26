'use client';

import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, List, ListItem, ListItemText, Fab, ListItemButton, ListItemIcon, ButtonGroup } from '@mui/material';
import { useParams, useRouter } from "next/navigation";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { type meteringPoint as MeteringPointType, type contracts as ContractType } from "@energyapp/generated/client";
import useGetMeteringPoint from '@energyapp/app/_hooks/queries/contract/useGetMeteringPoint';
import useGetContracts from '@energyapp/app/_hooks/queries/contract/useGetContracts';
import dayjs from 'dayjs';
import ContractDelete from '@energyapp/app/_components/Dialogs/ContractDelete';
import { useState } from 'react';
import useDeleteContract from '@energyapp/app/_hooks/mutations/contract/useDeleteContract';

export default function MeteringPointsPage() {
    const router = useRouter();
    const params = useParams();
    const meteringPointId = Array.isArray(params.meteringPointId) ? params.meteringPointId[0] : params.meteringPointId;
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contract, setContract] = useState<ContractType | null>(null);

    const { data: meteringPointData, isLoading: isLoadingMeteringPoint, isError: isErrorMeteringPoint } = useGetMeteringPoint({ meteringPointId });
    const { data: contractsData, isLoading: isLoadingContracts, isError: isErrorContracts } = useGetContracts({ meteringPointId });
    const deleteContractMutation = useDeleteContract({
        onSuccess: () => {
            setDeleteDialogOpen(false);
        },
    });

    if (isLoadingMeteringPoint || isLoadingContracts) {
        return <div>Ladataan sopimuksia...</div>;
    }
    if (isErrorMeteringPoint || isErrorContracts) {
        return <div>Virhe ladattaessa sopimuksia.</div>;
    }

    const getContractTypeLabel = (contractType: number) => {
        switch (contractType) {
            case 1: // None
                return "Ei sopimusta";
            case 2: // Fixed
                return "Kiinteä";
            case 3: // Spot
                return "Tuntihinnoittelu";
            case 4: // Hybrid
                return "Hybridi";
            default:
                return `Tuntematon (${contractType})`;
        }
    }

    const getContractRangeLabel = (startDate: Date, endDate: Date | null) => {
        const start = dayjs(startDate).format('D.M.YYYY');
        const end = endDate ? dayjs(endDate).format('D.M.YYYY') : 'jatkuu';
        return `${start} - ${end}`;
    }

    const handleDeleteConfirm = () => {
        if (contract) {
            deleteContractMutation.mutate({ id: contract.id });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
            <Fab
                variant="extended"
                size="small"
                color="primary"
                onClick={(e) => {
                    e.preventDefault();
                    router.push("/settings/meteringPoints");
                }}
                sx={{ position: "fixed", bottom: 69, right: 16 }}
            >
                <ArrowBackIcon sx={{ mr: 1 }} />
                Takaisin
            </Fab>
            <Paper elevation={2}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Sopimus</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow key='header'>
                                <TableCell colSpan={2} sx={{ padding: 0 }}>
                                    <List dense sx={{ paddingBlock: 0 }}>
                                        <ListItemButton sx={{ paddingBlock: 2 }} onClick={() => router.push(`/settings/meteringPoints/${meteringPointId}/contracts/create`)}>
                                            <ListItemIcon>
                                                <AddIcon color="primary" />
                                            </ListItemIcon>
                                            <ListItemText primary="Lisää sopimus" slotProps={{
                                                primary: {
                                                    color: 'primary',
                                                    sx: { fontWeight: 'medium' },
                                                    variant: 'body2',
                                                },
                                            }} />
                                        </ListItemButton>
                                    </List>
                                </TableCell>
                            </TableRow>
                            {contractsData && contractsData.length > 0 ? (
                                contractsData.map((contract: ContractType) => (
                                    <TableRow key={contract.id}>
                                        <TableCell sx={{ padding: 0 }}>
                                            <List dense sx={{ paddingBlock: 0 }}>
                                                <ListItem>
                                                    <ListItemText primary={getContractTypeLabel(contract.contract_type)} secondary={getContractRangeLabel(contract.start_date, contract.end_date)} />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemText
                                                        primary="Sopimus tiedot"
                                                        secondary={
                                                            <>
                                                                {`Perusmaksu: ${contract.basic_fee ?? '-'} € / kk`}<br />
                                                                {`Päivämaksu: ${contract.day_fee ?? '-'} € / kWh`}<br />
                                                                {`Yömaksu: ${contract.night_fee ?? '-'} € / kWh`}<br />
                                                                {`Marginaali: ${contract.margin ?? '-'} € / kWh`}<br />
                                                                {`Siirron perusmaksu: ${contract.basic_fee_transfer ?? '-'} € / kk`}<br />
                                                                {`Siirron päivämaksu: ${contract.day_fee_transfer ?? '-'} € / kWh`}<br />
                                                                {`Siirron yömaksu: ${contract.night_fee_transfer ?? '-'} € / kWh`}<br />
                                                                {`Siirron yötunnit: ${contract.night_start_hour_transfer ?? '-'} - ${contract.night_end_hour_transfer ?? '-'}`}<br />
                                                                {`Siirron veromaksu: ${contract.tax_fee_transfer ?? '-'} € / kWh`}<br />
                                                                {`Veroprosentti: ${contract.tax_percentage ?? '-'} %`}
                                                            </>
                                                        }
                                                    />
                                                </ListItem>
                                            </List>
                                        </TableCell>
                                        <TableCell>
                                            <ButtonGroup
                                                orientation="vertical"
                                                aria-label="Vertical button group"
                                                variant="text"
                                            >
                                                <Link href={`/settings/meteringPoints/${meteringPointData.metering_point_ean}/contracts/${contract.id}/edit`} passHref>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={e => e.stopPropagation()}
                                                        fullWidth
                                                        startIcon={<EditIcon />}
                                                    >
                                                        Muokkaa
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        router.push(`/settings/meteringPoints/${meteringPointId}/contracts/create?templateId=${contract.id}`);
                                                    }}
                                                    fullWidth
                                                    startIcon={<ContentCopyIcon />}
                                                >
                                                    Pohja
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        setContract(contract);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    color="error"
                                                    fullWidth
                                                    startIcon={<DeleteIcon />}
                                                >
                                                    Poista
                                                </Button>
                                            </ButtonGroup>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">Ei sopimuksia</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            <ContractDelete
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
            />
        </Box>
    );
}