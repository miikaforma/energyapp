import dayjs, { type Dayjs } from "dayjs";
import { env } from "@energyapp/env";

interface UpdateParams {
    startDate: Dayjs;
    endDate: Dayjs;
}

export const updateFromWattiVahti = async ({ startDate, endDate }: UpdateParams): Promise<boolean> => {
    console.debug({ startDate, endDate })

    const resolutions = ['PT1H', 'PT15M'];
    let success = true;

    for (const resolution of resolutions) {
        const data = {
            start: getStartTime(startDate),
            stop: getEndTime(endDate),
            resolution: resolution
        }

        try {
            const response = await fetch(`${env.WATTIVAHTI_ENDPOINT}/metering`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error(error);
            success = false;
        }
    }

    return success;
};

const getStartTime = (time: Dayjs): string => {
    return dayjs(time).tz('Europe/Helsinki').format('YYYY-MM-DDTHH:mm:ss');
}

const getEndTime = (time: Dayjs): string => {
    const newTime = dayjs(time).add(1, 'day').hour(0).minute(0).second(0).millisecond(0);
    return newTime.tz('Europe/Helsinki').format('YYYY-MM-DDTHH:mm:ss');
}
