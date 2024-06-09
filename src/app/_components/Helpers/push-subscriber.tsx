"use client";
import useAddPushSubscription from "@energyapp/app/_hooks/mutations/useAddPushSubscription";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function PushSubscriber({
  applicationServerKey,
}: {
  applicationServerKey: string;
}) {
  const { mutate: sendSubscription } = useAddPushSubscription();
  const { data: session, status } = useSession();
  const username = session?.user?.name;

  useEffect(() => {
    if ("Notification" in window && status === "authenticated") {
      const setupNotifications = () => {
        void navigator.serviceWorker.ready.then((reg) => {
          void reg.pushManager.getSubscription().then((sub) => {
            if (
              sub &&
              !(
                sub.expirationTime &&
                Date.now() > sub.expirationTime - 5 * 60 * 1000
              )
            ) {
              console.log("Already subscribed", session, sub, username);

              const endpoint = sub.endpoint;
              const key = sub.getKey("p256dh");
              const auth = sub.getKey("auth");

              const base64Key = arrayBufferToBase64(key);
              const base64Auth = arrayBufferToBase64(auth);

              sendSubscription({
                endpoint: endpoint,
                p256dh: base64Key,
                auth: base64Auth,
              });
              // setSubscription(sub);
              // setIsSubscribed(true);
            } else {
              reg.pushManager
                .subscribe({
                  userVisibleOnly: true,
                  applicationServerKey:
                    urlBase64ToUint8Array(applicationServerKey),
                })
                .then((newSub) => {
                  console.log("User is subscribed:", newSub);

                  const endpoint = newSub.endpoint;
                  const key = newSub.getKey("p256dh");
                  const auth = newSub.getKey("auth");

                  const base64Key = arrayBufferToBase64(key);
                  const base64Auth = arrayBufferToBase64(auth);

                  sendSubscription({
                    endpoint: endpoint,
                    p256dh: base64Key,
                    auth: base64Auth,
                  });
                  // setSubscription(newSub);
                  // setIsSubscribed(true);
                })
                .catch((err) => {
                  if (Notification.permission === "denied") {
                    console.warn("Permission for notifications was denied");
                  } else {
                    console.error("Failed to subscribe the user: ", err);
                  }
                });
            }
          });
          // setRegistration(reg);
        });
      };
      console.log("Notification permission: ", Notification.permission);
      if (Notification.permission === "granted") {
        setupNotifications();
      } else if (Notification.permission !== "denied") {
        void Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            setupNotifications();
          }
        });
      }
    }
  }, [session, username]);

  return null;
}

function urlBase64ToUint8Array(base64String: string | undefined): Uint8Array {
  if (base64String === undefined) {
    throw new Error("VAPID public key is undefined");
  }

  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) {
    return "";
  }

  const uint8Array = new Uint8Array(buffer);
  const binaryString = Array.from(uint8Array)
    .map((byte) => String.fromCharCode(byte))
    .join("");
  return btoa(binaryString)
    .replace("+", "-")
    .replace("/", "_")
    .replace(/=+$/, "");
}
