'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getNativeSymbol } from '@/lib/chains';

const CARD = { background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 0 };
const CARD_SM = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 0 };

interface SupporterRow {
  from_address: string;
  total: number;
  count: number;
  chain_id: number;
  name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
}

function truncate(addr: string) { return `${addr.slice(0, 6)}...${addr.slice(-4)}`; }
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.4)'];
const RANK = ['🥇', '🥈', '🥉', '04', '05'];

export function Leaderboard({ username }: { username: string }) {
  const [supporters, setSupporters] = useState<SupporterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: tips } = await supabase
        .from('tips')
        .select('from_address, amount_eth, chain_id')
        .eq('to_username', username);

      if (!tips) return setLoading(false);

      // Aggregate by address+chain
      const map: Record<string, SupporterRow> = {};
      tips.forEach((t: { from_address: string; amount_eth: number; chain_id: number }) => {
        const key = `${t.from_address}-${t.chain_id}`;
        if (!map[key]) map[key] = { from_address: t.from_address, total: 0, count: 0, chain_id: t.chain_id };
        map[key].total += Number(t.amount_eth);
        map[key].count += 1;
      });

      const sorted = Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);

      // Try to find creator profile for each supporter address
      const uniqueAddresses = [...new Set(sorted.map(s => s.from_address.toLowerCase()))];
      const { data: creators } = await supabase
        .from('creators')
        .select('wallet_address, name, username, avatar_url')
        .in('wallet_address', uniqueAddresses);

      // Map creator data by address
      const creatorMap: Record<string, { name: string | null; username: string | null; avatar_url: string | null }> = {};
      (creators || []).forEach((c: { wallet_address: string; name: string | null; username: string | null; avatar_url: string | null }) => {
        creatorMap[c.wallet_address.toLowerCase()] = {
          name: c.name,
          username: c.username,
          avatar_url: c.avatar_url,
        };
      });

      // Enrich supporters
      const enriched = sorted.map(s => ({
        ...s,
        name: creatorMap[s.from_address.toLowerCase()]?.name,
        username: creatorMap[s.from_address.toLowerCase()]?.username,
        avatar_url: creatorMap[s.from_address.toLowerCase()]?.avatar_url,
      }));

      setSupporters(enriched);
      setLoading(false);
    };
    load();
  }, [username]);

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="h-5 w-5 animate-spin rounded-full" style={{ border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (supporters.length === 0) {
    return (
      <div style={CARD} className="p-8 text-center space-y-2">
        <p className="text-2xl">🏆</p>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>No supporters yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'rgba(255,255,255,0.38)' }}>◈ Top Supporters</p>
      {supporters.map((s, i) => {
        const displayName = s.name || (s.username ? `@${s.username}` : null);
        const avatarSrc = s.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${s.from_address}`;

        return (
          <div key={`${s.from_address}-${s.chain_id}`} style={CARD}
            className="flex items-center gap-3 px-4 py-3 transition-all duration-150 hover:bg-white/[0.06] cursor-default">
            
            {/* Rank */}
            <span className="text-sm font-black w-6 shrink-0 text-center" style={{ color: RANK_COLORS[i] }}>
              {RANK[i]}
            </span>

            {/* Avatar */}
            <div className="shrink-0 overflow-hidden" style={{ ...CARD_SM, width: 32, height: 32 }}>
              <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
            </div>

            {/* Name / address */}
            <div className="flex-1 min-w-0">
              {displayName ? (
                <>
                  <p className="text-xs font-bold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{displayName}</p>
                  <p className="text-[9px] uppercase tracking-wider truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {truncate(s.from_address)} · {s.count} tip{s.count > 1 ? 's' : ''}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {truncate(s.from_address)}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {s.count} tip{s.count > 1 ? 's' : ''}
                  </p>
                </>
              )}
            </div>

            {/* Amount */}
            <div className="font-bold text-sm shrink-0">{s.total.toFixed(4)} {getNativeSymbol(s.chain_id)}</div>
          </div>
        );
      })}
    </div>
  );
}
