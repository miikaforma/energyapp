interface NotificationOptions {
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
        navigate?: string;
    }>;
    image?: string;
    renotify?: boolean;
    timestamp?: number;
    vibrate?: number[];
}