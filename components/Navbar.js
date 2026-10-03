'use client';
// components/Navbar.js — Lucide Icons + Theme Toggle + Mobile Bottom Bar

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { Home, PlusCircle, ClipboardList, MapPin, Sun, Moon, LogOut, Car, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully', 'info');
    router.push('/login');
  };

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  const getNavLinks = () => {
    if (!user) return [];
    if (user.role === 'rider') {
      return [
        { href: '/rider', label: 'Queue', icon: Car },
        { href: '/rider/history', label: 'History', icon: ClipboardList },
      ];
    }
    return [
      { href: '/dashboard', label: 'Overview', icon: Home },
      { href: '/dashboard/request', label: 'Request Ride', icon: PlusCircle },
      { href: '/dashboard/history', label: 'My Trips', icon: ClipboardList },
      { href: '/dashboard/track', label: 'Track Live', icon: MapPin },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <div className="navbar__inner">
            <Link href={user?.role === 'rider' ? '/rider' : '/dashboard'} className="navbar__brand">
              <div className="navbar__logo">
                <Car size={20} strokeWidth={2.5} />
              </div>
              <span>Lawazia <span style={{ color: 'var(--accent-soft)' }}>Toto</span></span>
            </Link>

            <div className="navbar__nav">
              {navLinks.map(link => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`navbar__link ${isActive(link.href) ? 'navbar__link--active' : ''}`}
                  >
                    <IconComponent size={16} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Theme Toggle Button */}
              <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                aria-label="Toggle theme"
                id="theme-toggle-btn"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {user && (
                <div className="navbar__user">
                  <div className="navbar__avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8125rem' }}>
                      {user.name}
                    </span>
                    <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {user.role}
                    </span>
                  </div>
                  <button className="btn btn--ghost btn--sm" onClick={handleLogout} id="logout-btn">
                    <LogOut size={14} />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      {user && (
        <nav className="mobile-nav" id="mobile-bottom-nav">
          {navLinks.map(link => {
            const IconComponent = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`mobile-nav__link ${isActive(link.href) ? 'mobile-nav__link--active' : ''}`}
              >
                <IconComponent size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
