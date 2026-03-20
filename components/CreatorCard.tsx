'use client';

import { Creator } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Share2, X as CloseIcon, Copy, Twitter } from 'lucide-react';

const CARD = { background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 0 };
const CARD_SM = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 0 };

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function CreatorCard({ creator }: { creator: Creator }) {
  const [showShare, setShowShare] = useState(false);
  const [pageUrl, setPageUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `Support ${creator.name || `@${creator.username}`} via crypto instantly! ⚡`;

  return (
    <div style={CARD} className="relative overflow-hidden p-8">
      {/* Share Modal Overlay */}
      {showShare && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#3D5AFE]/95 backdrop-blur-sm p-6 animate-in fade-in duration-200">
          <button onClick={() => setShowShare(false)} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <CloseIcon size={24} />
          </button>
          
          <h2 className="text-lg font-bold mb-6 tracking-tight">Share Profile</h2>
          
          <div className="bg-white p-4 mb-6" style={{ borderRadius: 0 }}>
            <QRCode value={pageUrl || 'https://creator-tip.vercel.app'} size={140} />
          </div>

          <div className="flex w-full gap-2 mb-4">
            <button onClick={handleCopy} className="flex-1 pixel-card flex items-center justify-center gap-2 py-3 hover:bg-white/10 transition-colors text-sm">
              <Copy size={16} />
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <div className="flex w-full gap-2 relative z-[60]">
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`} 
               target="_blank" rel="noopener noreferrer"
               className="flex-1 pixel-card flex items-center justify-center gap-2 py-3 hover:bg-white/10 transition-colors text-sm bg-black/20">
              <Twitter size={16} />
              Twitter
            </a>
            <a href={`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(pageUrl)}`} 
               target="_blank" rel="noopener noreferrer"
               className="flex-1 pixel-card flex items-center justify-center gap-2 py-3 hover:bg-white/10 transition-colors text-sm bg-[#8a63d2]/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 3H5.76C4.24 3 3 4.24 3 5.76v12.48C3 19.76 4.24 21 5.76 21h12.48C19.76 21 21 19.76 21 18.24V5.76C21 4.24 19.76 3 18.24 3Zm-2.6 12.8a.65.65 0 0 1-.65.65h-6.8a.65.65 0 0 1-.65-.65V15h8.1v.8Zm.5-2.2a.65.65 0 0 1-.65.65h-7.8a.65.65 0 0 1-.65-.65V9.45c0-.36.29-.65.65-.65h7.8c.36 0 .65.29.65.65V13.6Z"/></svg>
              Farcaster
            </a>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 text-center">
        {/* Avatar */}
        <div className="relative">
          {creator.avatar_url ? (
            <img src={creator.avatar_url} alt={creator.name || creator.username}
              className="h-24 w-24 rounded-full object-cover"
              style={{ border: '2px solid rgba(255,255,255,0.3)' }} />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center text-3xl font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '50%' }}>
              {(creator.name || creator.username).charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute bottom-1 right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500"
              style={{ border: '2px solid #3B5BFF' }} />
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{creator.name || `@${creator.username}`}</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>@{creator.username}</p>
        </div>

        {creator.bio && (
          <p className="max-w-xs text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {creator.bio}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          {creator.twitter && (
            <a href={creator.twitter.startsWith('http') ? creator.twitter : `https://x.com/${creator.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors px-3 py-1.5 text-xs hover:bg-white/10"
              style={{ ...CARD_SM, color: 'rgba(255,255,255,0.7)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
              <span>{creator.twitter.replace('https://x.com/', '').replace('https://twitter.com/', '')}</span>
            </a>
          )}
          {creator.github && (
            <a href={creator.github.startsWith('http') ? creator.github : `https://github.com/${creator.github}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors px-3 py-1.5 text-xs hover:bg-white/10"
              style={{ ...CARD_SM, color: 'rgba(255,255,255,0.7)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              <span>{creator.github.replace('https://github.com/', '')}</span>
            </a>
          )}
          {creator.linkedin && (
            <a href={creator.linkedin.startsWith('http') ? creator.linkedin : `https://linkedin.com/in/${creator.linkedin}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors px-3 py-1.5 text-xs hover:bg-white/10"
              style={{ ...CARD_SM, color: 'rgba(255,255,255,0.7)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              <span>{creator.linkedin.replace('https://linkedin.com/in/', '').replace('https://www.linkedin.com/in/', '')}</span>
            </a>
          )}
          {creator.website && (
            <a href={creator.website.startsWith('http') ? creator.website : `https://${creator.website}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors px-3 py-1.5 text-xs hover:bg-white/10"
              style={{ ...CARD_SM, color: 'rgba(255,255,255,0.7)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
              <span>Website</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="px-4 py-1.5 text-xs font-mono" style={{ ...CARD_SM, color: 'rgba(255,255,255,0.45)' }}>
            {truncateAddress(creator.wallet_address)}
          </div>
          <button onClick={() => setShowShare(true)} 
            className="p-1.5 text-white/50 hover:text-white transition-colors"
            style={CARD_SM} title="Share Profile">
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
