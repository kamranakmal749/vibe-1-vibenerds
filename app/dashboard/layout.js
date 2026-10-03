'use client';
// app/dashboard/layout.js — Student Dashboard Layout with Desktop Sidebar & Top Navbar

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, PlusCircle, ClipboardList } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role === 'rider') { router.replace('/rider'); return; }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <aside className="dashboard__sidebar">
          <div className="sidebar__section">
            <div className="sidebar__label">Navigation</div>
            <Link
              href="/dashboard"
              className={`sidebar__link ${isActive('/dashboard') ? 'sidebar__link--active' : ''}`}
            >
              <LayoutDashboard size={18} strokeWidth={2} />
              <span>Overview</span>
            </Link>
            <Link
              href="/dashboard/request"
              className={`sidebar__link ${isActive('/dashboard/request') ? 'sidebar__link--active' : ''}`}
            >
              <PlusCircle size={18} strokeWidth={2} />
              <span>Request ride</span>
            </Link>
            <Link
              href="/dashboard/history"
              className={`sidebar__link ${isActive('/dashboard/history') ? 'sidebar__link--active' : ''}`}
            >
              <ClipboardList size={18} strokeWidth={2} />
              <span>My trips</span>
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
