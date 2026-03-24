CREATE TYPE shelly_notification_event_type AS ENUM (
    'DEVICE_OFFLINE',
    'DEVICE_ONLINE',
    'DEVICE_POWER_STARTED',
    'DEVICE_POWER_STOPPED',
    'GROUP_POWER_STARTED',
    'GROUP_POWER_STOPPED'
);

CREATE TYPE shelly_notification_scope_type AS ENUM (
    'DEVICE',
    'GROUP'
);

CREATE TABLE shelly_device_state (
    device_id TEXT PRIMARY KEY,
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_online BOOLEAN NOT NULL,
    online_changed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_power_w DOUBLE PRECISION NOT NULL,
    is_consuming BOOLEAN NOT NULL,
    consuming_changed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX shelly_device_state_is_online_idx
    ON shelly_device_state (is_online);

CREATE INDEX shelly_device_state_last_seen_at_idx
    ON shelly_device_state (last_seen_at);

CREATE TABLE shelly_notification_event (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT NULL,
    group_key TEXT NULL,
    event_type shelly_notification_event_type NOT NULL,
    event_key TEXT NOT NULL UNIQUE,
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT shelly_notification_event_target_check
        CHECK (
            (device_id IS NOT NULL AND group_key IS NULL) OR
            (device_id IS NULL AND group_key IS NOT NULL)
        )
);

CREATE INDEX shelly_notification_event_device_id_idx
    ON shelly_notification_event (device_id);

CREATE INDEX shelly_notification_event_group_key_idx
    ON shelly_notification_event (group_key);

CREATE INDEX shelly_notification_event_processed_at_idx
    ON shelly_notification_event (processed_at);

CREATE TABLE shelly_group_state (
    group_key TEXT PRIMARY KEY,
    is_consuming BOOLEAN NOT NULL,
    consuming_changed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE user_shelly_notification_preference (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    scope_type shelly_notification_scope_type NOT NULL,
    device_id TEXT NULL,
    group_key TEXT NULL,
    event_type shelly_notification_event_type NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    power_threshold_w DOUBLE PRECISION NULL,
    offline_delay_seconds INTEGER NULL,
    cooldown_seconds INTEGER NULL,
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    quiet_hours_start TIME NULL,
    quiet_hours_end TIME NULL,
    timezone_id TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT user_shelly_notification_preference_scope_check
        CHECK (
            (scope_type = 'DEVICE' AND device_id IS NOT NULL AND group_key IS NULL) OR
            (scope_type = 'GROUP' AND group_key IS NOT NULL AND device_id IS NULL)
        ),
    CONSTRAINT user_shelly_notification_preference_quiet_hours_check
        CHECK (
            (quiet_hours_enabled = FALSE AND quiet_hours_start IS NULL AND quiet_hours_end IS NULL) OR
            (quiet_hours_enabled = TRUE AND quiet_hours_start IS NOT NULL AND quiet_hours_end IS NOT NULL)
        )
);

CREATE UNIQUE INDEX user_shelly_notification_preference_unique_idx
    ON user_shelly_notification_preference (user_id, scope_type, COALESCE(device_id, ''), COALESCE(group_key, ''), event_type);
