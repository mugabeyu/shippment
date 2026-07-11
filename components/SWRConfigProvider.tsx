'use client';

import { SWRConfig } from 'swr';

// Global defaults for every useSWR() call in the app. Individual hooks in
// lib/swr.ts can still override these per-key (e.g. revalidateOnFocus: false).
// dedupingInterval collapses identical in-flight/recent requests — several
// dashboard pages mount the same hooks (useCustomers, useShipments, ...)
// within a few hundred ms of each other during navigation, and without this
// they'd each fire their own network request.
// refreshInterval polls every 5s so shipments/customers/revenue/work-sessions
// stay live across the app (dashboard, shipments list, Staff Work page, ...)
// without needing a manual refresh — this is a multi-staff tool, so one
// person's action should show up for everyone else within a few seconds.
export default function SWRConfigProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 4000,
        focusThrottleInterval: 10000,
        refreshInterval: 5000,
        revalidateOnFocus: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
