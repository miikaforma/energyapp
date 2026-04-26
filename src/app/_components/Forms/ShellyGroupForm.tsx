'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import {
    Typography,
    Box,
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    List,
    ListItem,
    FormHelperText,
    CircularProgress,
    ButtonGroup,
} from '@mui/material'
import useGetShellyDevices from '@energyapp/app/_hooks/queries/shelly/useGetShellyDevices'
import useGetShellyGroup from '@energyapp/app/_hooks/queries/shelly/useGetShellyGroup'
import useUpsertShellyGroup from '@energyapp/app/_hooks/mutations/Shelly/useUpsertShellyGroup'

type Device = {
    accessId: string
    serviceAccess?: {
        accessName?: string
    }
}

type FormValues = {
    groupName: string
    selectedDevices: string[]
}

export default function ShellyGroupForm() {
    const router = useRouter()
    const params = useParams()
    const groupKey = Array.isArray(params.groupKey) ? params.groupKey[0] : params.groupKey
    const isEdit = Boolean(groupKey)

    const { data: devices, isLoading: isDevicesLoading } = useGetShellyDevices()
    const { data: group, isLoading: isGroupLoading } = useGetShellyGroup({ groupKey })
    const upsertGroupMutation = useUpsertShellyGroup({
        onSuccess: () => {
            router.push('/consumptions/shelly');
        },
    });

    const initialValues = useMemo<FormValues>(() => {
        const selectedDevicesRaw = group?.devices ?? []

        return {
            groupName: group?.name ?? group?.name ?? '',
            selectedDevices: selectedDevicesRaw
                .map((item: string | { accessId?: string }) =>
                    typeof item === 'string' ? item : item?.accessId,
                )
                .filter(Boolean) as string[],
        }
    }, [group])

    const form = useForm({
        defaultValues: initialValues,
        onSubmit: async ({ value }) => {
            await upsertGroupMutation.mutateAsync({
                groupKey,
                groupName: value.groupName,
                deviceAccessIds: value.selectedDevices,
            });
        },
    });

    // Important for edit mode:
    // wait until the async group has loaded before creating the form UI,
    // so the fetched values are used as initial values.
    if (isEdit && isGroupLoading) {
        return (
            <Box sx={{ margin: '40px auto', borderRadius: 4, boxShadow: 2, p: 3, display: 'grid', placeItems: 'center' }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={{ margin: '40px auto', borderRadius: 4, boxShadow: 2, p: 3 }}>
            <Typography variant="h5" align="center" gutterBottom>
                {isEdit ? 'Muokkaa ryhmää' : 'Luo ryhmä'}
            </Typography>

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }}
            >
                <form.Field
                    name="groupName"
                    validators={{
                        onBlur: ({ value }) =>
                            !value.trim() ? 'Ryhmän nimi on pakollinen' : undefined,
                    }}
                >
                    {(field) => (
                        <TextField
                            label="Ryhmän nimi"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            fullWidth
                            margin="normal"
                            error={field.state.meta.isTouched && !field.state.meta.isValid}
                            helperText={
                                field.state.meta.isTouched
                                    ? field.state.meta.errors.join(', ')
                                    : ' '
                            }
                        />
                    )}
                </form.Field>

                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Valitse laitteet ryhmään:
                </Typography>

                <form.Field
                    name="selectedDevices"
                    validators={{
                        onSubmit: ({ value }) =>
                            value.length === 0 ? 'Valitse vähintään yksi laite' : undefined,
                    }}
                >
                    {(field) => (
                        <>
                            <List>
                                {isDevicesLoading ? (
                                    <ListItem>
                                        <CircularProgress size={20} />
                                    </ListItem>
                                ) : (
                                    (devices as Device[] | undefined)?.map((device) => {
                                        const checked = field.state.value.includes(device.accessId)

                                        return (
                                            <ListItem key={device.accessId} disableGutters>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={checked}
                                                            onChange={() => {
                                                                if (checked) {
                                                                    field.handleChange(
                                                                        field.state.value.filter((id) => id !== device.accessId),
                                                                    )
                                                                } else {
                                                                    field.handleChange([...field.state.value, device.accessId])
                                                                }
                                                            }}
                                                        />
                                                    }
                                                    label={
                                                        <Typography>
                                                            {device.serviceAccess?.accessName ?? 'Nimetön laite'}
                                                            <Typography
                                                                component="span"
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{ ml: 0.5 }}
                                                            >
                                                                {device.accessId}
                                                            </Typography>
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                        )
                                    })
                                )}
                            </List>

                            {field.state.meta.errors.length > 0 ? (
                                <FormHelperText error>
                                    {field.state.meta.errors.join(', ')}
                                </FormHelperText>
                            ) : null}
                        </>
                    )}
                </form.Field>

                <ButtonGroup variant="contained" aria-label="Action button group" sx={{ width: '100%' }}>
                    <Button
                        type="button"
                        variant="outlined"
                        color="secondary"
                        fullWidth
                        onClick={() => router.push('/consumptions/shelly')}
                    >
                        Peruuta
                    </Button>
                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                    >
                        {([canSubmit, isSubmitting]) => (
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                disabled={!canSubmit || isSubmitting}
                            >
                                {isSubmitting ? 'Tallennetaan...' : 'Tallenna'}
                            </Button>
                        )}
                    </form.Subscribe>
                </ButtonGroup>
            </form>
        </Box>
    )
}