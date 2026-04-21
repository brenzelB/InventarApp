"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useSupabaseRealtime<T extends { [key: string]: any }>(
  table: string,
  onEvent: (payload: RealtimePostgresChangesPayload<T>) => void,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
) {
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
          onEvent(payload as RealtimePostgresChangesPayload<T>);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, onEvent]);
}
