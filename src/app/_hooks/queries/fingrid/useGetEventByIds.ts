import {type Event, EventControllerApi} from '@energyapp/app/_fingrid'
import { type AxiosError } from 'axios'
import { getConfiguredApi } from '@energyapp/app/_fingrid/helpers'
import {useQuery, type UseQueryResult} from '@tanstack/react-query'
import {QUERY_KEYS} from "@energyapp/shared/constants";

export default function useGetEventByIds(eventIds: string, refetchInterval?: number): UseQueryResult<Array<Event>, AxiosError> {
    return useQuery(
        {
            queryKey: QUERY_KEYS.eventByIds(eventIds),
            // queryKey: { eventId: eventId, startTime: startTime, endTime: endTime },
            queryFn: () => getConfiguredApi(EventControllerApi).getEventsJsonForVariablesUsingGET(eventIds, ''),
            refetchInterval: refetchInterval,
            select: response => response.data // Extract data from Axios response
        }
    );
}
