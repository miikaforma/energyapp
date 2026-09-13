'use client';


import useGetMeteringPoints from '@energyapp/app/_hooks/queries/contract/useGetMeteringPoints';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, List, ListItem, ListItemText } from '@mui/material';
import { useRouter } from "next/navigation";
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import { type meteringPoint as MeteringPointType } from "@energyapp/generated/client";

const accountingPointTypeLabels: Record<string, string> = {
    AG01: 'AG01 - Kulutus (Consumption)',
    AG02: 'AG02 - Tuotanto (Production)',
};

export default function MeteringPointsPage() {
    const router = useRouter();
    const { data, isLoading, isError } = useGetMeteringPoints();

    if (isLoading) {
        return <div>Ladataan mittapaikkoja...</div>;
    }
    if (isError) {
        return <div>Virhe ladattaessa mittapaikkoja.</div>;
    }

    const getTypeLabel = (type: string) => {
        return accountingPointTypeLabels[type] || type;
    }

    const handleClick = (meteringPoint: MeteringPointType) => {
        router.push(`/settings/meteringPoints/${meteringPoint.metering_point_ean}/contracts`);
    };

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Mittapaikat</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => router.push(`/settings/meteringPoints/create`)}
                    startIcon={<AddIcon />}
                >
                    Luo mittapaikka
                </Button>
            </Box>
            <Paper elevation={2}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Mittapaikka</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data && data.length > 0 ? (
                                data.map((mp: MeteringPointType) => (
                                    <TableRow
                                        key={mp.metering_point_ean}
                                        hover
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleClick(mp)}
                                    >
                                        <TableCell>
                                            <List dense>
                                                <ListItem>
                                                    <ListItemText
                                                        primary={mp.metering_point_ean}
                                                        secondary={getTypeLabel(mp.type)}
                                                    />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemText
                                                        secondary={`${mp.street_name} ${mp.building_number}, ${mp.postal_code} ${mp.post_office}`}
                                                    />
                                                </ListItem>
                                            </List>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/settings/meteringPoints/edit/${mp.metering_point_ean}`} passHref>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    Muokkaa
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">Ei mittapaikkoja</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}