'use client';

import { Radio } from "antd"
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react"

type ProductionNavigationProps = {
    hasWattivahti: boolean;
    hasSolarman: boolean;
}

export default function ProductionNavigation({ hasWattivahti, hasSolarman }: ProductionNavigationProps) {
    const router = useRouter()
    const pathname = usePathname()
    let currentPage = 'wattivahti'
    if (pathname) {
        const pathArray = pathname.split('/');
        if (pathArray.length > 2) {
            currentPage = pathArray[2]!;
        }
    }

    let currentRange = 'PT1H'
    if (pathname) {
        const pathArray = pathname.split('/');
        if (pathArray.length > 3) {
            currentRange = pathArray[3]!;
        }
    }

    const [selectedType, setSelectedType] = useState(currentPage ?? 'wattivahti')
    const [selectedRange, setSelectedRange] = useState(currentRange ?? 'PT1H')

    const onTypeChange = (value: string) => {
        if (value === 'wattivahti' && selectedRange === 'year') {
            setSelectedRange('PT1H')
        }
        setSelectedType(value)
        router.push(`/productions/${value}`)
    }

    const onRangeChange = (value: string) => {
        setSelectedRange(value)
        router.push(`/productions/${currentPage}/${value}`)
    }

    const hasBothTypes = hasSolarman && hasWattivahti

    return (
        <>
            {hasBothTypes && (
                <Radio.Group value={selectedType} onChange={(e) => onTypeChange(e.target.value)} style={{ width: "100%", marginBottom: 12 }}>
                    <Radio.Button key={'wattivahti'} value="wattivahti">WattiVahti</Radio.Button>
                    <Radio.Button key={'melcloud'} value="melcloud">Melcloud</Radio.Button>
                </Radio.Group>
            )}
            {selectedType === 'wattivahti' && (
                <Radio.Group value={selectedRange} onChange={(e) => onRangeChange(e.target.value)} style={{ width: "100%", marginBottom: 12 }}>
                    {/* <Radio.Button key={'P1Y'} value="P1Y">Vuosi</Radio.Button> */}
                    <Radio.Button key={'P1M'} value="P1M">Kuukausi</Radio.Button>
                    <Radio.Button key={'P1D'} value="P1D">Päivä</Radio.Button>
                    <Radio.Button key={'PT1H'} value="PT1H">Tunti</Radio.Button>
                    <Radio.Button key={'PT15M'} value="PT15M">15 Minuuttia</Radio.Button>
                </Radio.Group>
            )}
        </>
    )
}