"use client";

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Subscribes to Supabase Realtime Postgres changes for a given table.
 *
 * The `onEvent` callback is stored in a ref so that changing its identity
 * (e.g. a new function reference on every render) does NOT cause the
 * channel to be torn down and recreated — which would produce a
 * subscription storm and missed events.
 */
export function useSupabaseRealtime<T extends { [key: string]: any }>(
  table: string,
  onEvent: (payload: RealtimePostgresChangesPayload<T>) => void,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
) {
  // Keep the latest callback in a ref — never stale, never a new reference
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    const channelName = `realtime-${table}-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: event,
          schema: 'public',
          table: table,
        },
        (payload) => {
          // Always calls the current version of the callback without
          // needing it in the dependency array
          onEventRef.current(payload as RealtimePostgresChangesPayload<T>);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Only re-subscribe when table or event type changes — NOT on callback identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, event]);
}
