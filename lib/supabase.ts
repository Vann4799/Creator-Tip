import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
export interface Creator {
  id: string;
  wallet_address: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  twitter: string | null;
  github: string | null;
  linkedin: string | null;
  website: string | null;
  created_at: string;
}

export interface Tip {
  id: string;
  from_address: string;
  to_address: string;
  to_username: string;
  amount_eth: number;
  message: string | null;
  chain_id: number;
  chain_name: string;
  tx_hash: string;
  created_at: string;
}
