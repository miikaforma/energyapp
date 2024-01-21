'use client';

import { Radio } from "antd"
import { usePathname, useRouter } from "next/navigation";
import { SetStateAction } from "react"

export default function SpotPriceNavigation() {
    const router = useRouter()
    const pathname = usePathname()
    let currentPage = 'hourly'
    if (pathname) {
        let pathArray = pathname.split('/');
        if (pathArray.length > 2) {
            currentPage = pathArray[2] as string;
        }
    }

    const onRangeChange = (value: SetStateAction<string>) => {
        router.push(`/spotPrices/${value}`)
    }

    return (
        <>
            <Radio.Group value={currentPage} onChange={(e) => onRangeChange(e.target.value)} style={{ width: "100%", marginBottom: 12 }}>
                <Radio.Button key={'year'} value="yearly">Vuosi</Radio.Button>
                <Radio.Button key={'month'} value="monthly">Kuukausi</Radio.Button>
                <Radio.Button key={'day'} value="daily">Päivä</Radio.Button>
                <Radio.Button key={'hour'} value="hourly">Tunti</Radio.Button>
            </Radio.Group>
        </>
    )
}