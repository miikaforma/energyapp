'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box,
    Button,
    MenuItem,
    TextField,
    Typography,
    Stack,
    CircularProgress,
    ButtonGroup,
    Divider,
    FormControl,
    InputLabel,
    Select,
    Checkbox,
    ListItemText,
} from '@mui/material';
import { useForm } from '@tanstack/react-form';
import { accountingPointType } from '@energyapp/generated/enums';
import useUpsertMeteringPoint from '@energyapp/app/_hooks/mutations/contract/useUpsertMeteringPoint';
import useGetMeteringPoint from '@energyapp/app/_hooks/queries/contract/useGetMeteringPoint';
import useGetMeteringPointUserAccesses from '@energyapp/app/_hooks/queries/contract/useGetMeteringPointUserAccesses';
import useGetMeteringPointAccessUsers from '@energyapp/app/_hooks/queries/contract/useGetMeteringPointAccessUsers';
import useSetMeteringPointUserAccesses from '@energyapp/app/_hooks/mutations/contract/useSetMeteringPointUserAccesses';
import { type meteringPoint as MeteringPointType } from "@energyapp/generated/client";
import dayjs from 'dayjs';

const accountingPointTypeLabels: Record<string, string> = {
    AG01: 'AG01 - Kulutus (Consumption)',
    AG02: 'AG02 - Tuotanto (Production)',
};

