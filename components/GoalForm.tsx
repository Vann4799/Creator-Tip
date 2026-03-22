'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, toHex } from 'viem';
import { TIP_GOAL_ABI, TIP_GOAL_ADDRESS } from '@/lib/abi';
import { Loader2 } from 'lucide-react';

export function GoalForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetEth, setTargetEth] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (!title || !description || !targetEth || !deadlineDate) {
        throw new Error('Please fill all fields');
      }

      const targetAmountWei = parseEther(targetEth);
      const deadlineTimestamp = Math.floor(new Date(deadlineDate).getTime() / 1000);

      if (deadlineTimestamp <= Math.floor(Date.now() / 1000)) {
        throw new Error('Deadline must be in the future');
      }

      writeContract({
        address: TIP_GOAL_ADDRESS as `0x${string}`,
        abi: TIP_GOAL_ABI,
        functionName: 'createGoal',
        args: [title, description, targetAmountWei, BigInt(deadlineTimestamp)],
        dataSuffix: toHex('bc_g8klthvq'),
      });
      
      // We rely on useWaitForTransactionReceipt for success state, 
      // but conceptually you could trigger onSuccess here optionally.
    } catch (err: any) {
      setErrorMsg(err.message || 'Error parsing goal data');
    }
  };

  // If transaction was successful, they might just see a success state.
  if (isSuccess) {
    return (
      <div className="pixel-card p-6 bg-green-500/10 border-green-500/30 text-center">
        <p className="text-sm font-bold text-green-400 uppercase tracking-widest mb-2">🎉 Goal Active!</p>
        <p className="text-xs text-white/60">Your on-chain fundraising goal is now live on your profile.</p>
        <button 
          onClick={onSuccess}
          className="mt-4 px-4 py-2 pixel-input text-xs uppercase"
        >
          View Profile
        </button>
      </div>
    );
  }

  const isWorking = isPending || isConfirming;

  return (
    <div className="pixel-card relative overflow-hidden bg-[#09090b]/80 p-6">
        <h2 className="text-lg font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
          <span>🎯</span> Create On-Chain Goal
        </h2>
        <p className="text-xs text-white/50 mb-6 leading-relaxed">
          Set up a verifiable fundraising goal via Smart Contract. Funds go directly to your wallet instantly when tipped.
        </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Goal Title</label>
          <input
            type="text"
            required
            placeholder="e.g. New Studio Mic 🎙️"
            className="w-full pixel-input px-3 py-2 text-sm"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={isWorking}
          />
        </div>

        <div>
           <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Description</label>
          <textarea
            required
            rows={2}
            placeholder="Help me improve stream quality..."
            className="w-full pixel-input px-3 py-2 text-sm resize-none"
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={isWorking}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Target (ETH)</label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              required
              placeholder="0.5"
              className="w-full pixel-input px-3 py-2 text-sm"
              value={targetEth}
              onChange={e => setTargetEth(e.target.value)}
              disabled={isWorking}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Deadline</label>
            <input
              type="datetime-local"
              required
              className="w-full pixel-input px-3 py-2 text-sm"
              value={deadlineDate}
              onChange={e => setDeadlineDate(e.target.value)}
              disabled={isWorking}
            />
          </div>
        </div>

        {(errorMsg || writeError) && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {errorMsg || (writeError as any)?.shortMessage || writeError?.message}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isWorking}
          className="w-full btn-primary py-3 px-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
        >
          {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : '🚀 Launch Goal Contract'}
        </button>
      </form>
    </div>
  );
}
