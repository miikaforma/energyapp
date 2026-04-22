"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  createWSClient,
  loggerLink,
  splitLink,
  unstable_httpBatchStreamLink,
  wsLink,
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";

import { type AppRouter } from "@energyapp/server/api/root";
import { getUrl, getWsUrl, transformer } from "./shared";

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider(props: {
  children: React.ReactNode;
  cookies: string;
  wsUrlOverride?: string;
  wsPortOverride?: string;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [wsClient] = useState(() =>
    typeof window === "undefined"
      ? null
      : createWSClient({
          url: getWsUrl(props.wsUrlOverride, props.wsPortOverride),
        })
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer,
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        splitLink({
          condition(op) {
            return op.type === "subscription" && wsClient !== null;
          },
          true: wsLink<AppRouter>({
            client: wsClient!,
          }),
          false: unstable_httpBatchStreamLink({
            url: getUrl(),
            headers() {
              return {
                cookie: props.cookies,
                "x-trpc-source": "react",
              };
            },
          }),
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} position="top-left" />
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}