export default function MeteringPointForm() {
    const router = useRouter();
    const params = useParams();
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const meteringPointId = Array.isArray(params.meteringPointId) ? params.meteringPointId[0] : params.meteringPointId;
    const isEdit = Boolean(meteringPointId);

    // Fetch metering point data if editing
    const { data: meteringPoint, isLoading: isMeteringPointLoading } = useGetMeteringPoint({ meteringPointId });
    const { data: userAccesses } = useGetMeteringPointUserAccesses({ meteringPointId });
    const { data: users } = useGetMeteringPointAccessUsers();

    const setUserAccesses = useSetMeteringPointUserAccesses();

    useEffect(() => {
        if (!isEdit || !userAccesses) return;
        setSelectedUserIds(userAccesses.map((access) => access.userId));
    }, [isEdit, userAccesses]);

    const upsert = useUpsertMeteringPoint({
        onSuccess: () => {
            // onSuccess?.();
            router.push('/settings/meteringPoints');
        },
    });

    const initialValues = useMemo<MeteringPointFormValues>(() => {
        if (isEdit && meteringPoint) {
            return {
                metering_point_ean: meteringPoint.metering_point_ean,
                type: meteringPoint.type || 'AG01',
                street_name: meteringPoint.street_name || '',
                building_number: meteringPoint.building_number || '',
                postal_code: meteringPoint.postal_code || '',
                post_office: meteringPoint.post_office || '',
                start_date: meteringPoint.start_date instanceof Date ? meteringPoint.start_date : new Date(meteringPoint.start_date ?? Date.now()),
            };
        }
        return {
            metering_point_ean: '',
            type: 'AG01',
            street_name: '',
            building_number: '',
            postal_code: '',
            post_office: '',
            start_date: new Date(),
        };
    }, [isEdit, meteringPoint]);

    const form = useForm({
        defaultValues: initialValues,
        onSubmit: async ({ value }) => {
            const payload = {
                ...value,
                street_name: value.street_name ?? undefined,
                building_number: value.building_number ?? undefined,
                postal_code: value.postal_code ?? undefined,
                post_office: value.post_office ?? undefined,
                start_date:
                    value.start_date instanceof Date
                        ? dayjs(value.start_date).format('YYYY-MM-DDTHH:mm:ssZ')
                        : value.start_date,
            };

            await upsert.mutateAsync(payload);
        },
    });

    if (isEdit && isMeteringPointLoading) {
        return (
            <Box sx={{ margin: '40px auto', borderRadius: 4, boxShadow: 2, p: 3, display: 'grid', placeItems: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" mb={2} align="center">
                {isEdit ? 'Muokkaa mittauspistettä' : 'Luo mittauspiste'}
            </Typography>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <Stack spacing={2}>
                    <form.Field name="metering_point_ean" validators={{
                        onBlur: ({ value }) => !value.trim() ? 'EAN-tunnus on pakollinen' : undefined,
                    }}>
                        {(field) => (
                            <TextField
                                label="EAN-tunnus"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                required
                                disabled={isEdit}
                                error={field.state.meta.isTouched && !field.state.meta.isValid}
                                helperText={field.state.meta.isTouched ? field.state.meta.errors.join(', ') : ' '}
                            />
                        )}
                    </form.Field>
                    <form.Field name="type">
                        {(field) => (
                            <TextField
                                select
                                label="Tyyppi"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value as accountingPointType)}
                                required
                                helperText="AG01 = Kulutus (Consumption), AG02 = Tuotanto (Production)"
                            >
                                {Object.values(accountingPointType).map((t) => (
                                    <MenuItem key={t} value={t}>
                                        {accountingPointTypeLabels[t] || t}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    </form.Field>
                    <form.Field name="street_name">
                        {(field) => (
                            <TextField
                                label="Katuosoite"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                        )}
                    </form.Field>
                    <form.Field name="building_number">
                        {(field) => (
                            <TextField
                                label="Rakennusnumero"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                        )}
                    </form.Field>
                    <form.Field name="postal_code">
                        {(field) => (
                            <TextField
                                label="Postinumero"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                        )}
                    </form.Field>
                    <form.Field name="post_office">
                        {(field) => (
                            <TextField
                                label="Postitoimipaikka"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                        )}
                    </form.Field>
                    <form.Field name="start_date">
                        {(field) => (
                            <TextField
                                label="Aloituspäivä"
                                type="date"
                                value={
                                    field.state.value instanceof Date
                                        ? dayjs(field.state.value).format('YYYY-MM-DD')
                                        : ''
                                }
                                onChange={(e) => {
                                    const parts = e.target.value.split('-');
                                    if (parts.length !== 3) return;

                                    const year = Number(parts[0]);
                                    const month = Number(parts[1]);
                                    const day = Number(parts[2]);

                                    if (
                                        Number.isNaN(year) ||
                                        Number.isNaN(month) ||
                                        Number.isNaN(day)
                                    ) {
                                        return;
                                    }

                                    field.handleChange(new Date(year, month - 1, day, 0, 0, 0));
                                }}
                                InputLabelProps={{ shrink: true }}
                            />
                        )}
                    </form.Field>

                    {isEdit && (
                        <>
                            <Divider />
                            <Typography variant="subtitle1">Käyttöoikeudet</Typography>
                            <FormControl fullWidth>
                                <InputLabel id="metering-point-users-label">Käyttäjät</InputLabel>
                                <Select
                                    labelId="metering-point-users-label"
                                    multiple
                                    value={selectedUserIds}
                                    label="Käyttäjät"
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSelectedUserIds(typeof value === 'string' ? value.split(',') : value);
                                    }}
                                    renderValue={(selected) => {
                                        const selectedIds = selected as string[];
                                        const labels = selectedIds
                                            .map((id) => {
                                                const user = users?.find((u) => u.id === id);
                                                return user?.email ?? user?.name ?? id;
                                            })
                                            .filter(Boolean);
                                        return labels.join(', ');
                                    }}
                                >
                                    {(users ?? []).map((user) => {
                                        const label = user.email ?? user.name ?? user.id;
                                        return (
                                            <MenuItem key={user.id} value={user.id}>
                                                <Checkbox checked={selectedUserIds.includes(user.id)} />
                                                <ListItemText primary={label} />
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    disabled={!meteringPointId || setUserAccesses.isLoading}
                                    onClick={async () => {
                                        if (!meteringPointId) return;
                                        await setUserAccesses.mutateAsync({
                                            metering_point_ean: meteringPointId,
                                            userIds: selectedUserIds,
                                        });
                                    }}
                                >
                                    Tallenna käyttöoikeudet
                                </Button>
                            </Stack>
                        </>
                    )}

                    <ButtonGroup variant="contained" aria-label="Action button group" sx={{ width: '100%' }}>
                        <Button
                            type="button"
                            variant="outlined"
                            color="secondary"
                            fullWidth
                            onClick={() => router.push('/settings/meteringPoints')}
                        >
                            Peruuta
                        </Button>
                        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                            {([canSubmit, isSubmitting]) => (
                                <Button type="submit" variant="contained" color="primary" fullWidth disabled={!canSubmit || isSubmitting}>
                                    {isSubmitting ? 'Tallennetaan...' : 'Tallenna'}
                                </Button>
                            )}
                        </form.Subscribe>
                    </ButtonGroup>
                </Stack>
            </form>
        </Box>
    );
}

export type MeteringPointFormValues = Omit<
    MeteringPointType,
    'createdAt' | 'updatedAt'
>
// & {
//     // For form, make all fields except metering_point_ean optional (for flexibility)
//     metering_point_ean: string;
//     type?: keyof typeof accountingPointType;
//     street_name?: string;
//     building_number?: string;
//     postal_code?: string;
//     post_office?: string;
//     start_date?: string;
// };