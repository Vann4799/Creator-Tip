'use client';

import { useReadContract, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { TIP_GOAL_ABI, TIP_GOAL_ADDRESS } from '@/lib/abi';
import { getNativeSymbol } from '@/lib/chains';

export function SupportersFeed({ walletAddress }: { walletAddress: string }) {
  const { chain } = useAccount();
  const tokenSymbol = getNativeSymbol(chain?.id);
  const { data: tips, isLoading, isError } = useReadContract({
    address: TIP_GOAL_ADDRESS as `0x${string}`,
    abi: TIP_GOAL_ABI,
    functionName: 'getTips',
    args: [walletAddress as `0x${string}`],
    query: {
      refetchInterval: 5000, 
    }
  });

  if (TIP_GOAL_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="pixel-card p-6 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <p className="text-[10px] text-white/40 tracking-widest uppercase mb-1">CONTRACT NOT DEPLOYED YET</p>
        <p className="text-[9px] text-white/20 tracking-widest uppercase">No on-chain supporters.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pixel-card p-6 animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <p className="text-xs text-white/40 tracking-widest font-mono uppercase text-center">Loading supporters...</p>
      </div>
    );
  }

  if (isError || !tips || tips.length === 0) {
    return (
      <div className="pixel-card p-6 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <p className="text-xs text-white/40 tracking-widest uppercase">No on-chain supporters yet.</p>
      </div>
    );
  }

  // Define explicitly based on known contract struct
  type Tip = { sender: string; amount: bigint; timestamp: bigint };
  
  // Clone and sort descending
  const sortedTips = [...(tips as Tip[])].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold uppercase tracking-widest flex items-center gap-2">
        <span>⛓️</span> On-Chain Supporters
      </h2>
      
      <div className="space-y-3">
        {sortedTips.map((tip, i) => {
          const date = new Date(Number(tip.timestamp) * 1000);
          const shortAddress = `${tip.sender.slice(0, 6)}...${tip.sender.slice(-4)}`;
          
          return (
            <div key={`${tip.sender}-${i}`} className="pixel-card p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div>
                <p className="text-sm font-bold truncate text-[#9df0ff]">{shortAddress}</p>
                <p className="text-[10px] text-white/50">{date.toLocaleDateString()} {date.toLocaleTimeString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold">{formatEther(tip.amount)} {tokenSymbol}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
