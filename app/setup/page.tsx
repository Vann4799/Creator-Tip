'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { supabase, Creator } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';

export default function SetupPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  const [form, setForm] = useState({
    username: '',
    name: '',
    bio: '',
    avatar_url: '',
    twitter: '',
    github: '',
    website: '',
  });

  // Load existing profile
  useEffect(() => {
    if (!address) return;
    setLoading(true);
    supabase
      .from('creators')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .single()
      .then(({ data }) => {
        if (data) {
          setHasExistingProfile(true);
          setForm({
            username: data.username || '',
            name: data.name || '',
            bio: data.bio || '',
            avatar_url: data.avatar_url || '',
            twitter: data.twitter || '',
            github: data.github || '',
            website: data.website || '',
          });
        }
        setLoading(false);
      });
  }, [address]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !address) return;
    setAvatarUploading(true);
    setError('');

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${address.toLowerCase()}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true, cacheControl: '0' });

    if (uploadError) {
      setError('Upload gagal: ' + uploadError.message + ' — Pastikan bucket "avatars" public di Supabase Storage.');
      setAvatarUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Append cache-buster so browser always shows fresh image
    const freshUrl = urlData.publicUrl + '?t=' + Date.now();
    setForm((f) => ({ ...f, avatar_url: freshUrl }));
    setAvatarUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setError('');
    setSaving(true);

    // Validate username
    if (!form.username || !/^[a-z0-9_-]{3,20}$/.test(form.username)) {
      setError('Username must be 3-20 chars: a-z, 0-9, _ or -');
      setSaving(false);
      return;
    }

    const { error: upsertError } = await supabase.from('creators').upsert(
      {
        wallet_address: address.toLowerCase(),
        username: form.username,
        name: form.name || null,
        bio: form.bio || null,
        avatar_url: form.avatar_url || null,
        twitter: form.twitter || null,
        github: form.github || null,
        website: form.website || null,
      },
      { onConflict: 'wallet_address' }
    );

    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push(`/${form.username}`), 1500);
    }
  };

  if (!isConnected) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center text-white" style={{ background: '#3B5BFF' }}>
        <Navbar />
        <div className="text-center max-w-md mx-4 p-16" style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 0 }}>
          <p className="text-6xl mb-6">🔒</p>
          <h2 className="text-2xl font-bold mb-3 tracking-tight">Connect Your Wallet</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>A connected Web3 wallet is required to set up your creator profile.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen text-white overflow-hidden" style={{ background: '#3D5AFE' }}>

      <Navbar />

      <div className="mx-auto max-w-xl px-6 py-32 z-10 relative">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">{form.username ? 'Edit Your Creator Page' : 'Setup Your Creator Page'}</h1>
          <p className="mt-3 text-sm font-light" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Your public tip page will be live at{' '}
            <span className="font-medium" style={{ color: '#9df0ff' }}>
              yourdomain.com/{form.username || 'username'}
            </span>
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <form onSubmit={handleSave} className="pixel-card p-8 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {form.avatar_url ? (
                  <img
                    src={form.avatar_url}
                    alt="avatar"
                    className="h-24 w-24 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/25 text-3xl font-bold text-white" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    {form.name ? form.name.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/50 border-t-transparent" />
                  </div>
                )}
              </div>
              <label className="glass-button cursor-pointer px-5 py-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {avatarUploading ? 'Uploading...' : '📸 Upload Avatar'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                />
              </label>
            </div>

            {/* Username */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Username *
              </label>
              <div className="flex items-center gap-0 overflow-hidden pixel-input">
                <span className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.3)', borderRight: '2px solid rgba(255,255,255,0.15)' }}>
                  yourdomain.com/
                </span>
                <input
                  type="text"
                  placeholder="vann4799"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))}
                  className="flex-1 bg-transparent px-4 py-3 text-sm outline-none font-medium"
                  style={{ color: '#e8f4fd' }}
                  required
                />
              </div>
              <p className="mt-2 text-[10px] uppercase font-bold tracking-wider text-white/30">3-20 chars, lowercase a-z, 0-9, _ or -</p>
            </div>

            {/* Name */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Display Name
              </label>
              <input
                type="text"
                placeholder="Vann Exmachina"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full pixel-input px-4 py-3 text-sm font-medium"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Bio
              </label>
              <textarea
                placeholder="Builder. On-chain. Coffee-powered. ☕"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3}
                className="w-full resize-none pixel-input px-4 py-3 text-sm font-light leading-relaxed"
              />
            </div>

            {/* Social Links */}
            <div className="pixel-card p-6 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>Social Links</p>
              {[
                { key: 'twitter', icon: '𝕏', placeholder: '@username' },
                { key: 'github', icon: '⚡', placeholder: 'githubuser' },
                { key: 'website', icon: '🌐', placeholder: 'https://yoursite.com' },
              ].map(({ key, icon, placeholder }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center filter drop-shadow-md">{icon}</span>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="flex-1 pixel-input px-4 py-2.5 text-sm font-light"
                  />
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="pixel-card px-4 py-3 text-sm text-red-300" style={{ borderColor: 'rgba(248,113,113,0.4)' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="pixel-card px-4 py-3 text-sm text-green-300" style={{ borderColor: 'rgba(74,222,128,0.4)' }}>
                ✅ Profile saved! Redirecting to your page...
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving || success}
              className="btn-primary w-full py-4 text-sm font-bold uppercase tracking-wider disabled:opacity-50 mt-4"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'rgba(160,216,239,0.5)', borderTopColor: 'transparent' }} />
                  Processing...
                </span>
              ) : (
                <>
                  {form.username ? '💾 Save Changes' : '🚀 Save & Publish Profile'}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
