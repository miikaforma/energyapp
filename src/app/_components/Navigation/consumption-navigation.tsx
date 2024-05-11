'use client';

import { Radio } from "antd"
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react"

export default function ConsumptionNavigation() {
    const router = useRouter()
    const pathname = usePathname()
    let currentPage = 'wattivahti'
    if (pathname) {
        const pathArray = pathname.split('/');
        if (pathArray.length > 2) {
            currentPage = pathArray[2]!;
        }
    }

    let currentRange = 'hourly'
    if (pathname) {
        const pathArray = pathname.split('/');
        if (pathArray.length > 3) {
            currentRange = pathArray[3]!;
        }
    }

    const [selectedType, setSelectedType] = useState(currentPage ?? 'wattivahti')
    const [selectedRange, setSelectedRange] = useState(currentRange ?? 'hourly')

    const onTypeChange = (value: string) => {
        if (value === 'wattivahti' && selectedRange === 'year') {
            setSelectedRange('hourly')
        }
        setSelectedType(value)
        router.push(`/consumptions/${value}`)
    }

    const onRangeChange = (value: string) => {
        setSelectedRange(value)
        router.push(`/consumptions/${currentPage}/${value}`)
    }

    return (
        <>
            <Radio.Group value={selectedType} onChange={(e) => onTypeChange(e.target.value)} style={{ width: "100%", marginBottom: 12 }}>
                <Radio.Button key={'wattivahti'} value="wattivahti">WattiVahti</Radio.Button>
                <Radio.Button key={'melcloud'} value="melcloud">Melcloud</Radio.Button>
            </Radio.Group>
            {selectedType === 'wattivahti' && (
                <Radio.Group value={selectedRange} onChange={(e) => onRangeChange(e.target.value)} style={{ width: "100%", marginBottom: 12 }}>
                    {/* <Radio.Button key={'year'} value="yearly">Vuosi</Radio.Button> */}
                    <Radio.Button key={'month'} value="monthly">Kuukausi</Radio.Button>
                    <Radio.Button key={'day'} value="daily">Päivä</Radio.Button>
                    <Radio.Button key={'hour'} value="hourly">Tunti</Radio.Button>
                    <Radio.Button key={'pt15m'} value="pt15m">15 Minuuttia</Radio.Button>
                </Radio.Group>
            )}
        </>
    )
}