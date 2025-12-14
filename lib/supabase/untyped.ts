import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper to bypass TypeScript strict checking for Supabase tables
 * until we generate proper database types.
 *
 * Usage:
 *   const { data } = await table(supabase, 'cycles').select('*').eq('id', id).single();
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function table(supabase: SupabaseClient, tableName: string): any {
  return supabase.from(tableName);
}
