'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Menu, X as CloseIcon } from 'lucide-react';

export function Navbar() {
  const { address, isConnected } = useAccount();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
        className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3 rounded-full transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(61,90,254,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          border: scrolled ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex flex-shrink-0 items-center gap-2 group z-50">
          <span className="text-lg font-bold tracking-tight">
            ◈ Creator<span style={{ color: 'rgba(157,240,255,0.9)' }}>Tip</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
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

        {/* Action Area (Desktop + Mobile) */}
        <div className="flex items-center gap-3 z-50">
          <div className="scale-90 origin-right md:scale-100 hidden sm:block">
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
          </div>
          
          <button 
            className="md:hidden flex items-center p-2 text-white/70 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-4 right-4 mt-2 p-6 rounded-2xl flex flex-col gap-6 text-sm font-bold uppercase tracking-widest bg-[#2E48E8]/95 backdrop-blur-xl border border-white/20 shadow-2xl origin-top animate-in slide-in-from-top-4 fade-in z-40">
          <Link href="/#how-it-works" onClick={() => setMenuOpen(false)} style={{ color: isActive('/#how-it-works') ? '#fff' : 'rgba(255,255,255,0.7)' }}>
            How It Works
          </Link>
          {isConnected && (
            <>
              {username ? (
                <Link href={`/${username}`} onClick={() => setMenuOpen(false)} style={{ color: isActive(`/${username}`) ? '#9df0ff' : 'rgba(255,255,255,0.7)' }}>
                  My Profile
                </Link>
              ) : (
                <Link href="/setup" onClick={() => setMenuOpen(false)} style={{ color: isActive('/setup') ? '#9df0ff' : 'rgba(255,255,255,0.7)' }}>
                  Setup
                </Link>
              )}
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ color: isActive('/dashboard') ? '#9df0ff' : 'rgba(255,255,255,0.7)' }}>
                Dashboard
              </Link>
            </>
          )}
          {!isConnected && (
            <Link href="/#creators" onClick={() => setMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.7)' }}>
              Creators
            </Link>
          )}
          
          <div className="pt-4 mt-2 border-t border-white/10 flex justify-center scale-100 sm:hidden">
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="full" />
          </div>
        </div>
      )}
    </nav>
  );
}
