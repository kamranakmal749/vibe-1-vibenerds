'use client';
// app/rider/layout.js — Rider Layout with Desktop Sidebar, Mobile Bottom Nav, and Clean Lucide Icons

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { Car, ClipboardList } from 'lucide-react';

export default function RiderLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  const isActive = (href) => {
    if (href === '/rider') return pathname === '/rider';
    return pathname.startsWith(href);
  };

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <aside className="dashboard__sidebar">
          <div className="sidebar__section">
            <div className="sidebar__label">Rider Control</div>
            <Link
              href="/rider"
              className={`sidebar__link ${isActive('/rider') ? 'sidebar__link--active' : ''}`}
              id="rider-nav-queue"
            >
              <Car size={18} strokeWidth={2} />
              <span>Trip Queue</span>
            </Link>
            <Link
              href="/rider/history"
              className={`sidebar__link ${isActive('/rider/history') ? 'sidebar__link--active' : ''}`}
              id="rider-nav-history"
            >
              <ClipboardList size={18} strokeWidth={2} />
              <span>History</span>
            </Link>
          </div>
        </aside>

        <main className="dashboard__main">
          {children}
        </main>
      </div>
    </>
  );
}
