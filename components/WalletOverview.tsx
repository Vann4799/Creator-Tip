'use client';

import { useEffect, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';

interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  color: string;
}

interface WalletStats {
  totalUsd: number;
  tokens: TokenBalance[];
  firstTxDate: Date | null;
  txCount: number;
  healthScore: number;
  healthLabel: string;
  healthColor: string;
}

// High-contrast neon palette (pops against blue background)
const TOKEN_COLORS = [
  '#FF6B00', // Neon Orange
  '#FF2D78', // Hot Pink
  '#00FFD1', // Cyan Mint
  '#FFE600', // Electric Yellow
  '#B24BF3', // Vivid Purple
  '#00FF6A', // Lime Green
  '#FF4545', // Vivid Red
  '#00B4FF', // Ice Blue
];

// CoinGecko ID lookup by common token symbols
const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum',
  BNB: 'binancecoin',
  MATIC: 'matic-network',
  POL: 'matic-network',
  ARB: 'arbitrum',
  OP: 'optimism',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  WETH: 'weth',
  WBTC: 'wrapped-bitcoin',
  LINK: 'chainlink',
  UNI: 'uniswap',
  AAVE: 'aave',
  CAKE: 'pancakeswap-token',
};

async function fetchPricesUSD(symbols: string[]): Promise<Record<string, number>> {
  const ids = [...new Set(symbols.map(s => COINGECKO_IDS[s.toUpperCase()]).filter(Boolean))];
  if (ids.length === 0) return {};
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`,
      { next: { revalidate: 60 } }
    );
    const data = await res.json();
    const priceMap: Record<string, number> = {};
    symbols.forEach(sym => {
      const id = COINGECKO_IDS[sym.toUpperCase()];
      if (id && data[id]?.usd) priceMap[sym.toUpperCase()] = data[id].usd;
    });
    return priceMap;
  } catch {
    return {};
  }
}

function DonutChart({ tokens, total }: { tokens: TokenBalance[]; total: number }) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 58;
  const innerR = 38;
  const circumference = 2 * Math.PI * r;

  let cumulative = 0;
  const segments = tokens.map((token) => {
    const pct = total > 0 ? token.usdValue / total : 1 / tokens.length;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const endAngle = (cumulative + pct) * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const x1i = cx + innerR * Math.cos(startAngle);
    const y1i = cy + innerR * Math.sin(startAngle);
    const x2i = cx + innerR * Math.cos(endAngle);
    const y2i = cy + innerR * Math.sin(endAngle);

    const largeArc = pct > 0.5 ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x2i} ${y2i}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1i} ${y1i}`,
      'Z',
    ].join(' ');

    return { ...token, d, pct };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r + 4} fill="rgba(0,0,0,0.35)" />
      {segments.map((seg, i) => (
        <path
          key={i}
          d={seg.d}
          fill={seg.color}
          opacity={1}
          stroke="#000"
          strokeWidth={2.5}
        />
      ))}
      {/* Center hole */}
      <circle cx={cx} cy={cy} r={innerR - 1} fill="#0a0a1a" />
      {total > 0 ? (
        <>
          <text x={cx} y={cy - 7} textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="monospace">
            ${total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total.toFixed(0)}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">
            USD VALUE
          </text>
        </>
      ) : (
        <text x={cx} y={cy + 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">
          HOLDINGS
        </text>
      )}
    </svg>
  );
}

function HealthBar({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Wallet Health
        </span>
        <span className="text-xs font-bold" style={{ color }}>{label}</span>
      </div>
      <div className="h-2 w-full" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <div className="text-right text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{score}/100</div>
    </div>
  );
}

