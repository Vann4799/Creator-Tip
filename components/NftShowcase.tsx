'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface NFT {
  contract: { address: string; name: string };
  tokenId: string;
  name: string;
  description: string;
  image: { cachedUrl: string; thumbnailUrl: string; originalUrl: string };
}

export function NftShowcase({ address }: { address: string }) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!address) return;

    const fetchNFTs = async () => {
      try {
        setLoading(true);
        // We'll scan ETH, Polygon, and Arbitrum since many users hold test/OAT NFTs there
        const chains = ['eth-mainnet', 'polygon-mainnet', 'arb-mainnet'];
        
        const fetchPromises = chains.map(chain => 
          fetch(`https://${chain}.g.alchemy.com/nft/v3/demo/getNFTsForOwner?owner=${address}&withMetadata=true&pageSize=10`)
            .then(res => {
              if (!res.ok) throw new Error(`Failed to fetch from ${chain}`);
              return res.json();
            })
        );

        const results = await Promise.allSettled(fetchPromises);
        let allNfts: any[] = [];

        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value.ownedNfts) {
            allNfts = [...allNfts, ...result.value.ownedNfts];
          }
        });

        // Filter valid ones with images
        const validNfts = allNfts.filter((nft: any) => 
          nft.image && (nft.image.cachedUrl || nft.image.thumbnailUrl || nft.image.originalUrl)
        );

        // Sort roughly or just take the first 6
        setNfts(validNfts.slice(0, 6));
      } catch (err: any) {
        console.error("Error fetching NFTs:", err);
        setError('No public NFTs found.');
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [address]);

  if (loading) {
    return (
      <div className="pixel-card p-6 flex items-center justify-center animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <p className="text-xs tracking-wider uppercase text-white/40 font-mono">Loading Collection...</p>
      </div>
    );
  }

  if (error || nfts.length === 0) {
    return (
      <div className="pixel-card p-6 flex flex-col items-center justify-center gap-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <p className="text-xs tracking-wider uppercase text-white/40 font-mono flex items-center gap-2">
          <span>🖼️</span> No Multi-Chain NFTs Found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-bold tracking-widest uppercase">NFT Showcase</h2>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {nfts.map((nft, i) => {
          const imageUrl = nft.image.thumbnailUrl || nft.image.cachedUrl || nft.image.originalUrl;
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={`${nft.contract.address}-${nft.tokenId}`} 
              className="pixel-card group relative overflow-hidden aspect-square"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <img 
                src={imageUrl} 
                alt={nft.name || `NFT ${nft.tokenId}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iIzY2NiIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-xs font-bold truncate">{nft.name || `#${nft.tokenId}`}</p>
                <p className="text-[9px] text-white/50 uppercase tracking-wider truncate">{nft.contract.name || 'Unknown Collection'}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="text-[9px] text-right text-white/30 tracking-widest uppercase font-mono mt-2">Powered by Alchemy</p>
    </div>
  );
}
