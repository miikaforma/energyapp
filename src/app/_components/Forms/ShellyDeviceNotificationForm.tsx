'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import {
    Box,
    Button,
    ButtonGroup,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    FormControl,
    FormControlLabel,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import useGetShellyDevices from '@energyapp/app/_hooks/queries/shelly/useGetShellyDevices'
import useGetShellyDeviceNotificationPreferences from '@energyapp/app/_hooks/queries/shelly/useGetShellyDeviceNotificationPreferences'
import useUpsertShellyDeviceNotificationPreferences from '@energyapp/app/_hooks/mutations/Shelly/useUpsertShellyDeviceNotificationPreferences'

const DEVICE_OFFLINE = 'DEVICE_OFFLINE'
const DEVICE_ONLINE = 'DEVICE_ONLINE'
const DEVICE_POWER_STARTED = 'DEVICE_POWER_STARTED'
const DEVICE_POWER_STOPPED = 'DEVICE_POWER_STOPPED'

const browserTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Helsinki'

type FormValues = {
    timezoneId: string
    deviceOfflineEnabled: boolean
    deviceOfflineDelay: string
    deviceOfflineCooldown: string
    deviceOfflineQuietHoursEnabled: boolean
    deviceOfflineQuietHoursStart: string
    deviceOfflineQuietHoursEnd: string
    deviceOnlineEnabled: boolean
    deviceOnlineCooldown: string
    deviceOnlineQuietHoursEnabled: boolean
    deviceOnlineQuietHoursStart: string
    deviceOnlineQuietHoursEnd: string
    devicePowerStartedEnabled: boolean
    devicePowerStartedThreshold: string
    devicePowerStartedCooldown: string
    devicePowerStartedQuietHoursEnabled: boolean
    devicePowerStartedQuietHoursStart: string
    devicePowerStartedQuietHoursEnd: string
    devicePowerStoppedEnabled: boolean
    devicePowerStoppedThreshold: string
    devicePowerStoppedCooldown: string
    devicePowerStoppedQuietHoursEnabled: boolean
    devicePowerStoppedQuietHoursStart: string
    devicePowerStoppedQuietHoursEnd: string
}

const eventSections = [
    {
        title: 'Laite offline',
        description: 'Ilmoitus lähetetään, kun laite on ollut poissa linjoilta.',
        eventType: DEVICE_OFFLINE,
        fields: {
            enabled: 'deviceOfflineEnabled',
            threshold: null,
            offlineDelay: 'deviceOfflineDelay',
            cooldown: 'deviceOfflineCooldown',
            quietHoursEnabled: 'deviceOfflineQuietHoursEnabled',
            quietHoursStart: 'deviceOfflineQuietHoursStart',
            quietHoursEnd: 'deviceOfflineQuietHoursEnd',
        } as const,
    },
    {
        title: 'Laite online',
        description: 'Ilmoitus lähetetään, kun laite palaa takaisin verkkoon.',
        eventType: DEVICE_ONLINE,
        fields: {
            enabled: 'deviceOnlineEnabled',
            threshold: null,
            offlineDelay: null,
            cooldown: 'deviceOnlineCooldown',
            quietHoursEnabled: 'deviceOnlineQuietHoursEnabled',
            quietHoursStart: 'deviceOnlineQuietHoursStart',
            quietHoursEnd: 'deviceOnlineQuietHoursEnd',
        } as const,
    },
    {
        title: 'Laitteen kulutus alkoi',
        description: 'Ilmoitus lähetetään, kun laitteen kulutus alkaa.',
        eventType: DEVICE_POWER_STARTED,
        fields: {
            enabled: 'devicePowerStartedEnabled',
            threshold: 'devicePowerStartedThreshold',
            offlineDelay: null,
            cooldown: 'devicePowerStartedCooldown',
            quietHoursEnabled: 'devicePowerStartedQuietHoursEnabled',
            quietHoursStart: 'devicePowerStartedQuietHoursStart',
            quietHoursEnd: 'devicePowerStartedQuietHoursEnd',
        } as const,
    },
    {
        title: 'Laitteen kulutus loppui',
        description: 'Ilmoitus lähetetään, kun laitteen kulutus loppuu.',
        eventType: DEVICE_POWER_STOPPED,
        fields: {
            enabled: 'devicePowerStoppedEnabled',
            threshold: 'devicePowerStoppedThreshold',
            offlineDelay: null,
            cooldown: 'devicePowerStoppedCooldown',
            quietHoursEnabled: 'devicePowerStoppedQuietHoursEnabled',
            quietHoursStart: 'devicePowerStoppedQuietHoursStart',
            quietHoursEnd: 'devicePowerStoppedQuietHoursEnd',
        } as const,
    },
] as const

const toTextValue = (value: number | null | undefined) =>
    value === null || value === undefined ? '' : String(value)

