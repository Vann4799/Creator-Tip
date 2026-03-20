'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { useReadContract } from 'wagmi'; // Will use this later for the smart contract
// import confetti from 'canvas-confetti';

interface FundraisingBarProps {
  walletAddress: string;
  goalTitle: string | null;
  // We'll read the real amount from the contract eventually
  // mockTargetEth?: string; 
}

export function FundraisingBar({ walletAddress, goalTitle }: FundraisingBarProps) {
  // --- MOCK DATA (will be replaced by useReadContract later) ---
  const [currentAmount, setCurrentAmount] = useState(0.4); 
  const targetAmount = 1.0; 
  // --------------------------------------------------------------

  const [reached, setReached] = useState(false);

  // Dynamic calculation
  const percentage = Math.min(100, Math.max(0, (currentAmount / targetAmount) * 100));

  useEffect(() => {
    if (percentage >= 100 && !reached) {
      setReached(true);
      
      // Dynamic import for confetti to avoid SSR issues
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3D5AFE', '#9df0ff', '#ffffff']
        });
      });
    }
  }, [percentage, reached]);

  if (!goalTitle) return null;

  return (
    <div className="pixel-card p-6 mt-6 space-y-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-wider">{goalTitle}</h3>
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/50">
          Target: {targetAmount} ETH
        </span>
      </div>

      <div className="relative h-6 w-full overflow-hidden pixel-input" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {/* Progress Bar Background */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute left-0 top-0 h-full"
          style={{
            background: reached 
              ? 'linear-gradient(90deg, #10b981, #34d399)' 
              : 'linear-gradient(90deg, #3D5AFE, #9df0ff)'
          }}
        />

        {/* Text exactly in the middle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-difference text-white">
          <span className="text-xs font-bold tracking-widest uppercase">
            {percentage.toFixed(1)}% ({currentAmount} ETH)
          </span>
        </div>
      </div>

      <AnimatePresence>
        {reached && (
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
      <p className="text-[9px] text-center text-white/20 uppercase tracking-widest">
         Tracked On-Chain
      </p>
    </div>
  );
}
