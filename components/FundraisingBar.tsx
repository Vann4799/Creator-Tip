'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { formatEther, parseEther, toHex } from 'viem';
import { TIP_GOAL_ABI, TIP_GOAL_ADDRESS } from '@/lib/abi';
import { Loader2 } from 'lucide-react';

export function FundraisingBar({ walletAddress, goalTitle }: { walletAddress: string; goalTitle: string | null }) {
  const { chain } = useAccount();
  const tokenSymbol = chain?.nativeCurrency?.symbol || 'ETH';
  
  const [reached, setReached] = useState(false);

  // Read the goal structure
  const { data: goalData, isError, isLoading } = useReadContract({
    address: TIP_GOAL_ADDRESS as `0x${string}`,
    abi: TIP_GOAL_ABI,
    functionName: 'getGoal',
    args: [walletAddress as `0x${string}`],
    query: {
      refetchInterval: 5000, // auto-refresh every 5s
    }
  });

  const isActive = goalData ? goalData.isActive : false;
  const isGoalReached = goalData ? goalData.goalReached : false;
  
  const [tipEth, setTipEth] = useState('');
  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handleTipGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipEth || isNaN(Number(tipEth)) || Number(tipEth) <= 0) return;
    
    writeContract({
      address: TIP_GOAL_ADDRESS as `0x${string}`,
      abi: TIP_GOAL_ABI,
      functionName: 'tipCreator',
      args: [walletAddress as `0x${string}`],
      value: parseEther(tipEth),
      dataSuffix: toHex('bc_g8klthvq'),
    });
  };

  useEffect(() => {
    if (isSuccess) setTipEth('');
  }, [isSuccess]);
  
  // We can either use DB title as fallback, or purely rely on SC. 
  // We'll use SC title if active, otherwise DB title as an informational "target" they haven't launched yet on-chain.
  const displayTitle = (isActive && goalData?.title) ? goalData.title : goalTitle;

  const targetEth = goalData ? Number(formatEther(goalData.targetAmount)) : 1.0;
  const currentEth = goalData ? Number(formatEther(goalData.collectedAmount)) : 0.0;
  const percentage = targetEth > 0 ? Math.min(100, Math.max(0, (currentEth / targetEth) * 100)) : 0;

  useEffect(() => {
    // If goalReached is true from contract or percentage >= 100
    if ((isGoalReached || percentage >= 100) && !reached && isActive) {
      setReached(true);
      
      // Dynamic import for confetti to avoid SSR issues
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#3D5AFE', '#9df0ff', '#ffffff']
        });
      });
    }
  }, [percentage, reached, isGoalReached, isActive]);

  // If there's no active smart contract goal AND no database goal title, don't show it.
  if (!isActive && !goalTitle) return null;

  return (
    <div className="pixel-card p-6 mt-6 space-y-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-wider">{displayTitle}</h3>
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/50">
          Target: {isActive ? targetEth.toFixed(4) : '—'} {tokenSymbol}
        </span>
      </div>

      {!isActive && goalTitle && (
        <div className="px-3 py-2 text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/80 mb-2">
          This goal hasn't been launched on-chain yet.
        </div>
      )}

      {isActive && (
        <>
          <div className="relative h-6 w-full overflow-hidden pixel-input" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute left-0 top-0 h-full"
              style={{
                background: (reached || isGoalReached)
                  ? 'linear-gradient(90deg, #10b981, #34d399)' 
                  : 'linear-gradient(90deg, #3D5AFE, #9df0ff)'
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-difference text-white">
              <span className="text-xs font-bold tracking-widest uppercase">
                {percentage.toFixed(1)}% ({currentEth.toFixed(4)} {tokenSymbol})
              </span>
            </div>
          </div>

          <AnimatePresence>
            {(reached || isGoalReached) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <span className="inline-block px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/50 text-[10px] uppercase tracking-widest font-bold">
                  🎉 Goal Reached!
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tip to Goal Form */}
          {!isGoalReached && (
            <form onSubmit={handleTipGoal} className="pt-3 border-t border-white/10 mt-4">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  required
                  placeholder="0.05 ETH"
                  className="flex-1 pixel-input px-3 py-2 text-sm"
                  value={tipEth}
                  onChange={e => setTipEth(e.target.value)}
                  disabled={isPending || isConfirming}
                />
                <button 
                  type="submit" 
                  disabled={isPending || isConfirming || !tipEth}
                  className="btn-primary px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {(isPending || isConfirming) ? <Loader2 className="animate-spin" size={14} /> : 'Fund Goal'}
                </button>
              </div>
              {writeError && (
                <p className="text-red-400 text-[10px] mt-2 text-center uppercase">{(writeError as any).shortMessage || 'Transaction Failed'}</p>
              )}
            </form>
          )}
        </>
      )}

      <p className="text-[9px] text-center text-white/20 uppercase tracking-widest flex items-center justify-center gap-1.5 mt-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        {isActive ? 'Live On-Chain Tracking' : 'Off-Chain Draft'}
      </p>
    </div>
  );
}
