import { TimePeriod } from "@energyapp/shared/enums";
import { Stack } from "@mui/material";
import dayjs from "dayjs";

export function DateNoWrap({ date, timePeriod }: { date: Date | dayjs.Dayjs | null | undefined, timePeriod: TimePeriod }) {
    const time = dayjs(date);

    switch (timePeriod) {
        case TimePeriod.P1Y:
            return <span style={{ whiteSpace: "nowrap" }}>{dayjs(date).format("YYYY")}</span>;
        case TimePeriod.P1M:
            return <Stack spacing={0} alignItems="center">
                <span style={{ whiteSpace: "nowrap", textAlign: "center" }}>{dayjs(date).format("YYYY")}</span>
                <span style={{ whiteSpace: "nowrap", textAlign: "center" }}>{dayjs(date).format("MMMM")}</span>
            </Stack>
        case TimePeriod.P1D:
            return <Stack spacing={0} alignItems="center">
                <span style={{ whiteSpace: "nowrap", textAlign: "center" }}>{dayjs(date).format("DD.MM.YYYY")}</span>
                <span style={{ whiteSpace: "nowrap", textAlign: "center" }}>{dayjs(date).format("dddd")}</span>
            </Stack>
        case TimePeriod.PT1H:
            return <span style={{ whiteSpace: "nowrap" }}>klo {time.hour().toString().padStart(2, "0")} - {time
                .add(1, "hour")
                .hour()
                .toString()
                .padStart(2, "0")}</span>;
        case TimePeriod.PT15M:
            return <span style={{ whiteSpace: "nowrap" }}>klo {time.format("HH:mm")} - {time
                .add(15, "minute")
                .format("HH:mm")}</span>;
    }
}
