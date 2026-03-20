export const CHAIN_SYMBOLS: Record<number, string> = {
  // Mainnets
  1: 'ETH',
  8453: 'ETH',
  10: 'ETH',
  42161: 'ETH',
  137: 'POL',
  56: 'BNB',
  // Testnets
  11155111: 'ETH',
  84532: 'ETH',
  11155420: 'ETH',
  421614: 'ETH',
  80002: 'POL',
  97: 'BNB',
};

export function getNativeSymbol(chainId?: number | null): string {
  if (!chainId) return 'ETH';
  return CHAIN_SYMBOLS[chainId] || 'ETH';
}
