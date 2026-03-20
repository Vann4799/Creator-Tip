'use client';

import { Creator } from '@/lib/supabase';

const CARD = { background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 0 };
const CARD_SM = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 0 };

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <div style={CARD} className="relative overflow-hidden p-8">
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
            <a href={`https://twitter.com/${creator.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
              className="transition-colors px-3 py-1 text-xs"
              style={{ ...CARD_SM, color: 'rgba(255,255,255,0.6)' }}>
              𝕏 {creator.twitter}
            </a>
          )}
          {creator.github && (
            <a href={`https://github.com/${creator.github.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
              className="transition-colors px-3 py-1 text-xs"
              style={{ ...CARD_SM, color: 'rgba(255,255,255,0.6)' }}>
              ⚡ {creator.github}
            </a>
          )}
          {creator.website && (
            <a href={creator.website} target="_blank" rel="noopener noreferrer"
              className="transition-colors px-3 py-1 text-xs"
              style={{ ...CARD_SM, color: 'rgba(255,255,255,0.6)' }}>
              🌐 Website
            </a>
          )}
        </div>

        <div className="px-4 py-1.5 text-xs" style={{ ...CARD_SM, color: 'rgba(255,255,255,0.35)' }}>
          {truncateAddress(creator.wallet_address)}
        </div>
      </div>
    </div>
  );
}
