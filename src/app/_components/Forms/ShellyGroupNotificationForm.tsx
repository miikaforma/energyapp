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
    FormControlLabel,
    FormHelperText,
    Stack,
    Select,
    MenuItem,
    Typography,
    TextField,
    FormControl,
    InputLabel,
} from '@mui/material'
import useGetShellyGroup from '@energyapp/app/_hooks/queries/shelly/useGetShellyGroup'
import useGetShellyGroupNotificationPreferences from '@energyapp/app/_hooks/queries/shelly/useGetShellyGroupNotificationPreferences'
import useUpsertShellyGroupNotificationPreferences from '@energyapp/app/_hooks/mutations/Shelly/useUpsertShellyGroupNotificationPreferences'

const GROUP_POWER_STARTED = 'GROUP_POWER_STARTED'
const GROUP_POWER_STOPPED = 'GROUP_POWER_STOPPED'

type FormValues = {
    timezoneId: string
    groupPowerStartedEnabled: boolean
    groupPowerStartedThreshold: string
    groupPowerStartedCooldown: string
    groupPowerStartedQuietHoursEnabled: boolean
    groupPowerStartedQuietHoursStart: string
    groupPowerStartedQuietHoursEnd: string
    groupPowerStoppedEnabled: boolean
    groupPowerStoppedThreshold: string
    groupPowerStoppedCooldown: string
    groupPowerStoppedQuietHoursEnabled: boolean
    groupPowerStoppedQuietHoursStart: string
    groupPowerStoppedQuietHoursEnd: string
}

const eventSections = [
    {
        title: 'Ryhmän kulutus alkoi',
        description: 'Ilmoitus lähetetään, kun ryhmä alkaa kuluttaa sähköä.',
        eventType: GROUP_POWER_STARTED,
        fields: {
            enabled: 'groupPowerStartedEnabled',
            threshold: 'groupPowerStartedThreshold',
            cooldown: 'groupPowerStartedCooldown',
            quietHoursEnabled: 'groupPowerStartedQuietHoursEnabled',
            quietHoursStart: 'groupPowerStartedQuietHoursStart',
            quietHoursEnd: 'groupPowerStartedQuietHoursEnd',
        } as const,
    },
    {
        title: 'Ryhmän kulutus loppui',
        description: 'Ilmoitus lähetetään, kun ryhmän kulutus loppuu.',
        eventType: GROUP_POWER_STOPPED,
        fields: {
            enabled: 'groupPowerStoppedEnabled',
            threshold: 'groupPowerStoppedThreshold',
            cooldown: 'groupPowerStoppedCooldown',
            quietHoursEnabled: 'groupPowerStoppedQuietHoursEnabled',
            quietHoursStart: 'groupPowerStoppedQuietHoursStart',
            quietHoursEnd: 'groupPowerStoppedQuietHoursEnd',
        } as const,
    },
] as const

const browserTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Helsinki'

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

export default function ShellyGroupNotificationForm() {
    const params = useParams()
    const groupKey = Array.isArray(params.groupKey) ? params.groupKey[0] : params.groupKey

    const { data: group, isLoading: isGroupLoading } = useGetShellyGroup({ groupKey })
    const { data: preferences, isLoading: isPreferencesLoading } =
        useGetShellyGroupNotificationPreferences({ groupKey })

    const initialValues = useMemo<FormValues>(() => {
        const startedPreference = preferences?.find(
            (item) => item.eventType === GROUP_POWER_STARTED,
        )
        const stoppedPreference = preferences?.find(
            (item) => item.eventType === GROUP_POWER_STOPPED,
        )
        const timezoneId =
            startedPreference?.timezoneId ??
            stoppedPreference?.timezoneId ??
            browserTimezone ??
            browserTimezone

        return {
            timezoneId,
            groupPowerStartedEnabled: startedPreference?.enabled ?? false,
            groupPowerStartedThreshold: toTextValue(startedPreference?.powerThresholdW),
            groupPowerStartedCooldown: toTextValue(startedPreference?.cooldownSeconds),
            groupPowerStartedQuietHoursEnabled:
                startedPreference?.quietHoursEnabled ?? false,
            groupPowerStartedQuietHoursStart: startedPreference?.quietHoursStart ?? '',
            groupPowerStartedQuietHoursEnd: startedPreference?.quietHoursEnd ?? '',
            groupPowerStoppedEnabled: stoppedPreference?.enabled ?? false,
            groupPowerStoppedThreshold: toTextValue(stoppedPreference?.powerThresholdW),
            groupPowerStoppedCooldown: toTextValue(stoppedPreference?.cooldownSeconds),
            groupPowerStoppedQuietHoursEnabled:
                stoppedPreference?.quietHoursEnabled ?? false,
            groupPowerStoppedQuietHoursStart: stoppedPreference?.quietHoursStart ?? '',
            groupPowerStoppedQuietHoursEnd: stoppedPreference?.quietHoursEnd ?? '',
        }
    }, [preferences])

    if (!groupKey || isGroupLoading || isPreferencesLoading) {
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
        <ShellyGroupNotificationFormContent
            groupKey={groupKey}
            groupName={group?.name ?? groupKey}
            initialValues={initialValues}
        />
    )
}

function ShellyGroupNotificationFormContent({
    groupKey,
    groupName,
    initialValues,
}: {
    groupKey: string
    groupName: string
    initialValues: FormValues
}) {
    const router = useRouter()
    const upsertPreferencesMutation = useUpsertShellyGroupNotificationPreferences({
        onSuccess: () => {
            router.push('/consumptions/shelly')
        },
    })
    const form = useForm({
        defaultValues: initialValues,
        onSubmit: async ({ value }) => {
            await upsertPreferencesMutation.mutateAsync({
                groupKey,
                preferences: eventSections.map((section) => {
                    const enabled = value[section.fields.enabled]
                    const quietHoursEnabled = value[section.fields.quietHoursEnabled]

                    return {
                        eventType: section.eventType,
                        enabled,
                        powerThresholdW: parseOptionalNumber(value[section.fields.threshold]),
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
                Muokkaa ryhmän ilmoituksia
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                {groupName}
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
                            state.values.groupPowerStartedQuietHoursEnabled ||
                            state.values.groupPowerStoppedQuietHoursEnabled,
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
