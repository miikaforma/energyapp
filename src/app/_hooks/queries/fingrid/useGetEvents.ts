import {type Event, EventsControllerApi} from '@energyapp/app/_fingrid'
import { type AxiosError } from 'axios'
import { getConfiguredApi } from '@energyapp/app/_fingrid/helpers'
import {useQuery, type UseQueryResult} from '@tanstack/react-query'
import {QUERY_KEYS} from "@energyapp/shared/constants";

export default function useGetEvents(eventId: number, startTime: string, endTime: string): UseQueryResult<Array<Event>, AxiosError> {
    return useQuery(
        {
            queryKey: QUERY_KEYS.eventsById(eventId, startTime, endTime),
            // queryKey: { eventId: eventId, startTime: startTime, endTime: endTime },
            queryFn: () => getConfiguredApi(EventsControllerApi).getEventsJsonUsingGET(eventId, '', startTime, endTime),
            select: response => response.data // Extract data from Axios response
        }
    );
}
