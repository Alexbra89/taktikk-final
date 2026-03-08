import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

// ─── Typer som matcher Supabase-tabellene ───────────────────
export interface DbMatchEvent {
  id: string;
  team_id: string | null;
  player_account_id: string | null;
  event_type: 'yellow_card' | 'red_card' | 'goal' | 'substitution';
  minute: number | null;
  note: string | null;
  created_at: string;
}

export interface DbPlayerAccount {
  id: string;
  team_id: string | null;
  name: string;
  email: string | null;
  pin: string;
  player_role: string | null;
  player_num: number | null;
  created_at: string;
}