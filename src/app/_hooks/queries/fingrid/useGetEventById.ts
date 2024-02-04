import { type Event, EventControllerApi } from "@energyapp/app/_fingrid";
import { type AxiosError } from "axios";
import { getConfiguredApi } from "@energyapp/app/_fingrid/helpers";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { QUERY_KEYS } from "@energyapp/shared/constants";

export default function useGetEventById(
  eventId: number,
): UseQueryResult<Array<Event>, AxiosError> {
  return useQuery({
    queryKey: QUERY_KEYS.eventById(eventId),
    // queryKey: { eventId: eventId, startTime: startTime, endTime: endTime },
    queryFn: () =>
      getConfiguredApi(EventControllerApi).getEventJsonUsingGET(eventId, ""),
    select: (response) => response.data as Array<Event>, // Extract data from Axios response
  });
}
