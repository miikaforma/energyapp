'use client';

import { Radio, type RadioChangeEvent } from "antd"
import { usePathname, useRouter } from "next/navigation";

export default function SettingsNavigation({ hasSession }: { hasSession: boolean }) {
    const router = useRouter()
    const pathname = usePathname()
    let currentPage = 'spotPrices'
    if (pathname) {
        const pathArray = pathname.split('/');
        if (pathArray.length > 2) {
            currentPage = pathArray[2]!;
        }
    }

    const onTabChange = (e: RadioChangeEvent) => {
        router.push(`/settings/${e.target.value}`)
    }

    return (
        <>
            <Radio.Group value={currentPage} onChange={onTabChange}
                style={{ width: "100%", marginBottom: 12 }}>
                <Radio.Button key='spotPrices' value='spotPrices'>Tuntihinnat</Radio.Button>
                {hasSession && <Radio.Button key='meteringPoints' value='meteringPoints'>Sopimukset</Radio.Button>}
            </Radio.Group>
        </>
    )
}
