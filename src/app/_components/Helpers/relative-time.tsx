import React, { useState, useEffect, FC } from "react";
import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

dayjs.updateLocale("fi", {
  relativeTime: {
    future: "%s päästä",
    past: "%s sitten",
    s: "%d sekuntia",
    m: "minuutti",
    mm: "%d minuuttia",
    h: "tunti",
    hh: "%d tuntia",
    d: "päivä",
    dd: "%d päivää",
    M: "kuukausi",
    MM: "%d kuukautta",
    y: "vuosi",
    yy: "%d vuotta",
  },
});

dayjs.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: (number: number) => `${number} seconds`, // replace 'few seconds' with 'x seconds'
    m: "1 minute",
    mm: "%d minutes",
    h: "an hour",
    hh: "%d hours",
    d: "a day",
    dd: "%d days",
    M: "a month",
    MM: "%d months",
    y: "a year",
    yy: "%d years",
  },
});

function useForceUpdate(interval: number): void {
  const [value, setValue] = useState<number>(0); // integer state
  useEffect(() => {
    const timer = setInterval(() => setValue((v) => v + 1), interval); // increment the state every interval
    return () => clearInterval(timer); // cleanup on unmount
  }, [interval]);
}

interface RelativeTimeProps {
  timestamp: string | number | Date | Dayjs;
}

const RelativeTime: FC<RelativeTimeProps> = ({ timestamp }) => {
  useForceUpdate(1_000); // force update every 1 second
  const relativeTimestamp = dayjs().to(dayjs(timestamp));
  return <span>{relativeTimestamp}</span>;
};

export default RelativeTime;
