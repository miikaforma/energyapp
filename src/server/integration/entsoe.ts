import dayjs, { type Dayjs } from "dayjs";

interface UpdateParams {
    startDate: Dayjs;
    endDate: Dayjs;
}

export const updateFromEntsoe = async ({ startDate, endDate }: UpdateParams): Promise<boolean> => {
    console.debug({ startDate, endDate })

    const data = {
        start: getFirstDayOfMonth(startDate),
        stop: getLastDayOfMonth(endDate),
    }
    console.debug({ data })

    try {
        const response = await fetch(`${process.env.ENTSOE_ENDPOINT}/dayahead`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

const getFirstDayOfMonth = (time: Dayjs): string => {
    const newTime = dayjs(time).startOf('month');
    return newTime.format('YYYY-MM-DDT00:00') + 'Z';
}

const getLastDayOfMonth = (time: Dayjs): string => {
    const newTime = dayjs(time).endOf('month');
    return newTime.format('YYYY-MM-DDT00:00') + 'Z';
}
