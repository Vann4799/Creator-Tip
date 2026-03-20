'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getNativeSymbol } from '@/lib/chains';

const CARD = { background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 0 };

interface SupporterRow { from_address: string; total: number; count: number; chain_id: number; }
function truncate(addr: string) { return `${addr.slice(0, 6)}...${addr.slice(-4)}`; }
const RANK = ['01', '02', '03', '04', '05'];

export function Leaderboard({ username }: { username: string }) {
  const [supporters, setSupporters] = useState<SupporterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('tips').select('from_address, amount_eth, chain_id').eq('to_username', username)
      .then(({ data }) => {
        if (!data) return setLoading(false);
        const map: Record<string, SupporterRow> = {};
        data.forEach((t: { from_address: string; amount_eth: number, chain_id: number }) => {
          const key = `${t.from_address}-${t.chain_id}`;
          if (!map[key]) map[key] = { from_address: t.from_address, total: 0, count: 0, chain_id: t.chain_id };
          map[key].total += Number(t.amount_eth);
          map[key].count += 1;
        });
        setSupporters(Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5));
        setLoading(false);
      });
  }, [username]);

  if (loading) return <div className="flex justify-center py-8"><div className="h-5 w-5 animate-spin rounded-full" style={{ border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'transparent' }} /></div>;

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
      {supporters.map((s, i) => (
        <div key={`${s.from_address}-${s.chain_id}`} style={CARD}
          className="flex items-center gap-4 px-5 py-3 transition-all duration-150 hover:bg-white/[0.06] cursor-default">
          <span className="text-sm font-black w-6 shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>{RANK[i]}</span>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>{truncate(s.from_address)}</span>
            <span className="ml-2 text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
              ({s.count} tip{s.count > 1 ? 's' : ''})
            </span>
          </div>
          <div className="font-bold text-sm shrink-0">{s.total.toFixed(4)} {getNativeSymbol(s.chain_id)}</div>
        </div>
      ))}
    </div>
  );
}
