'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { TipHistory } from '@/components/TipHistory';
import { Leaderboard } from '@/components/Leaderboard';
import { GoalForm } from '@/components/GoalForm';
import { supabase, Creator } from '@/lib/supabase';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    supabase
      .from('creators')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .single()
      .then(({ data }) => {
        setCreator(data as Creator || null);
        setLoading(false);
      });
  }, [address]);

  if (!isConnected) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#030005] text-white">
        <Navbar />
        <div className="glass-panel p-16 text-center max-w-md mx-4">
          <p className="text-6xl mb-6 filter drop-shadow-md">🔒</p>
          <h2 className="text-2xl font-bold mb-3 tracking-tight">Connect Your Wallet</h2>
          <p className="text-white/50 font-light">Dashboard is only accessible with a connected Web3 wallet.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen text-white overflow-hidden" style={{ background: '#3D5AFE' }}>

      <Navbar />

      <div className="mx-auto max-w-5xl px-6 py-32 relative z-10">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
            {creator && (
              <p className="mt-2 text-sm font-light" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Your page →{' '}
                <Link href={`/${creator.username}`} className="font-medium transition-colors" style={{ color: '#9df0ff' }}>
                  /{creator.username}
                </Link>
              </p>
            )}
          </div>
            <div className="flex gap-4">
              <Link href="/setup" className="glass-button rounded-full px-5 py-2.5 text-sm font-medium transition-all">
                ✏️ Edit Profile
              </Link>
              {creator && (
                <Link href={`/${creator.username}`} className="btn-primary rounded-full px-5 py-2.5 text-sm font-medium transition-all hover:scale-105">
                  🔗 My Page
                </Link>
              )}
            </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'transparent' }} />
          </div>
        ) : !creator ? (
          /* No profile yet */
          <div className="glass-panel p-16 text-center max-w-2xl mx-auto mt-10">
            <p className="text-6xl mb-6 filter drop-shadow-md">🎨</p>
            <h2 className="text-3xl font-bold mb-3 tracking-tight">You don&apos;t have a creator page yet</h2>
            <p className="mb-10 text-base font-light" style={{ color: 'rgba(255,255,255,0.55)' }}>Set up your public profile to start receiving crypto tips directly to your wallet.</p>
            <Link href="/setup" className="btn-primary inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold">
              🚀 Launch My Profile
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Profile Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {[
                { icon: '◈', label: 'Username', value: `@${creator.username}` },
                { icon: '🌐', label: 'Network', value: 'Multi-chain' },
                { icon: '🔗', label: 'Wallet', value: `${address?.slice(0, 6)}...${address?.slice(-4)}` },
                { icon: '✦', label: 'Status', value: 'Live' },
              ].map((s) => (
                <div key={s.label} className="glass-panel p-6 hover:-translate-y-1 transition-transform">
                  <p className="text-[10px] mb-2 uppercase tracking-widest font-bold flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <span className="text-base filter drop-shadow-sm" style={{ color: '#9df0ff' }}>{s.icon}</span> {s.label}
                  </p>
                  <p className="font-semibold text-base truncate">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Smart Contract Goal Form */}
            <section className="max-w-xl">
              <GoalForm />
            </section>

            {/* Tip History */}
            <section>
              <h2 className="text-2xl font-bold mb-6 tracking-tight">◈ Tips Received</h2>
              <TipHistory walletAddress={address!} />
            </section>

            {/* Leaderboard */}
            <section className="max-w-xl">
              <Leaderboard username={creator.username} />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
