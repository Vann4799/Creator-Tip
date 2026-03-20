'use client';

import { Navbar } from '@/components/Navbar';
import { AsciiGlobe } from '@/components/AsciiGlobe';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const BG = '#3B5BFF';
const CARD_STYLE = { background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 0 };
const CARD_DIM_STYLE = { background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.22)', borderRadius: 0 };

export default function Home() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [existingUsername, setExistingUsername] = useState<string | null>(null);

  // Check if connected wallet already has a profile
  useEffect(() => {
    if (!address) { setExistingUsername(null); return; }
    supabase
      .from('creators')
      .select('username')
      .eq('wallet_address', address.toLowerCase())
      .single()
      .then(({ data }) => {
        setExistingUsername(data?.username ?? null);
      });
  }, [address]);

  // Smart launch: if already has profile → go to profile page, else → setup
  const handleLaunch = () => {
    if (isConnected && existingUsername) {
      router.push(`/${existingUsername}`);
    } else {
      router.push('/setup');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white" style={{ background: BG }}>
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen items-center justify-center px-6 pt-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-12">

          {/* Text */}
          <div className="flex-1 text-center lg:text-left" style={{ maxWidth: 540 }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="mb-6 inline-block px-4 py-2 text-[11px] uppercase tracking-[0.22em]"
                style={{ ...CARD_DIM_STYLE, color: 'rgba(255,255,255,0.65)' }}>
                ● On-Chain Tipping Protocol
              </div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mb-5 text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
              Support creators
              <br />
              <span className="liquid-gradient-text">across the globe</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mb-10 max-w-md text-sm leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.55)' }}>
              Direct wallet-to-wallet tips. No middlemen, no fees.{' '}
              <span className="font-bold text-white">100% yours.</span>
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <button onClick={handleLaunch} className="btn-primary px-8 py-3 text-sm uppercase tracking-wider">
                {isConnected && existingUsername ? `My Page (@${existingUsername}) →` : 'Launch My Page →'}
              </button>
              <a href="#how-it-works" className="glass-button px-8 py-3 text-sm uppercase tracking-wider text-center">
                How It Works
              </a>
            </motion.div>
          </div>

          {/* Globe */}
          <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            style={{ flex: '1 1 0', maxWidth: 540, aspectRatio: '1' }}>
            <AsciiGlobe />
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="mx-auto max-w-4xl px-6 mb-20 -mt-4">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-3 gap-px"
          style={{ border: '1.5px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.35)' }}>
          {[
            { value: '0%', label: 'Platform Fee' },
            { value: '∞', label: 'Chains' },
            { value: '100%', label: 'Ownership' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 py-6"
              style={{ background: BG }}>
              <span className="text-2xl font-bold sm:text-3xl">{stat.value}</span>
              <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-24">
        <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          How It Works
        </motion.h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { step: '01', title: 'Connect Wallet', desc: 'Link MetaMask, Coinbase, or any Web3 wallet in one click.' },
            { step: '02', title: 'Build Profile', desc: 'Set up your public page with avatar, bio, and social links.' },
            { step: '03', title: 'Receive Tips', desc: 'Fans send crypto directly to your wallet. Zero fees, instant.' },
          ].map((item, i) => (
            <motion.div key={item.step}
              initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={CARD_STYLE}
              className="p-8 transition-all duration-200 hover:bg-white/10 cursor-default">
              <span className="text-5xl font-black block mb-4" style={{ color: 'rgba(255,255,255,0.07)' }}>
                {item.step}
              </span>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider">{item.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 text-center text-[10px] uppercase tracking-[0.32em]"
        style={{ borderTop: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.22)' }}>
        Crafted for the decentralized web ◈
      </footer>
    </main>
  );
}
