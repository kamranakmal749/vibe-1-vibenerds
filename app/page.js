'use client';
// app/page.js — Root redirect based on auth state

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role === 'rider') {
      router.replace('/rider');
    } else {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="loading-center">
      <div className="spinner" />
      <span style={{ color: 'var(--text-muted)' }}>Loading Lawazia Toto…</span>
    </div>
  );
}
