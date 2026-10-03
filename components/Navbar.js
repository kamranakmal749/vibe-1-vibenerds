'use client';
// components/Navbar.js — Top Bar with Logo, Theme Toggle, User Dropdown & Mobile Bottom Nav

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { LayoutDashboard, PlusCircle, ClipboardList, Sun, Moon, LogOut, Car, ChevronDown, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    showToast('Logged out successfully', 'info');
    router.push('/login');
  };

  const isActive = (href) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const getNavLinks = () => {
    if (!user) return [];
    if (user.role === 'rider') {
      return [
        { href: '/rider', label: 'Queue', icon: Car },
        { href: '/rider/history', label: 'History', icon: ClipboardList },
      ];
    }
    return [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/request', label: 'Request ride', icon: PlusCircle },
      { href: '/dashboard/history', label: 'My trips', icon: ClipboardList },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      <nav className="navbar">
        <div className="navbar__inner" style={{ padding: '0 1.5rem' }}>
          <Link href={user?.role === 'rider' ? '/rider' : '/dashboard'} className="navbar__brand">
            <div className="navbar__logo">
              <Car size={18} strokeWidth={2} />
            </div>
            <span>Lawazia <span style={{ color: 'var(--accent-soft)' }}>Toto</span></span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {/* Theme Toggle Button */}
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
              id="theme-toggle-btn"
            >
              {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
            </button>

            {/* User Dropdown Menu at Top Right */}
            {user && (
              <div className="user-dropdown" ref={dropdownRef}>
                <button
                  type="button"
                  className="user-dropdown__trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  id="user-menu-btn"
                  aria-expanded={dropdownOpen}
                >
                  <div className="navbar__avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown__menu" id="user-dropdown-popover">
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                        {user.email}
                      </div>
                      <span className={`badge badge--${user.role}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border)' }} />

                    <button
                      className="btn btn--ghost btn--sm btn--full"
                      onClick={handleLogout}
                      id="user-dropdown-logout"
                      style={{ justifyContent: 'flex-start', color: 'var(--danger-soft)' }}
                    >
                      <LogOut size={16} strokeWidth={2} />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (<1024px) */}
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
                <IconComponent size={18} strokeWidth={2} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
