'use client';
// app/rider/layout.js — Rider-only layout with auth guard

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

export default function RiderLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'rider') { router.replace('/dashboard'); return; }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <aside className="dashboard__sidebar">
          <div className="sidebar__section">
            <div className="sidebar__label">Rider Panel</div>
            <a href="/rider" className="sidebar__link">
              <span className="sidebar__link__icon">🚐</span> Trip Queue
            </a>
            <a href="/rider/history" className="sidebar__link">
              <span className="sidebar__link__icon">📋</span> All Trips
            </a>
          </div>
          <div className="sidebar__section" style={{ marginTop: 'auto', padding: '1rem' }}>
            <div style={{ padding: '0.875rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Signed in as</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{user.name}</div>
              <span className="badge badge--rider" style={{ marginTop: '0.375rem' }}>Rider 🛺</span>
            </div>
          </div>
        </aside>
        <main className="dashboard__main">
          {children}
        </main>
      </div>
    </>
  );
}