const parseOptionalNumber = (value: string) => {
    if (!value.trim()) {
        return null
    }

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

const parseOptionalInteger = (value: string) => {
    if (!value.trim()) {
        return null
    }

    const parsed = Number(value)
    return Number.isInteger(parsed) ? parsed : null
}

const validateNonNegativeNumber = (value: string, label: string) => {
    if (!value.trim()) {
        return undefined
    }

    const parsed = Number(value)

    if (!Number.isFinite(parsed)) {
        return `${label} pitää olla numero`
    }

    if (parsed < 0) {
        return `${label} ei voi olla negatiivinen`
    }

    return undefined
}

const timezones = Intl.supportedValuesOf('timeZone')

export default function ShellyDeviceNotificationForm() {
    const params = useParams()
    const deviceId = Array.isArray(params.deviceId) ? params.deviceId[0] : params.deviceId

    const { data: devices, isLoading: isDevicesLoading } = useGetShellyDevices()
    const { data: preferences, isLoading: isPreferencesLoading } =
        useGetShellyDeviceNotificationPreferences({ deviceId })

    const initialValues = useMemo<FormValues>(() => {
        const offlinePreference = preferences?.find((item) => item.eventType === DEVICE_OFFLINE)
        const onlinePreference = preferences?.find((item) => item.eventType === DEVICE_ONLINE)
        const powerStartedPreference = preferences?.find(
            (item) => item.eventType === DEVICE_POWER_STARTED,
        )
        const powerStoppedPreference = preferences?.find(
            (item) => item.eventType === DEVICE_POWER_STOPPED,
        )
        const timezoneId =
            offlinePreference?.timezoneId ??
            onlinePreference?.timezoneId ??
            powerStartedPreference?.timezoneId ??
            powerStoppedPreference?.timezoneId ??
            browserTimezone

        return {
            timezoneId,
            deviceOfflineEnabled: offlinePreference?.enabled ?? false,
            deviceOfflineDelay: toTextValue(offlinePreference?.offlineDelaySeconds),
            deviceOfflineCooldown: toTextValue(offlinePreference?.cooldownSeconds),
            deviceOfflineQuietHoursEnabled: offlinePreference?.quietHoursEnabled ?? false,
            deviceOfflineQuietHoursStart: offlinePreference?.quietHoursStart ?? '',
            deviceOfflineQuietHoursEnd: offlinePreference?.quietHoursEnd ?? '',
            deviceOnlineEnabled: onlinePreference?.enabled ?? false,
            deviceOnlineCooldown: toTextValue(onlinePreference?.cooldownSeconds),
            deviceOnlineQuietHoursEnabled: onlinePreference?.quietHoursEnabled ?? false,
            deviceOnlineQuietHoursStart: onlinePreference?.quietHoursStart ?? '',
            deviceOnlineQuietHoursEnd: onlinePreference?.quietHoursEnd ?? '',
            devicePowerStartedEnabled: powerStartedPreference?.enabled ?? false,
            devicePowerStartedThreshold: toTextValue(powerStartedPreference?.powerThresholdW),
            devicePowerStartedCooldown: toTextValue(powerStartedPreference?.cooldownSeconds),
            devicePowerStartedQuietHoursEnabled:
                powerStartedPreference?.quietHoursEnabled ?? false,
            devicePowerStartedQuietHoursStart:
                powerStartedPreference?.quietHoursStart ?? '',
            devicePowerStartedQuietHoursEnd: powerStartedPreference?.quietHoursEnd ?? '',
            devicePowerStoppedEnabled: powerStoppedPreference?.enabled ?? false,
            devicePowerStoppedThreshold: toTextValue(powerStoppedPreference?.powerThresholdW),
            devicePowerStoppedCooldown: toTextValue(powerStoppedPreference?.cooldownSeconds),
            devicePowerStoppedQuietHoursEnabled:
                powerStoppedPreference?.quietHoursEnabled ?? false,
            devicePowerStoppedQuietHoursStart:
                powerStoppedPreference?.quietHoursStart ?? '',
            devicePowerStoppedQuietHoursEnd: powerStoppedPreference?.quietHoursEnd ?? '',
        }
    }, [preferences])

    const deviceName = useMemo(() => {
        const device = devices?.find((item) => item.accessId === deviceId)
        return device?.serviceAccess?.accessName ?? deviceId ?? ''
    }, [deviceId, devices])

    if (!deviceId || isDevicesLoading || isPreferencesLoading) {
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
        )
    }

    return (
        <ShellyDeviceNotificationFormContent
            deviceId={deviceId}
            deviceName={deviceName}
            initialValues={initialValues}
        />
    )
}

