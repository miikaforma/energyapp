'use client';

import { Radio } from "antd"
import { usePathname, useRouter } from "next/navigation";
import { type SetStateAction, useState } from "react"

export default function ConsumptionNavigation() {
    const router = useRouter()
    const pathname = usePathname()
    let currentPage = 'wattivahti'
    if (pathname) {
        const pathArray = pathname.split('/');
        if (pathArray.length > 2) {
            currentPage = pathArray[2]! ;
        }
    }

    const [selectedType, setSelectedType] = useState(currentPage ?? 'wattivahti')
    const [selectedRange, setSelectedRange] = useState('day')

    const onTypeChange = (value: string) => {
        if (value === 'wattivahti' && selectedRange === 'year') {
            setSelectedRange('day')
        }
        setSelectedType(value)
        router.push(`/consumptions/${value}`)
    }

    return (
        <>
            <Radio.Group value={selectedType} onChange={(e) => onTypeChange(e.target.value)} style={{ width: "100%", marginBottom: 12 }}>
                <Radio.Button key={'wattivahti'} value="wattivahti">WattiVahti</Radio.Button>
                <Radio.Button key={'melcloud'} value="melcloud">Melcloud</Radio.Button>
            </Radio.Group>
            <Radio.Group value={selectedRange} onChange={(e) => setSelectedRange(e.target.value)} style={{ width: "100%", marginBottom: 12 }}>
                {selectedType === 'solarman' && <Radio.Button key={'year'} value="year">Vuosi</Radio.Button>}
                <Radio.Button key={'month'} value="month">Kuukausi</Radio.Button>
                <Radio.Button key={'day'} value="day">Päivä</Radio.Button>
            </Radio.Group>
        </>
    )
}