export function WalletOverview() {
  const { address, chain } = useAccount();
  const { data: nativeBal } = useBalance({ address });
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const alchemyNet = chain?.name?.toLowerCase().includes('polygon')
          ? 'polygon-mainnet'
          : chain?.name?.toLowerCase().includes('arbitrum')
          ? 'arb-mainnet'
          : chain?.name?.toLowerCase().includes('base')
          ? 'base-mainnet'
          : chain?.name?.toLowerCase().includes('bnb') || chain?.name?.toLowerCase().includes('bsc')
          ? 'bnb-mainnet'
          : 'eth-mainnet';

        // Fetch token balances from Alchemy
        const [balRes, txRes] = await Promise.allSettled([
          fetch(`https://${alchemyNet}.g.alchemy.com/v2/demo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0', id: 1,
              method: 'alchemy_getTokenBalances',
              params: [address, 'erc20'],
            }),
          }).then(r => r.json()),
          fetch(`https://${alchemyNet}.g.alchemy.com/v2/demo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0', id: 2,
              method: 'alchemy_getAssetTransfers',
              params: [{
                toAddress: address,
                category: ['external'],
                order: 'asc',
                withMetadata: true,
                maxCount: '0x1',
              }],
            }),
          }).then(r => r.json()),
        ]);

        // Parse token balances
        const rawTokens: TokenBalance[] = [];
        const allSymbols: string[] = [];

        // Add native token first
        if (nativeBal) {
          allSymbols.push(nativeBal.symbol.toUpperCase());
          rawTokens.push({
            symbol: nativeBal.symbol,
            name: nativeBal.symbol,
            balance: parseFloat(nativeBal.formatted),
            usdValue: 0, // filled after price fetch
            color: TOKEN_COLORS[0],
          });
        }

        // Parse ERC20 tokens
        if (balRes.status === 'fulfilled' && balRes.value?.result?.tokenBalances) {
          const tokenBals = balRes.value.result.tokenBalances as Array<{ contractAddress: string; tokenBalance: string }>;
          
          // Get metadata for non-zero tokens
          const nonZero = tokenBals
            .filter(t => t.tokenBalance && t.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000')
            .slice(0, 6);

          for (let i = 0; i < nonZero.length; i++) {
            const t = nonZero[i];
            const metaRes = await fetch(`https://${alchemyNet}.g.alchemy.com/v2/demo`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0', id: 3 + i,
                method: 'alchemy_getTokenMetadata',
                params: [t.contractAddress],
              }),
            }).then(r => r.json());

            const meta = metaRes?.result;
            if (!meta?.symbol) continue;

            const decimals = meta.decimals || 18;
            const rawBal = parseInt(t.tokenBalance, 16);
            const balance = rawBal / Math.pow(10, decimals);
            if (balance < 0.0001) continue;

            rawTokens.push({
              symbol: meta.symbol,
              name: meta.name || meta.symbol,
              balance,
              usdValue: 0, // filled after price fetch
              color: TOKEN_COLORS[(i + 1) % TOKEN_COLORS.length],
            });
            allSymbols.push(meta.symbol.toUpperCase());
          }
        }

        // Fetch real USD prices from CoinGecko
        const priceMap = await fetchPricesUSD(allSymbols);
        rawTokens.forEach(t => {
          const price = priceMap[t.symbol.toUpperCase()] || 0;
          t.usdValue = t.balance * price;
        });

        // Wallet age
        let firstTxDate: Date | null = null;
        let txCount = 0;
        if (txRes.status === 'fulfilled' && txRes.value?.result?.transfers?.length > 0) {
          const firstTx = txRes.value.result.transfers[0];
          if (firstTx?.metadata?.blockTimestamp) {
            firstTxDate = new Date(firstTx.metadata.blockTimestamp);
          }
        }

        // Calculate health score (0-100 based on heuristics)
        const hasNative = rawTokens.length > 0;
        const hasTokens = rawTokens.length > 1;
        const nativeBal_ = rawTokens[0]?.balance || 0;
        const walletAgeMonths = firstTxDate
          ? Math.floor((Date.now() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
          : 0;

        let health = 20; // base
        if (hasNative) health += 20;
        if (nativeBal_ > 0.01) health += 15;
        if (nativeBal_ > 0.1) health += 10;
        if (hasTokens) health += 10;
        if (rawTokens.length > 3) health += 5;
        if (walletAgeMonths > 1) health += 5;
        if (walletAgeMonths > 6) health += 10;
        if (walletAgeMonths > 12) health += 5;
        health = Math.min(health, 100);

        let healthLabel = 'Beginner';
        let healthColor = '#ef4444';
        if (health >= 70) { healthLabel = 'Excellent'; healthColor = '#22c55e'; }
        else if (health >= 50) { healthLabel = 'Good'; healthColor = '#84cc16'; }
        else if (health >= 35) { healthLabel = 'Average'; healthColor = '#eab308'; }
        else if (health >= 20) { healthLabel = 'Low'; healthColor = '#f97316'; }

        const total = rawTokens.reduce((s, t) => s + t.usdValue, 0);

        setStats({
          totalUsd: total,
          tokens: rawTokens.slice(0, 7),
          firstTxDate,
          txCount,
          healthScore: health,
          healthLabel,
          healthColor,
        });
      } catch (e) {
        console.error('WalletOverview error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address, chain, nativeBal]);

  const CARD = {
    background: 'rgba(0,0,0,0.25)',
    border: '1.5px solid rgba(255,255,255,0.2)',
    borderRadius: 0,
  };

  if (loading) {
    return (
      <div style={CARD} className="p-8 flex items-center justify-center gap-3 animate-pulse">
        <div className="h-4 w-4 animate-spin rounded-full" style={{ border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff' }} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Loading Wallet Data...</span>
      </div>
    );
  }

  if (!stats) return null;

  const walletAge = stats.firstTxDate
    ? (() => {
        const days = Math.floor((Date.now() - stats.firstTxDate.getTime()) / (1000 * 60 * 60 * 24));
        if (days < 30) return `${days}d`;
        if (days < 365) return `${Math.floor(days / 30)}mo`;
        return `${(days / 365).toFixed(1)}yr`;
      })()
    : 'New Wallet';

  return (
    <div style={CARD} className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          ◈ Wallet Overview
        </p>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5"
          style={{ background: stats.healthColor + '22', border: `1px solid ${stats.healthColor}55`, color: stats.healthColor }}>
          {stats.healthLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Donut chart + legend */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          {stats.tokens.length > 0 ? (
            <DonutChart tokens={stats.tokens} total={stats.totalUsd} />
          ) : (
            <div className="w-[160px] h-[160px] flex items-center justify-center text-white/20 text-xs font-mono uppercase tracking-widest border border-white/10">
              No tokens
            </div>
          )}

          {/* Legend */}
          <div className="space-y-2 flex-1 w-full">
            {stats.tokens.map((t) => {
              const pct = stats.totalUsd > 0 ? (t.usdValue / stats.totalUsd) * 100 : 0;
              return (
                <div key={t.symbol} className="flex items-center gap-2">
                  <div className="h-2 w-2 shrink-0" style={{ background: t.color }} />
                  <span className="text-xs font-bold shrink-0" style={{ color: 'rgba(255,255,255,0.8)', minWidth: 40 }}>
                    {t.symbol}
                  </span>
                  <div className="flex-1 h-1" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full transition-all duration-700" style={{ width: `${pct || 100 / stats.tokens.length}%`, background: t.color }} />
                  </div>
                  <span className="text-[9px] font-mono shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {t.balance.toFixed(4)}
                  </span>
                </div>
              );
            })}
            {stats.tokens.length === 0 && (
              <p className="text-[10px] text-white/30 uppercase tracking-widest">No token holdings found</p>
            )}
          </div>
        </div>

        {/* Right: Stats */}
        <div className="space-y-5">
          {/* Health bar */}
          <HealthBar score={stats.healthScore} label={stats.healthLabel} color={stats.healthColor} />

          {/* mini stat grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: '⏳',
                label: 'Wallet Age',
                value: walletAge,
                sub: stats.firstTxDate ? stats.firstTxDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'First time',
              },
              {
                icon: '🪙',
                label: 'Tokens Held',
                value: stats.tokens.length.toString(),
                sub: 'Across all chains',
              },
              {
                icon: '💰',
                label: 'Native Balance',
                value: nativeBal ? `${parseFloat(nativeBal.formatted).toFixed(4)}` : '—',
                sub: nativeBal?.symbol || '',
              },
              {
                icon: '🌐',
                label: 'Network',
                value: chain?.name?.replace(' Mainnet', '') || 'Unknown',
                sub: `Chain ${chain?.id || '?'}`,
              },
            ].map(s => (
              <div key={s.label} className="p-3 space-y-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <span>{s.icon}</span> {s.label}
                </p>
                <p className="text-sm font-bold font-mono">{s.value}</p>
                <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
