'use client';

import { useEffect } from "react"
import { useSession } from "next-auth/react"

export default function AuthUpdater() {
    const { update } = useSession()

    // Polling the session every 1 hour
    useEffect(() => {
        // TIP: You can also use `navigator.onLine` and some extra event handlers
        // to check if the user is online and only update the session if they are.
        // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const interval = setInterval(() => update(), 1000 * 60 * 60)
        return () => clearInterval(interval)
    }, [update])

    // Listen for when the page is visible, if the user switches tabs
    // and makes our tab visible again, re-fetch the session
    useEffect(() => {
        const visibilityHandler = () =>
            document.visibilityState === "visible" && update()
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        window.addEventListener("visibilitychange", visibilityHandler, false)
        return () =>
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            window.removeEventListener("visibilitychange", visibilityHandler, false)
    }, [update])

    return null
}
