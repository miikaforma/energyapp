self.addEventListener("push", (event) => {
  try {
    const data = event.data.json();
    console.log("Push json", data);

    event.waitUntil(
      self.registration.showNotification(titleBuilder(data), {
        body: bodyBuilder(data),
        icon: "/android-chrome-192x192.png",
        timestamp: data.updatedAt,
        tag: "price-update",
        renotify: true
      }),
    );
  }
  catch (error) {
    console.error("Error parsing push data as JSON", error);

    const data = event.data.text();
    console.log("Push text", data);

    event.waitUntil(
      self.registration.showNotification(`EnergyApp`, {
        body: data,
        icon: "/android-chrome-192x192.png",
      }),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
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
          return client.focus();
        }
        return clients.openWindow("/");
      }),
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
}
