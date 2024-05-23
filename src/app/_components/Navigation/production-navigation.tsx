'use client';

import {Radio, type RadioChangeEvent} from "antd"
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

    const onTypeChange = (e: RadioChangeEvent) => {
        const value = e.target.value as string
        if (value === 'wattivahti' && selectedRange === 'year') {
            setSelectedRange('PT1H')
        }
        setSelectedType(value)
        router.push(`/productions/${value}`)
    }

    const onRangeChange = (e: RadioChangeEvent) => {
        const value = e.target.value as string
        setSelectedRange(value)
        router.push(`/productions/${currentPage}/${value}`)
    }

    const hasBothTypes = hasSolarman && hasWattivahti

    return (
        <>
            {hasBothTypes && (
                <Radio.Group value={selectedType} onChange={onTypeChange} style={{ width: "100%", marginBottom: 12 }}>
                    <Radio.Button key={'wattivahti'} value="wattivahti">WattiVahti</Radio.Button>
                    <Radio.Button key={'solarman'} value="solarman">Solarman</Radio.Button>
                </Radio.Group>
            )}
            {selectedType === 'wattivahti' && (
                <Radio.Group value={selectedRange} onChange={onRangeChange} style={{ width: "100%", marginBottom: 12 }}>
                    {/* <Radio.Button key={'P1Y'} value="P1Y">Vuosi</Radio.Button> */}
                    <Radio.Button key={'P1M'} value="P1M">Kuukausi</Radio.Button>
                    <Radio.Button key={'P1D'} value="P1D">Päivä</Radio.Button>
                    <Radio.Button key={'PT1H'} value="PT1H">Tunti</Radio.Button>
                    <Radio.Button key={'PT15M'} value="PT15M">15 Minuuttia</Radio.Button>
                </Radio.Group>
            )}
            {selectedType === 'solarman' && (
                <Radio.Group value={selectedRange} onChange={onRangeChange} style={{ width: "100%", marginBottom: 12 }}>
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
