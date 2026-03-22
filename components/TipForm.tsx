'use client';

import { useState } from 'react';
import { useSendTransaction, useAccount, useChainId } from 'wagmi';
import { parseEther, toHex } from 'viem';
import { supabase, Creator } from '@/lib/supabase';

const PRESET_AMOUNTS = [
  { label: '☕ 0.001', value: '0.001' },
  { label: '🍕 0.01', value: '0.01' },
  { label: '🚀 0.05', value: '0.05' },
];

const CHAIN_NAMES: Record<number, string> = {
  11155111: 'Sepolia', 84532: 'Base Sepolia', 11155420: 'OP Sepolia', 421614: 'Arb Sepolia', 80002: 'Polygon Amoy',
};

const CARD = { background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 0 };
const INPUT_STYLE = { background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 0, color: '#fff', fontFamily: 'inherit', outline: 'none', width: '100%', display: 'block', padding: '10px 14px', fontSize: '13px' };

interface TipFormProps { creator: Creator; onTipSuccess?: () => void; }

export function TipForm({ creator, onTipSuccess }: TipFormProps) {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const tokenSymbol = chain?.nativeCurrency?.symbol || 'ETH';
  const blockExplorerUrl = chain?.blockExplorers?.default?.url || 'https://etherscan.io';
  
  const [amount, setAmount] = useState('0.001');
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('0.001');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { sendTransactionAsync } = useSendTransaction();
  const finalAmount = customAmount || amount;

  const handlePreset = (val: string) => { setSelectedPreset(val); setAmount(val); setCustomAmount(''); };
  const handleCustom = (val: string) => { setCustomAmount(val); setSelectedPreset(''); };

  const handleTip = async () => {
    if (!isConnected || !address || !finalAmount || parseFloat(finalAmount) <= 0) return;
    setStatus('pending'); setErrorMsg('');
    try {
      // Send transaction with Base Build referral code tracking
      const hash = await sendTransactionAsync({
        to: creator.wallet_address as `0x${string}`,
        value: parseEther(finalAmount),
        data: toHex('bc_g8klthvq'),
      });
      setTxHash(hash);
      await supabase.from('tips').insert({
        from_address: address.toLowerCase(), to_address: creator.wallet_address.toLowerCase(),
        to_username: creator.username, amount_eth: parseFloat(finalAmount),
        message: message.trim() || null, chain_id: chainId,
        chain_name: CHAIN_NAMES[chainId] || `Chain ${chainId}`, tx_hash: hash,
      });
      setStatus('success'); setMessage(''); onTipSuccess?.();
    } catch (err: unknown) {
      setStatus('error');
      const e = err as { message?: string; shortMessage?: string };
      setErrorMsg(e.shortMessage || e.message || 'Transaction failed');
    }
  };

  const isSelf = address?.toLowerCase() === creator.wallet_address.toLowerCase();

  return (
    <div style={CARD} className="p-6 space-y-4">
      <h2 className="text-sm font-bold text-center uppercase tracking-wider">
        Support <span className="liquid-gradient-text">{creator.name || `@${creator.username}`}</span>
      </h2>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-2">
        {PRESET_AMOUNTS.map((p) => (
          <button key={p.value} onClick={() => handlePreset(p.value)}
            className="py-3 text-xs font-bold uppercase tracking-wider transition-all"
            style={{
              ...{ background: selectedPreset === p.value ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)', border: selectedPreset === p.value ? '1.5px solid rgba(255,255,255,0.7)' : '1.5px solid rgba(255,255,255,0.25)', borderRadius: 0 },
              color: selectedPreset === p.value ? '#fff' : 'rgba(255,255,255,0.5)',
            }}>
            {p.label} {tokenSymbol}
          </button>
        ))}
      </div>

      {/* Custom */}
      <div className="flex items-center gap-2" style={{ ...INPUT_STYLE, padding: 0 }}>
        <span className="px-3 py-2.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Custom:</span>
        <input type="number" placeholder="0.00" step="0.0001" min="0.0001" value={customAmount}
          onChange={(e) => handleCustom(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '13px', padding: '10px 0' }} />
        <span className="px-3 text-xs font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>{tokenSymbol}</span>
      </div>

      {/* Message */}
      <textarea placeholder="Write a message (optional)..." value={message}
        onChange={(e) => setMessage(e.target.value)} maxLength={200} rows={3}
        style={{ ...INPUT_STYLE, resize: 'none', lineHeight: '1.5' }} />

      {/* Chain */}
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider px-1"
        style={{ color: 'rgba(255,255,255,0.3)' }}>
        <span>Network: <span style={{ color: '#fff', fontWeight: 700 }}>{CHAIN_NAMES[chainId] || `Chain ${chainId}`}</span></span>
        <span>Direct transfer</span>
      </div>

      {/* Status */}
      {status === 'success' && (
        <div style={{ ...CARD, borderColor: 'rgba(74,222,128,0.5)' }} className="p-3 text-xs text-green-300 text-center space-y-1">
          <div className="font-bold">✓ Tip sent successfully!</div>
          {txHash && <a href={`${blockExplorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="hover:underline break-all" style={{ color: 'rgba(74,222,128,0.65)', display: 'block' }}>{txHash.slice(0, 20)}...{txHash.slice(-8)}</a>}
        </div>
      )}
      {status === 'error' && (
        <div style={{ ...CARD, borderColor: 'rgba(248,113,113,0.5)' }} className="p-3 text-xs text-red-300 text-center">⚠ {errorMsg}</div>
      )}

      {/* Button */}
      {!isConnected ? (
        <div style={{ ...CARD, padding: '16px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
          Connect wallet to support
        </div>
      ) : isSelf ? (
        <div style={{ ...CARD, padding: '16px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
          This is your own page
        </div>
      ) : (
        <button onClick={handleTip} disabled={status === 'pending'}
          className="btn-primary w-full py-4 text-xs uppercase tracking-wider disabled:opacity-50">
          {status === 'pending' ? 'Processing...' : `→ Send ${finalAmount} ${tokenSymbol}`}
        </button>
      )}
    </div>
  );
}
