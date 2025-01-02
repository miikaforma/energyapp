'use client';

import { TimePeriod } from "@energyapp/shared/enums";
import {Radio, type RadioChangeEvent} from "antd"
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react"

type ConsumptionNavigationProps = {
    hasWattivahti: boolean;
    hasMelcloud: boolean;
    hasShelly: boolean;
}

export default function ConsumptionNavigation({ hasWattivahti, hasMelcloud, hasShelly }: ConsumptionNavigationProps) {
    const router = useRouter()
    const pathname = usePathname()
    let currentPage = hasWattivahti ? 'wattivahti' : hasMelcloud ? 'melcloud' : 'shelly'
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

    const [selectedType, setSelectedType] = useState(currentPage ?? hasWattivahti ? 'wattivahti' : hasMelcloud ? 'melcloud' : 'shelly')
    const [selectedRange, setSelectedRange] = useState(currentRange ?? 'hourly')

    const onTypeChange = (e: RadioChangeEvent) => {
        const value = e.target.value as string
        if (value === 'wattivahti' && selectedRange === 'year') {
            setSelectedRange('hourly')
        }
        setSelectedType(value)
        router.push(`/consumptions/${value}`)
    }

    const onRangeChange = (e: RadioChangeEvent) => {
        const value = e.target.value as string
        setSelectedRange(value)
        router.push(`/consumptions/${currentPage}/${value}`)
    }

    return (
        <>
            <Radio.Group value={selectedType} onChange={onTypeChange} style={{ width: "100%", marginBottom: 12 }}>
                {hasWattivahti && <Radio.Button key={'wattivahti'} value="wattivahti">WattiVahti</Radio.Button>}
                {hasMelcloud && <Radio.Button key={'melcloud'} value="melcloud">Melcloud</Radio.Button>}
                {hasShelly && <Radio.Button key={'shelly'} value="shelly">Shelly</Radio.Button>}
            </Radio.Group>
            {selectedType === 'wattivahti' && (
                <Radio.Group value={selectedRange} onChange={onRangeChange} style={{ width: "100%", marginBottom: 12 }}>
                    {/* <Radio.Button key={'year'} value="yearly">Vuosi</Radio.Button> */}
                    <Radio.Button key={'month'} value="monthly">Kuukausi</Radio.Button>
                    <Radio.Button key={'day'} value="daily">Päivä</Radio.Button>
                    <Radio.Button key={'hour'} value="hourly">Tunti</Radio.Button>
                    <Radio.Button key={'pt15m'} value="pt15m">15 Minuuttia</Radio.Button>
                </Radio.Group>
            )}
            {selectedType === 'shelly' && (
                <Radio.Group value={selectedRange} onChange={onRangeChange} style={{ width: "100%", marginBottom: 12 }}>
                    <Radio.Button key={TimePeriod.P1Y} value={TimePeriod.P1Y}>Vuosi</Radio.Button>
                    <Radio.Button key={TimePeriod.P1M} value={TimePeriod.P1M}>Kuukausi</Radio.Button>
                    <Radio.Button key={TimePeriod.P1D} value={TimePeriod.P1D}>Päivä</Radio.Button>
                    <Radio.Button key={TimePeriod.PT1H} value={TimePeriod.PT1H}>Tunti</Radio.Button>
                    <Radio.Button key={TimePeriod.PT15M} value={TimePeriod.PT15M}>15 Minuuttia</Radio.Button>
                </Radio.Group>
            )}
        </>
    )
}
