'use client';

import { useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    Button,
    TextField,
    Typography,
    Stack,
    CircularProgress,
    MenuItem,
    ButtonGroup,
} from '@mui/material';
import { useForm } from '@tanstack/react-form';
import dayjs from 'dayjs';
import useGetContract from '@energyapp/app/_hooks/queries/contract/useGetContract';
import useUpsertContract from '@energyapp/app/_hooks/mutations/contract/useUpsertContract';

type ContractFormValues = {
    id?: number;
    metering_point_ean: string;
    contract_type: number;
    start_date: Date;
    end_date?: Date;

    night_start_hour?: number;
    night_end_hour?: number;
    basic_fee: number;
    day_fee?: number;
    night_fee?: number;
    margin?: number;
    negative_no_tax?: boolean;

    night_start_hour_transfer?: number;
    night_end_hour_transfer?: number;
    basic_fee_transfer: number;
    day_fee_transfer: number;
    night_fee_transfer: number;
    tax_fee_transfer: number;
    negative_no_tax_transfer?: boolean;

    tax_percentage: number;
};

const contractTypeLabels: Record<number, string> = {
    1: 'Ei sopimusta',
    2: 'Kiinteä',
    3: 'Tuntihinnoittelu',
    4: 'Hybridi',
};

export default function ContractForm() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const meteringPointId = Array.isArray(params.meteringPointId)
        ? params.meteringPointId[0]
        : params.meteringPointId;
    const contractId = Array.isArray(params.contractId)
        ? Number(params.contractId[0])
        : Number(params.contractId);
    const isEdit = Boolean(contractId);

    const templateId = !isEdit ? Number(searchParams.get('templateId')) || undefined : undefined;

    const { data: contract, isLoading: isContractLoading } = useGetContract(
        { contractId }
    );

    const { data: templateContract, isLoading: isTemplateLoading } = useGetContract(
        { contractId: templateId! },
    );

    const upsert = useUpsertContract({
        onSuccess: () => {
            router.back();
        },
    });

    const initialValues = useMemo<ContractFormValues>(() => {
        if (isEdit && contract) {
            const toDate = (value: Date | string | null | undefined): Date | undefined => {
                if (!value) return undefined;
                return value instanceof Date ? value : new Date(value);
            };

            return {
                id: contract.id,
                metering_point_ean: contract.metering_point_ean ?? '',
                contract_type: contract.contract_type ?? 1,
                start_date: toDate(contract.start_date) ?? new Date(),
                end_date: toDate(contract.end_date),

                night_start_hour: contract.night_start_hour ?? 22,
                night_end_hour: contract.night_end_hour ?? 7,
                basic_fee: contract.basic_fee ?? 0,
                day_fee: contract.day_fee ?? undefined,
                night_fee: contract.night_fee ?? undefined,
                margin: contract.margin ?? undefined,
                negative_no_tax: contract.negative_no_tax ?? false,

                night_start_hour_transfer: contract.night_start_hour_transfer ?? 22,
                night_end_hour_transfer: contract.night_end_hour_transfer ?? 7,
                basic_fee_transfer: contract.basic_fee_transfer ?? 0,
                day_fee_transfer: contract.day_fee_transfer ?? 0,
                night_fee_transfer: contract.night_fee_transfer ?? 0,
                tax_fee_transfer: contract.tax_fee_transfer ?? 0,
                negative_no_tax_transfer: contract.negative_no_tax_transfer ?? false,

                tax_percentage: contract.tax_percentage ?? 25.5,
            };
        }

        const tpl = !isEdit ? templateContract : undefined;

        return {
            id: undefined,
            metering_point_ean: meteringPointId ?? '',
            contract_type: tpl?.contract_type ?? 1,
            start_date: new Date(),
            end_date: undefined,

            night_start_hour: tpl?.night_start_hour ?? 22,
            night_end_hour: tpl?.night_end_hour ?? 7,
            basic_fee: tpl?.basic_fee ?? 0,
            day_fee: tpl?.day_fee ?? undefined,
            night_fee: tpl?.night_fee ?? undefined,
            margin: tpl?.margin ?? undefined,
            negative_no_tax: tpl?.negative_no_tax ?? false,

            night_start_hour_transfer: tpl?.night_start_hour_transfer ?? 22,
            night_end_hour_transfer: tpl?.night_end_hour_transfer ?? 7,
            basic_fee_transfer: tpl?.basic_fee_transfer ?? 0,
            day_fee_transfer: tpl?.day_fee_transfer ?? 0,
            night_fee_transfer: tpl?.night_fee_transfer ?? 0,
            tax_fee_transfer: tpl?.tax_fee_transfer ?? 0,
            negative_no_tax_transfer: tpl?.negative_no_tax_transfer ?? false,

            tax_percentage: tpl?.tax_percentage ?? 25.5,
        };
    }, [isEdit, contract, templateContract]);

    const form = useForm({
        defaultValues: initialValues,
        onSubmit: async ({ value }) => {
            const payload = {
                id: value.id,
                metering_point_ean: value.metering_point_ean,
                contract_type: value.contract_type,
                start_date: dayjs(value.start_date).startOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
                end_date: value.end_date
                    ? dayjs(value.end_date).endOf('day').format('YYYY-MM-DDTHH:mm:ssZ')
                    : undefined,

                night_start_hour: value.night_start_hour ?? undefined,
                night_end_hour: value.night_end_hour ?? undefined,
                basic_fee: value.basic_fee,
                day_fee: value.day_fee ?? undefined,
                night_fee: value.night_fee ?? undefined,
                margin: value.margin ?? undefined,
                negative_no_tax: value.negative_no_tax ?? false,

                night_start_hour_transfer: value.night_start_hour_transfer ?? undefined,
                night_end_hour_transfer: value.night_end_hour_transfer ?? undefined,
                basic_fee_transfer: value.basic_fee_transfer,
                day_fee_transfer: value.day_fee_transfer,
                night_fee_transfer: value.night_fee_transfer,
                tax_fee_transfer: value.tax_fee_transfer,
                negative_no_tax_transfer: value.negative_no_tax_transfer ?? false,

                tax_percentage: value.tax_percentage ?? 25.5,
            };

            await upsert.mutateAsync(payload);
        },
    });

    if (isEdit && isContractLoading) {
        return (
            <Box
                sx={{
                    margin: '40px auto',
                    borderRadius: 4,
                    boxShadow: 2,
                    p: 3,
                    display: 'grid',
                    placeItems: 'center',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!isEdit && templateId && isTemplateLoading) {
        return (
            <Box
                sx={{
                    margin: '40px auto',
                    borderRadius: 4,
                    boxShadow: 2,
                    p: 3,
                    display: 'grid',
                    placeItems: 'center',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    const parseOptionalNumber = (value: string): number | undefined => {
        if (value === '') return undefined;
        return Number(value);
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" mb={2} align="center">
                {isEdit ? 'Muokkaa sopimusta' : 'Luo uusi sopimus'}
            </Typography>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <Stack spacing={2}>
                    {/* Metering point EAN */}
                    <form.Field name="metering_point_ean">
                        {(field) => (
                            <TextField
                                label="Mittapaikan EAN"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                required
                                disabled={true}
                                error={field.state.meta.isTouched && !field.state.meta.isValid}
                                helperText={
                                    field.state.meta.isTouched
                                        ? field.state.meta.errors.join(', ')
                                        : ' '
                                }
                            />
                        )}
                    </form.Field>

                    {/* Contract type */}
                    <form.Field name="contract_type">
                        {(field) => (
                            <TextField
                                select
                                label="Tyyppi"
                                value={field.state.value}
                                onChange={(e) => {
                                    const newType = Number(e.target.value);
                                    field.handleChange(newType);
                                    if (newType === 3) {
                                        form.setFieldValue('day_fee', undefined as never);
                                        form.setFieldValue('night_fee', undefined as never);
                                    } else if (newType === 2 || newType === 4) {
                                        form.setFieldValue('margin', undefined as never);
                                    }
                                }}
                                required
                            >
                                {Object.entries(contractTypeLabels).map(([key, label]) => (
                                    <MenuItem key={key} value={Number(key)}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    </form.Field>

                    {/* Start and end date */}
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
                                    const v = e.target.value;
                                    if (!v) return;
                                    const [year, month, day] = v.split('-').map(Number);
                                    if (!year || !month || !day) return;
                                    field.handleChange(new Date(year, month - 1, day));
                                }}
                                required
                            />
                        )}
                    </form.Field>

                    <form.Field name="end_date">
                        {(field) => (
                            <TextField
                                label="Lopetuspäivä"
                                type="date"
                                value={
                                    field.state.value instanceof Date
                                        ? dayjs(field.state.value).format('YYYY-MM-DD')
                                        : ''
                                }
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (!v) return;
                                    const [year, month, day] = v.split('-').map(Number);
                                    if (!year || !month || !day) return;
                                    field.handleChange(new Date(year, month - 1, day));
                                }}
                                disabled={true}
                                helperText="Valinnainen"
                            />
                        )}
                    </form.Field>

                    {/* Energy section */}
                    <Typography variant="subtitle1">Energia (kulutus)</Typography>

                    <form.Field name="night_start_hour">
                        {(field) => (
                            <TextField
                                label="Yöajan alku (h)"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(Number(e.target.value))}
                                type="number"
                                inputProps={{ min: 0, max: 23 }}
                            />
                        )}
                    </form.Field>

                    <form.Field name="night_end_hour">
                        {(field) => (
                            <TextField
                                label="Yöajan loppu (h)"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(Number(e.target.value))}
                                type="number"
                                inputProps={{ min: 0, max: 23 }}
                            />
                        )}
                    </form.Field>

                    <form.Field name="basic_fee">
                        {(field) => (
                            <TextField
                                label="Perusmaksu (€/kk)"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(Number(e.target.value))}
                                type="number"
                                required
                            />
                        )}
                    </form.Field>

                    <form.Subscribe selector={(state) => state.values.contract_type}>
                        {(contractType) => (
                            <>
                                {contractType !== 3 && (
                                    <>
                                        <form.Field name="day_fee">
                                            {(field) => (
                                                <TextField
                                                    label="Päivän hinta (snt/kWh)"
                                                    type="number"
                                                    value={field.state.value ?? ''}
                                                    onChange={(e) => field.handleChange(parseOptionalNumber(e.target.value) as never)}
                                                />
                                            )}
                                        </form.Field>

                                        <form.Field name="night_fee">
                                            {(field) => (
                                                <TextField
                                                    label="Yön hinta (snt/kWh)"
                                                    type="number"
                                                    value={field.state.value ?? ''}
                                                    onChange={(e) => field.handleChange(parseOptionalNumber(e.target.value) as never)}
                                                />
                                            )}
                                        </form.Field>
                                    </>
                                )}

                                {contractType !== 2 && contractType !== 4 && (
                                    <form.Field
                                        name="margin"
                                        validators={{
                                            onChange: ({ value, fieldApi }) => {
                                                const type = fieldApi.form.getFieldValue('contract_type');
                                                if (type === 3 && (value === undefined || value === null)) {
                                                    return 'Marginaali on pakollinen tuntihinnoittelulla';
                                                }
                                                return undefined;
                                            },
                                            onSubmit: ({ value, fieldApi }) => {
                                                const type = fieldApi.form.getFieldValue('contract_type');
                                                if (type === 3 && (value === undefined || value === null)) {
                                                    return 'Marginaali on pakollinen tuntihinnoittelulla';
                                                }
                                                return undefined;
                                            },
                                        }}
                                    >
                                        {(field) => (
                                            <TextField
                                                label="Marginaali (snt/kWh)"
                                                type="number"
                                                value={field.state.value ?? ''}
                                                onChange={(e) => field.handleChange(parseOptionalNumber(e.target.value) as never)}
                                                required={contractType === 3}
                                                error={field.state.meta.isTouched && !field.state.meta.isValid}
                                                helperText={
                                                    field.state.meta.isTouched
                                                        ? field.state.meta.errors.join(', ')
                                                        : ' '
                                                }
                                            />
                                        )}
                                    </form.Field>
                                )}
                            </>
                        )}
                    </form.Subscribe>

                    <form.Field name="negative_no_tax">
                        {(field) => (
                            <TextField
                                select
                                label="Negatiivinen ilman veroa"
                                value={field.state.value ? 'true' : 'false'}
                                onChange={(e) => field.handleChange(e.target.value === 'true')}
                            >
                                <MenuItem value="false">Ei</MenuItem>
                                <MenuItem value="true">Kyllä</MenuItem>
                            </TextField>
                        )}
                    </form.Field>

                    {/* Transfer section */}
                    <Typography variant="subtitle1">Siirto</Typography>

                    <form.Field name="night_start_hour_transfer">
                        {(field) => (
                            <TextField
                                label="Siirron yöajan alku (h)"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(Number(e.target.value))}
                                type="number"
                                inputProps={{ min: 0, max: 23 }}
                            />
                        )}
                    </form.Field>

                    <form.Field name="night_end_hour_transfer">
                        {(field) => (
                            <TextField
                                label="Siirron yöajan loppu (h)"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(Number(e.target.value))}
                                type="number"
                                inputProps={{ min: 0, max: 23 }}
                            />
                        )}
                    </form.Field>

                    <form.Field name="basic_fee_transfer">
                        {(field) => (
                            <TextField
                                label="Siirron perusmaksu (€/kk)"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(Number(e.target.value))}
                                type="number"
                                required
                            />
                        )}
                    </form.Field>

                    <form.Field name="day_fee_transfer">
                        {(field) => (
                            <TextField
                                label="Siirron päivän hinta (snt/kWh)"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(Number(e.target.value))}
                                type="number"
                                required
                            />
                        )}
                    </form.Field>

                    <form.Field name="night_fee_transfer">
                        {(field) => (
                            <TextField
                                label="Siirron yön hinta (snt/kWh)"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(Number(e.target.value))}
                                type="number"
                                required
                            />
                        )}
                    </form.Field>

                    <form.Field name="tax_fee_transfer">
                        {(field) => (
                            <TextField
                                label="Siirron veromaksu (snt/kWh)"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(Number(e.target.value))}
                                type="number"
                                required
                            />
                        )}
                    </form.Field>

                    <form.Field name="negative_no_tax_transfer">
                        {(field) => (
                            <TextField
                                select
                                label="Siirto: neg. ilman veroa"
                                value={field.state.value ? 'true' : 'false'}
                                onChange={(e) => field.handleChange(e.target.value === 'true')}
                            >
                                <MenuItem value="false">Ei</MenuItem>
                                <MenuItem value="true">Kyllä</MenuItem>
                            </TextField>
                        )}
                    </form.Field>

                    {/* Tax */}
                    <form.Field name="tax_percentage">
                        {(field) => (
                            <TextField
                                label="Veroprosentti (%)"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(Number(e.target.value))}
                                type="number"
                                required
                            />
                        )}
                    </form.Field>

                    {/* Submit */}
                    <ButtonGroup variant="contained" aria-label="Action button group" sx={{ width: '100%' }}>
                        <Button
                            type="button"
                            variant="outlined"
                            color="secondary"
                            fullWidth
                            onClick={() => router.back()}
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