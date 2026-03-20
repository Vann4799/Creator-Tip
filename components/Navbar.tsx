'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function Navbar() {
  const { address, isConnected } = useAccount();
  const [scrolled, setScrolled] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (address) {
      supabase.from('creators').select('username').eq('wallet_address', address.toLowerCase()).single().then(({ data }) => {
        if (data) setUsername(data.username);
      });
    } else {
      setUsername(null);
    }
  }, [address]);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4 transition-all duration-500 ${scrolled ? 'py-0' : 'py-2'}`}>
      <div
        className="mx-auto flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(61,90,254,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          border: scrolled ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-lg font-bold tracking-tight">
            ◈ Creator<span style={{ color: 'rgba(157,240,255,0.9)' }}>Tip</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-7 text-xs font-medium uppercase tracking-widest">
          <Link href="/#how-it-works"
            className="transition-colors hover:text-white"
            style={{ color: isActive('/#how-it-works') ? '#fff' : 'rgba(255,255,255,0.5)' }}>
            How It Works
          </Link>
          {isConnected && (
            <>
              {username ? (
                <Link href={`/${username}`}
                  style={{ color: isActive(`/${username}`) ? '#9df0ff' : 'rgba(255,255,255,0.5)' }}
                  className="transition-colors hover:text-white">
                  My Profile
                </Link>
              ) : (
                <Link href="/setup"
                  style={{ color: isActive('/setup') ? '#9df0ff' : 'rgba(255,255,255,0.5)' }}
                  className="transition-colors hover:text-white">
                  Setup
                </Link>
              )}
              <Link href="/dashboard"
                style={{ color: isActive('/dashboard') ? '#9df0ff' : 'rgba(255,255,255,0.5)' }}
                className="transition-colors hover:text-white">
                Dashboard
              </Link>
            </>
          )}
          {!isConnected && (
            <Link href="/#creators"
              className="transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.5)' }}>
              Creators
            </Link>
          )}
        </div>

        {/* Connect Wallet */}
        <div className="scale-90 origin-right md:scale-100">
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
        </div>
      </div>
    </nav>
  );
}
