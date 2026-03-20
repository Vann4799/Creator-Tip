'use client';

import { useEffect, useState } from 'react';
import { supabase, Tip } from '@/lib/supabase';

const CARD = { background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 0 };
const CARD_SM = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 0 };
const TH_STYLE: React.CSSProperties = { padding: '10px 20px', textAlign: 'left', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.38)' };
const TD_STYLE: React.CSSProperties = { padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' };

function truncate(addr: string) { return `${addr.slice(0, 6)}...${addr.slice(-4)}`; }
function formatDate(str: string) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function TipHistory({ walletAddress }: { walletAddress: string }) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    supabase.from('tips').select('*').eq('to_address', walletAddress.toLowerCase())
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) { setTips(data as Tip[]); setTotal(data.reduce((s: number, t: Tip) => s + Number(t.amount_eth), 0)); }
        setLoading(false);
      });
  }, [walletAddress]);

  if (loading) return <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full" style={{ border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'transparent' }} /></div>;

  if (tips.length === 0) {
    return (
      <div style={CARD} className="p-12 text-center space-y-3">
        <p className="text-4xl">📭</p>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.38)' }}>No tips yet. Share your profile!</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Totals */}
      <div style={CARD} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>Total Received</p>
          <p className="text-3xl font-bold mt-1">{total.toFixed(4)} ETH</p>
        </div>
        <div className="sm:text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>Total Tips</p>
          <p className="text-3xl mt-1">{tips.length}</p>
        </div>
      </div>

      {/* Table */}
      <div style={CARD} className="overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1.5px solid rgba(255,255,255,0.2)' }}>
            <tr>
              <th style={TH_STYLE}>From</th>
              <th style={TH_STYLE}>Chain</th>
              <th style={TH_STYLE}>Amount</th>
              <th style={TH_STYLE}>Message</th>
              <th style={TH_STYLE}>Date</th>
            </tr>
          </thead>
          <tbody>
            {tips.map((tip) => (
              <tr key={tip.id} style={{ transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                <td style={TD_STYLE}>
                  <a href={`https://etherscan.io/address/${tip.from_address}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 transition-opacity hover:opacity-80"
                    style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                    <div style={{ ...CARD_SM, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, flexShrink: 0 }}>
                      {tip.from_address.slice(2, 4).toUpperCase()}
                    </div>
                    {truncate(tip.from_address)}
                  </a>
                </td>
                <td style={TD_STYLE}>
                  <span style={{ ...CARD_SM, padding: '2px 8px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>
                    {tip.chain_name}
                  </span>
                </td>
                <td style={{ ...TD_STYLE, fontWeight: 700, whiteSpace: 'nowrap' }}>+{tip.amount_eth} ETH</td>
                <td style={{ ...TD_STYLE, color: 'rgba(255,255,255,0.5)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tip.message || '—'}
                </td>
                <td style={{ ...TD_STYLE, color: 'rgba(255,255,255,0.35)', fontSize: 10, whiteSpace: 'nowrap' }}>{formatDate(tip.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
