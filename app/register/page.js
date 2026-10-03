'use client';
// app/register/page.js — Warm Obsidian Register View with Lucide Icons

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Car, User, Mail, Lock, GraduationCap, Briefcase, UserPlus, AlertCircle } from 'lucide-react';

const ROLES = [
  { value: 'student',  icon: GraduationCap, label: 'Student' },
  { value: 'employee', icon: Briefcase,     label: 'Employee' },
  { value: 'rider',    icon: Car,           label: 'Rider' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      showToast(`Account created! Welcome, ${user.name}!`, 'success');
      if (user.role === 'rider') router.push('/rider');
      else router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo">
          <Car size={26} />
        </div>
        <h1 className="auth-card__title">Create Account</h1>
        <p className="auth-card__subtitle">Join the Lawazia Toto shuttle platform</p>

        <form className="auth-form" onSubmit={handleSubmit} id="register-form">
          {error && (
            <div className="alert alert--error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-name"
                type="text"
                className="form-input"
                placeholder="Ahmed Al-Rashidi"
                value={form.name}
                onChange={set('name')}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <User size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                placeholder="you@lawazia.com"
                value={form.email}
                onChange={set('email')}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password"
                type="password"
                className="form-input"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={set('password')}
                required
                minLength={8}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role Type</label>
            <div className="role-selector">
              {ROLES.map(role => {
                const IconComponent = role.icon;
                return (
                  <div
                    key={role.value}
                    id={`role-${role.value}`}
                    className={`role-option ${form.role === role.value ? 'role-option--selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, role: role.value }))}
                  >
                    <IconComponent size={20} className="role-option__icon" />
                    <span>{role.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full btn--lg"
            disabled={loading}
            id="register-submit"
          >
            <UserPlus size={18} />
            <span>{loading ? 'Creating account…' : 'Create Account'}</span>
          </button>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent-soft)', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
