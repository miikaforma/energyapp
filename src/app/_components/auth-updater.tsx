'use client';

import { useEffect } from "react"
import { useSession } from "next-auth/react"

export default function AuthUpdater() {
    const { data: session, status, update } = useSession()

    // Polling the session every 1 hour
    useEffect(() => {
        // TIP: You can also use `navigator.onLine` and some extra event handlers
        // to check if the user is online and only update the session if they are.
        // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
        const interval = setInterval(async () => {
            try {
                await update();
            } catch (err) {
                console.error(err);
            }
        }, 1000 * 60 * 60)
        return () => clearInterval(interval)
    }, [update])

    // Listen for when the page is visible, if the user switches tabs
    // and makes our tab visible again, re-fetch the session
    useEffect(() => {
        const visibilityHandler = async () => {
            if (document.visibilityState === "visible") {
                try {
                    await update();
                } catch (err) {
                    console.error(err);
                }
            }
        }
        window.addEventListener("visibilitychange", visibilityHandler, false)
        return () =>
            window.removeEventListener("visibilitychange", visibilityHandler, false)
    }, [update])

    return null
}