import { TimePeriod } from "@energyapp/shared/enums";
import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import dayjs, { type Dayjs } from "dayjs";
import toast from "react-hot-toast";

type GetHomewizardMeasurements = {
  timePeriod: TimePeriod;
  startTime: Dayjs;
  endTime: Dayjs;
  deviceId?: string;
};

type PrefetchHomewizardMeasurements = {
  utils: ReturnType<typeof api.useUtils>;
  timePeriod: TimePeriod;
  startTime: Dayjs;
  endTime: Dayjs;
  deviceId?: string;
};

const useGetHomewizardMeasurements = ({
  timePeriod,
  startTime,
  endTime,
  deviceId,
}: GetHomewizardMeasurements) => {
  const utils = api.useUtils();

  const query = api.homewizard.get.useQuery(
    { timePeriod, startTime, endTime, deviceId },
    {
      select: (data) => data,
      onSuccess: (_data) => {
        prefetchHomewizardMeasurements({ utils, timePeriod, startTime, endTime, deviceId });
      },
      onError: (err: unknown) => {
        if (err instanceof TRPCClientError) {
          if (err.data?.code === "NOT_FOUND") {
            toast.error("Valitulle aikavälille ei löytynyt mittauksia.");
            return;
          }
          toast.error("Virhe haettaessa mittauksia. Yritä myöhemmin uudelleen.");
        }
      },
      refetchInterval: 60000,
    },
  );

  return { ...query, prefetch: prefetchHomewizardMeasurements };
};

const prefetchHomewizardMeasurements = ({
  utils,
  timePeriod,
  startTime,
  endTime,
  deviceId,
}: PrefetchHomewizardMeasurements) => {
  let previousStart: Dayjs = dayjs();
  let previousEnd: Dayjs = dayjs();
  let nextStart: Dayjs = dayjs();
  let nextEnd: Dayjs = dayjs();

  switch (timePeriod) {
    case TimePeriod.PT15M:
    case TimePeriod.PT1H:
      previousStart = startTime.add(-1, "day");
      previousEnd = startTime.add(-1, "day");
      nextStart = endTime.add(1, "day");
      nextEnd = endTime.add(1, "day");
      break;
    case TimePeriod.P1D:
      previousStart = startTime.add(-1, "day").startOf("month");
      previousEnd = startTime.add(-1, "day").endOf("month");
      nextStart = endTime.add(1, "day").startOf("month");
      nextEnd = endTime.add(1, "day").endOf("month");
      break;
    case TimePeriod.P1M:
      previousStart = startTime.add(-1, "month").startOf("year");
      previousEnd = startTime.add(-1, "month").endOf("year");
      nextStart = endTime.add(1, "month").startOf("year");
      nextEnd = endTime.add(1, "month").endOf("year");
      break;
    case TimePeriod.P1Y:
      previousStart = startTime.add(-1, "year");
      previousEnd = startTime.add(-1, "year");
      nextStart = endTime.add(1, "year");
      nextEnd = endTime.add(1, "year");
      break;
  }

  void utils.homewizard.get.prefetch(
    {
      timePeriod,
      startTime: previousStart.hour(0).minute(0).second(0).millisecond(0),
      endTime: previousEnd.hour(23).minute(59).second(59).millisecond(999),
      deviceId,
    },
    {},
  );

  // Only prefetch the next period if it's not in the future
  if (nextStart.isBefore(dayjs())) {
    void utils.homewizard.get.prefetch(
      {
        timePeriod,
        startTime: nextStart.hour(0).minute(0).second(0).millisecond(0),
        endTime: nextEnd.hour(23).minute(59).second(59).millisecond(999),
        deviceId,
      },
      {},
    );
  }
};

export default useGetHomewizardMeasurements;
