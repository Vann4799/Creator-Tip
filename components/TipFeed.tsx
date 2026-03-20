'use client';

import { useState, useEffect } from 'react';
import { supabase, Tip } from '@/lib/supabase';
import { getNativeSymbol } from '@/lib/chains';

const CARD = { background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 0 };
const CARD_SM = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 0 };

function truncate(addr: string) { return `${addr.slice(0, 6)}...${addr.slice(-4)}`; }
function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function TipFeed({ username }: { username: string }) {
  const [tips, setTips] = useState<Tip[]>([]);

  useEffect(() => {
    supabase.from('tips').select('*').eq('to_username', username)
      .order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setTips(data as Tip[]); });

    const channel = supabase.channel(`tips-${username}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tips', filter: `to_username=eq.${username}` },
        (payload) => { setTips((prev) => [payload.new as Tip, ...prev.slice(0, 9)]); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [username]);

  if (tips.length === 0) {
    return (
      <div style={CARD} className="p-8 text-center space-y-2">
        <p className="text-2xl">💤</p>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>No tips yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div style={{ ...CARD_SM, display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '3px 10px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)' }}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        Live Feed
      </div>
      <div className="space-y-2">
        {tips.map((tip, idx) => (
          <div key={tip.id} style={{ ...CARD, ...(idx === 0 ? { background: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.55)' } : {}) }} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex shrink-0 overflow-hidden" style={{ ...CARD_SM, width: 36, height: 36 }}>
                <img 
                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${tip.from_address}`} 
                  alt="avatar" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>{truncate(tip.from_address)}</span>
                  <span style={{ ...CARD_SM, padding: '1px 6px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>
                    {tip.chain_name}
                  </span>
                </div>
                {tip.message && (
                  <p className="text-[11px] mt-2 leading-relaxed break-all whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {tip.message}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-bold">+{tip.amount_eth} {getNativeSymbol(tip.chain_id)}</div>
                <div className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{timeAgo(tip.created_at)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
