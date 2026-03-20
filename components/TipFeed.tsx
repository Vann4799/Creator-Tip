'use client';

import { useState, useEffect } from 'react';
import { supabase, Tip } from '@/lib/supabase';
import { getNativeSymbol } from '@/lib/chains';

const CARD = { background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 0 };
const CARD_SM = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 0 };

type CreatorInfo = { name: string | null; username: string | null; avatar_url: string | null };

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
  const [creatorMap, setCreatorMap] = useState<Record<string, CreatorInfo>>({});

  // Lookup creator profiles for a list of addresses
  const enrichAddresses = async (addresses: string[]) => {
    const unique = [...new Set(addresses.map(a => a.toLowerCase()))];
    const { data } = await supabase
      .from('creators')
      .select('wallet_address, name, username, avatar_url')
      .in('wallet_address', unique);
    if (!data) return;
    const map: Record<string, CreatorInfo> = {};
    data.forEach((c: { wallet_address: string; name: string | null; username: string | null; avatar_url: string | null }) => {
      map[c.wallet_address.toLowerCase()] = { name: c.name, username: c.username, avatar_url: c.avatar_url };
    });
    setCreatorMap(prev => ({ ...prev, ...map }));
  };

  useEffect(() => {
    // Initial fetch
    supabase.from('tips').select('*').eq('to_username', username)
      .order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => {
        if (data) {
          const tipData = data as Tip[];
          setTips(tipData);
          enrichAddresses(tipData.map(t => t.from_address));
        }
      });

    // Real-time subscription
    const channel = supabase.channel(`tips-${username}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tips', filter: `to_username=eq.${username}` },
        (payload) => {
          const newTip = payload.new as Tip;
          setTips((prev) => [newTip, ...prev.slice(0, 9)]);
          enrichAddresses([newTip.from_address]);
        })
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
      {/* Live Feed label */}
      <div style={{ ...CARD_SM, display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '3px 10px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)' }}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        Live Feed
      </div>

      <div className="space-y-2">
        {tips.map((tip, idx) => {
          const info = creatorMap[tip.from_address.toLowerCase()];
          const displayName = info?.name || (info?.username ? `@${info.username}` : null);
          const avatarSrc = info?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${tip.from_address}`;
          const isLatest = idx === 0;

          return (
            <div key={tip.id}
              style={{ ...CARD, ...(isLatest ? { background: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.55)' } : {}) }}
              className="p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="shrink-0 overflow-hidden" style={{ ...CARD_SM, width: 36, height: 36 }}>
                  <img
                    src={avatarSrc}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Primary label: name or address */}
                    <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {displayName || truncate(tip.from_address)}
                    </span>
                    {/* If name shown, show address as subtitle */}
                    {displayName && (
                      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {truncate(tip.from_address)}
                      </span>
                    )}
                    {/* Chain badge */}
                    <span style={{ ...CARD_SM, padding: '1px 6px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>
                      {tip.chain_name}
                    </span>
                  </div>

                  {/* Message */}
                  {tip.message && (
                    <p className="text-[11px] mt-1.5 leading-relaxed break-all" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      "{tip.message}"
                    </p>
                  )}
                </div>

                {/* Amount + time */}
                <div className="shrink-0 text-right ml-auto">
                  <div className="text-sm font-bold">+{tip.amount_eth} {getNativeSymbol(tip.chain_id)}</div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{timeAgo(tip.created_at)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