function ShellyDeviceNotificationFormContent({
    deviceId,
    deviceName,
    initialValues,
}: {
    deviceId: string
    deviceName: string
    initialValues: FormValues
}) {
    const router = useRouter()
    const upsertPreferencesMutation = useUpsertShellyDeviceNotificationPreferences({
        onSuccess: () => {
            router.push('/consumptions/shelly')
        },
    })

    const form = useForm({
        defaultValues: initialValues,
        onSubmit: async ({ value }) => {
            await upsertPreferencesMutation.mutateAsync({
                deviceId,
                preferences: eventSections.map((section) => {
                    const quietHoursEnabled = value[section.fields.quietHoursEnabled]

                    return {
                        eventType: section.eventType,
                        enabled: value[section.fields.enabled],
                        powerThresholdW: section.fields.threshold
                            ? parseOptionalNumber(value[section.fields.threshold])
                            : null,
                        offlineDelaySeconds: section.fields.offlineDelay
                            ? parseOptionalInteger(value[section.fields.offlineDelay])
                            : null,
                        cooldownSeconds: parseOptionalInteger(value[section.fields.cooldown]),
                        quietHoursEnabled,
                        quietHoursStart: quietHoursEnabled
                            ? value[section.fields.quietHoursStart] || null
                            : null,
                        quietHoursEnd: quietHoursEnabled
                            ? value[section.fields.quietHoursEnd] || null
                            : null,
                        timezoneId: value.timezoneId || browserTimezone,
                    }
                }),
            })
        },
    })

    return (
        <Box sx={{ margin: '40px auto', borderRadius: 4, boxShadow: 2, p: 3 }}>
            <Typography variant="h5" align="center" gutterBottom>
                Muokkaa laitteen ilmoituksia
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                {deviceName}
            </Typography>

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }}
            >
                <form.Field name="timezoneId">
                    {(field) => (
                        <FormControl fullWidth>
                            <InputLabel id="timezone-select-label">Aikavyöhyke</InputLabel>
                            <Select
                                labelId="timezone-select-label"
                                id="timezone-select"
                                label="Aikavyöhyke"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                fullWidth
                                displayEmpty
                            >
                                {timezones.map((tz) => (
                                    <MenuItem key={tz} value={tz}>
                                        {tz}
                                    </MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>Käytetään hiljaisiin tunteihin.</FormHelperText>
                        </FormControl>
                    )}
                </form.Field>

                <Stack spacing={2} sx={{ mt: 2 }}>
                    {eventSections.map((section) => (
                        <Card key={section.eventType} variant="outlined">
                            <CardContent>
                                <Typography variant="h6">{section.title}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {section.description}
                                </Typography>

                                <form.Field name={section.fields.enabled}>
                                    {(field) => (
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={field.state.value}
                                                    onChange={(e) => field.handleChange(e.target.checked)}
                                                />
                                            }
                                            label="Ilmoitus käytössä"
                                        />
                                    )}
                                </form.Field>

                                <Stack spacing={2} sx={{ mt: 1 }}>
                                    {section.fields.threshold ? (
                                        <form.Field
                                            name={section.fields.threshold}
                                            validators={{
                                                onChange: ({ value }) =>
                                                    validateNonNegativeNumber(value, 'Tehoraja'),
                                            }}
                                        >
                                            {(field) => (
                                                <TextField
                                                    label="Tehoraja (W)"
                                                    type="number"
                                                    value={field.state.value}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    onBlur={field.handleBlur}
                                                    fullWidth
                                                    error={
                                                        field.state.meta.isTouched &&
                                                        !field.state.meta.isValid
                                                    }
                                                    helperText={
                                                        field.state.meta.isTouched
                                                            ? field.state.meta.errors.join(', ') || ' '
                                                            : ' '
                                                    }
                                                />
                                            )}
                                        </form.Field>
                                    ) : null}

                                    {section.fields.offlineDelay ? (
                                        <form.Field
                                            name={section.fields.offlineDelay}
                                            validators={{
                                                onChange: ({ value }) =>
                                                    validateNonNegativeNumber(value, 'Offline viive') ??
                                                    (value.trim() && !Number.isInteger(Number(value))
                                                        ? 'Offline viive pitää olla kokonaisluku'
                                                        : undefined),
                                            }}
                                        >
                                            {(field) => (
                                                <TextField
                                                    label="Offline viive (sekuntia)"
                                                    type="number"
                                                    value={field.state.value}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    onBlur={field.handleBlur}
                                                    fullWidth
                                                    error={
                                                        field.state.meta.isTouched &&
                                                        !field.state.meta.isValid
                                                    }
                                                    helperText={
                                                        field.state.meta.isTouched
                                                            ? field.state.meta.errors.join(', ') || ' '
                                                            : ' '
                                                    }
                                                />
                                            )}
                                        </form.Field>
                                    ) : null}

                                    <form.Field
                                        name={section.fields.cooldown}
                                        validators={{
                                            onChange: ({ value }) =>
                                                validateNonNegativeNumber(value, 'Jäähyaika') ??
                                                (value.trim() && !Number.isInteger(Number(value))
                                                    ? 'Jäähyaika pitää olla kokonaisluku'
                                                    : undefined),
                                        }}
                                    >
                                        {(field) => (
                                            <TextField
                                                label="Jäähyaika (sekuntia)"
                                                type="number"
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                onBlur={field.handleBlur}
                                                fullWidth
                                                error={
                                                    field.state.meta.isTouched &&
                                                    !field.state.meta.isValid
                                                }
                                                helperText={
                                                    field.state.meta.isTouched
                                                        ? field.state.meta.errors.join(', ') || ' '
                                                        : ' '
                                                }
                                            />
                                        )}
                                    </form.Field>

                                    <form.Field name={section.fields.quietHoursEnabled}>
                                        {(field) => (
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={field.state.value}
                                                        onChange={(e) => field.handleChange(e.target.checked)}
                                                    />
                                                }
                                                label="Hiljaiset tunnit käytössä"
                                            />
                                        )}
                                    </form.Field>

                                    <form.Subscribe
                                        selector={(state) =>
                                            Boolean(state.values[section.fields.quietHoursEnabled])
                                        }
                                    >
                                        {(quietHoursEnabled) => (
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                                <form.Field
                                                    name={section.fields.quietHoursStart}
                                                    validators={{
                                                        onSubmit: ({ value }) =>
                                                            quietHoursEnabled && !value
                                                                ? 'Aloitusaika on pakollinen'
                                                                : undefined,
                                                    }}
                                                >
                                                    {(field) => (
                                                        <TextField
                                                            label="Hiljaiset tunnit alkavat"
                                                            type="time"
                                                            value={field.state.value}
                                                            onChange={(e) => field.handleChange(e.target.value)}
                                                            onBlur={field.handleBlur}
                                                            fullWidth
                                                            disabled={!quietHoursEnabled}
                                                            InputLabelProps={{ shrink: true }}
                                                            error={
                                                                field.state.meta.isTouched &&
                                                                !field.state.meta.isValid
                                                            }
                                                            helperText={
                                                                field.state.meta.isTouched
                                                                    ? field.state.meta.errors.join(', ') || ' '
                                                                    : ' '
                                                            }
                                                        />
                                                    )}
                                                </form.Field>

                                                <form.Field
                                                    name={section.fields.quietHoursEnd}
                                                    validators={{
                                                        onSubmit: ({ value }) =>
                                                            quietHoursEnabled && !value
                                                                ? 'Lopetusaika on pakollinen'
                                                                : undefined,
                                                    }}
                                                >
                                                    {(field) => (
                                                        <TextField
                                                            label="Hiljaiset tunnit loppuvat"
                                                            type="time"
                                                            value={field.state.value}
                                                            onChange={(e) => field.handleChange(e.target.value)}
                                                            onBlur={field.handleBlur}
                                                            fullWidth
                                                            disabled={!quietHoursEnabled}
                                                            InputLabelProps={{ shrink: true }}
                                                            error={
                                                                field.state.meta.isTouched &&
                                                                !field.state.meta.isValid
                                                            }
                                                            helperText={
                                                                field.state.meta.isTouched
                                                                    ? field.state.meta.errors.join(', ') || ' '
                                                                    : ' '
                                                            }
                                                        />
                                                    )}
                                                </form.Field>
                                            </Stack>
                                        )}
                                    </form.Subscribe>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>

                <form.Subscribe
                    selector={(state) => ({
                        timezoneId: state.values.timezoneId,
                        anyQuietHoursEnabled:
                            state.values.deviceOfflineQuietHoursEnabled ||
                            state.values.deviceOnlineQuietHoursEnabled ||
                            state.values.devicePowerStartedQuietHoursEnabled ||
                            state.values.devicePowerStoppedQuietHoursEnabled,
                    })}
                >
                    {({ timezoneId, anyQuietHoursEnabled }) =>
                        anyQuietHoursEnabled && !timezoneId.trim() ? (
                            <FormHelperText error sx={{ mt: 2 }}>
                                Aikavyöhyke on pakollinen, jos käytät hiljaisia tunteja.
                            </FormHelperText>
                        ) : null
                    }
                </form.Subscribe>

                <ButtonGroup
                    variant="contained"
                    aria-label="Action button group"
                    sx={{ width: '100%', mt: 3 }}
                >
                    <Button
                        type="button"
                        variant="outlined"
                        color="secondary"
                        fullWidth
                        onClick={() => router.push('/consumptions/shelly')}
                    >
                        Peruuta
                    </Button>
                    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
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
