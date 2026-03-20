import { supabase, Creator } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { CreatorCard } from '@/components/CreatorCard';
import { FundraisingBar } from '@/components/FundraisingBar';
import { NftShowcase } from '@/components/NftShowcase';
import { TipForm } from '@/components/TipForm';
import { TipFeed } from '@/components/TipFeed';
import { SupportersFeed } from '@/components/SupportersFeed';
import { Leaderboard } from '@/components/Leaderboard';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function CreatorPage({ params }: PageProps) {
  const { username } = await params;

  const { data: creator, error } = await supabase
    .from('creators')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !creator) {
    notFound();
  }

  return (
    <main className="relative min-h-screen text-white overflow-hidden transition-colors duration-500" style={{ background: creator.theme_color || '#3D5AFE' }}>

      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-32 relative z-10">
        <div className="grid gap-10 lg:grid-cols-[400px_1fr]">
          {/* Left Column: Creator Card + Tip Form */}
          <div className="space-y-6">
            <CreatorCard creator={creator as Creator} />
            <FundraisingBar walletAddress={creator.wallet_address} goalTitle={creator.goal_title} />
            <NftShowcase address={creator.wallet_address} />
            <TipForm creator={creator as Creator} />
          </div>

          {/* Right Column: Feed + Leaderboard */}
          <div className="space-y-10">
            <SupportersFeed walletAddress={creator.wallet_address} />
            <TipFeed username={username} />
            <Leaderboard username={username} />
          </div>
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const { data: creator } = await supabase
    .from('creators')
    .select('name, bio')
    .eq('username', username)
    .single();

  return {
    title: creator?.name
      ? `${creator.name} (@${username}) — CreatorTip`
      : `@${username} — CreatorTip`,
    description:
      creator?.bio || `Support @${username} directly with crypto. No middleman, no fees.`,
  };
}
