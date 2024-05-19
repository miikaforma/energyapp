'use client';

import {Radio, type RadioChangeEvent} from "antd"
import {usePathname, useRouter} from "next/navigation";
import {TimePeriod} from "@energyapp/shared/enums";

export default function SpotPriceNavigation() {
    const router = useRouter()
    const pathname = usePathname()
    let currentPage = TimePeriod.PT1H.toString()
    if (pathname) {
        const pathArray = pathname.split('/');
        if (pathArray.length > 2) {
            currentPage = pathArray[2]!;
        }
    }

    const onRangeChange = (e: RadioChangeEvent) => {
        router.push(`/spotPrices/${e.target.value}`)
    }

    return (
        <>
            <Radio.Group value={currentPage} onChange={onRangeChange}
                         style={{width: "100%", marginBottom: 12}}>
                <Radio.Button key={TimePeriod.P1Y} value={TimePeriod.P1Y}>Vuosi</Radio.Button>
                <Radio.Button key={TimePeriod.P1M} value={TimePeriod.P1M}>Kuukausi</Radio.Button>
                <Radio.Button key={TimePeriod.P1D} value={TimePeriod.P1D}>Päivä</Radio.Button>
                <Radio.Button key={TimePeriod.PT1H} value={TimePeriod.PT1H}>Tunti</Radio.Button>
                {/*<Radio.Button key={TimePeriod.PT15M} value="hourly">15-minuuttia</Radio.Button>*/}
            </Radio.Group>
        </>
    )
}
