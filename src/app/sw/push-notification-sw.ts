export function registerPushNotifications(self: ServiceWorkerGlobalScope) {
    self.addEventListener("push", (event) => {
        try {
            if (event.data) {
                const data = event.data.json();
                console.log("Push json", data);

                const title = titleBuilder(data) || "Default Title";
                event.waitUntil(
                    self.registration.showNotification(title, {
                        body: bodyBuilder(data),
                        icon: "/android-chrome-192x192.png",
                        timestamp: data.updatedAt,
                        data: data,
                    }),
                );
            }
        } catch (error) {
            console.error("Error parsing push data as JSON", error);

            if (event.data) {
                const data = event.data.text();
                console.log("Push text", data);

                event.waitUntil(
                    self.registration.showNotification(`EnergyApp`, {
                        body: data,
                        icon: "/android-chrome-192x192.png",
                    }),
                );
            }
        }
    });

    self.addEventListener("notificationclick", (event) => {
        event.notification.close();
        const { type, date, eventType, deviceId, groupKey } = event.notification.data || {};

        event.waitUntil(
            self.clients
                .matchAll({ type: "window", includeUncontrolled: true })
                .then((clientList) => {
                    if (clientList.length > 0) {
                        let client = clientList[0];
                        for (let clientItem of clientList) {
                            if (clientItem.focused) {
                                client = clientItem;
                            }
                        }

                        if (client) {
                            if (type === "NewSpotPriceUpdate") {
                                return client.focus().then(() => client.navigate(`/spotPrices/PT15M?date=${date}`));
                            }

                            if (eventType && deviceId) {
                                return client.focus().then(() => client.navigate(`/consumptions/shelly/${deviceId}`));
                            }

                            if (eventType && groupKey) {
                                return client.focus().then(() => client.navigate(`/consumptions/shelly/group/${groupKey}`));
                            }

                            return client.focus();
                        }
                    }

                    if (type === "NewSpotPriceUpdate") {
                        return self.clients.openWindow(`/spotPrices/PT15M?date=${date}`);
                    }

                    if (eventType && deviceId) {
                        return self.clients.openWindow(`/consumptions/shelly/${deviceId}`);
                    }

                    if (eventType && groupKey) {
                        return self.clients.openWindow(`/consumptions/shelly/group/${groupKey}`);
                    }

                    return self.clients.openWindow("/");
                })
        );
    });

    self.addEventListener('notificationclose', event => {
        const closedNotification = event.notification;
        const notificationData = closedNotification.data;

        console.log('Notification was closed:', notificationData);
    });

    function titleBuilder(data) {
        switch (data.type) {
            case "NewSpotPriceUpdate": {
                return `${new Date(data.date).toLocaleDateString('fi-FI')} - hinnat päivitetty`;
            }
        }

        switch (data.eventType) {
            case "DEVICE_OFFLINE":
                return data.title ?? `${data.deviceName ?? "Laite"} offline`;
            case "DEVICE_ONLINE":
                return data.title ?? `${data.deviceName ?? "Laite"} online`;
            case "DEVICE_POWER_STARTED":
                return data.title ?? `${data.deviceName ?? "Laite"} kuluttaa`;
            case "DEVICE_POWER_STOPPED":
                return data.title ?? `${data.deviceName ?? "Laite"} kulutus loppui`;
            case "GROUP_POWER_STARTED":
                return data.title ?? `${data.deviceName ?? "Ryhmä"} kuluttaa`;
            case "GROUP_POWER_STOPPED":
                return data.title ?? `${data.deviceName ?? "Ryhmä"} kulutus loppui`;
        }

        return data.title;
    }

    function bodyBuilder(data) {
        switch (data.type) {
            case "NewSpotPriceUpdate": {
                console.log(JSON.stringify(data));
                const str = [
                    `Keskihinta: ${Number(data.average).toLocaleString("fi-FI", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })} c/kWh`,
                    `Alin hinta: ${Number(data.min).toLocaleString("fi-FI", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })} c/kWh`,
                    `Korkein hinta: ${Number(data.max).toLocaleString("fi-FI", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })} c/kWh`,
                    `Yön hinta (01:00 - 09:00): ${Number(data.offPeak1).toLocaleString("fi-FI", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })} c/kWh`,
                    `Päivän hinta (09:00 - 21:00): ${Number(data.peak).toLocaleString("fi-FI", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })} c/kWh`,
                    `Illan hinta (21:00 - 01:00): ${Number(data.offPeak2).toLocaleString("fi-FI", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })} c/kWh`,
                ].join('\n');
                return str;
            }
        }

        switch (data.eventType) {
            case "DEVICE_POWER_STARTED":
            case "DEVICE_POWER_STOPPED":
            case "DEVICE_OFFLINE":
            case "DEVICE_ONLINE":
            case "GROUP_POWER_STARTED":
            case "GROUP_POWER_STOPPED":
                return data.body;
        }

        return data.body ?? "";
    }
}