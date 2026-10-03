'use client';
// app/signup/page.js — Redesigned Signup View with Friendly Senior Voice & Sentence Case

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import AuthBrandPanel from '@/components/AuthBrandPanel';
import { User, Mail, Lock, GraduationCap, Briefcase, UserPlus, Eye, EyeOff, AlertCircle, Sparkles, Sun, Moon, X, Check, Loader2 } from 'lucide-react';

const ROLES = [
  { value: 'student',  icon: GraduationCap, label: 'Student',  desc: 'Campus & hostel rides' },
  { value: 'employee', icon: Briefcase,     label: 'Employee', desc: 'Staff & office shuttle' },
];

export default function SignupPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateField = (field, value) => {
    let error = '';
    if (field === 'name') {
      if (!value.trim()) {
        error = 'Enter your name.';
      } else if (value.trim().length < 2) {
        error = 'Name should be at least 2 characters.';
      }
    } else if (field === 'email') {
      if (!value.trim()) {
        error = 'Enter your email address.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        error = 'Check your email format (e.g. you@example.com).';
      }
    } else if (field === 'password') {
      if (!value) {
        error = 'Create a password.';
      } else if (value.length < 8) {
        error = 'Password must be at least 8 characters.';
      }
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, form[field]);
  };

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, [field]: val }));
    if (touched[field]) {
      validateField(field, val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const nameValid = validateField('name', form.name);
    const emailValid = validateField('email', form.email);
    const passValid = validateField('password', form.password);
    setTouched({ name: true, email: true, password: true });

    if (!nameValid || !emailValid || !passValid) return;

    setLoading(true);
    try {
      const user = await register(form.name.trim(), form.email.trim(), form.password, form.role);
      showToast(`Welcome aboard, ${user.name.split(' ')[0]}!`, 'success');

      if (user.role === 'rider') {
        router.push('/rider');
      } else {
        router.push('/dashboard/request');
      }
    } catch (err) {
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('already') || msg.includes('exists') || msg.includes('duplicate')) {
        setServerError('That email is already registered. Want to sign in?');
      } else {
        setServerError(err.message || 'Could not create your account. Try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Brand & Story Panel */}
      <AuthBrandPanel />

      {/* Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-top-theme">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
            id="auth-theme-toggle"
          >
            {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
          </button>
        </div>

        <div className="auth-form-container auth-animate-in">
          <div className="auth-friendly-banner" aria-hidden="true">
            <Sparkles size={14} />
            <span>Book your ride in under a minute.</span>
          </div>

          <div className="auth-card-clean">
            <div className="auth-card__header">
              <h2 className="auth-card__title">Create account</h2>
              <p className="auth-card__subtitle">Join your campus and office shuttle.</p>
            </div>

            <form onSubmit={handleSubmit} id="signup-form" noValidate>
              {serverError && (
                <div className="alert alert--error alert--dismissible" role="alert">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.84375rem' }}>{serverError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setServerError('')}
                    className="alert__close"
                    aria-label="Dismiss message"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* 1. Full name */}
              <div className="auth-input-group">
                <label htmlFor="signup-name">Full name</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <User size={16} />
                  </div>
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    className={`auth-input ${touched.name && errors.name ? 'auth-input--error' : ''}`}
                    value={form.name}
                    onChange={handleChange('name')}
                    onBlur={() => handleBlur('name')}
                    disabled={loading}
                    aria-invalid={touched.name && !!errors.name}
                    aria-describedby={touched.name && errors.name ? 'name-error' : undefined}
                  />
                </div>
                {touched.name && errors.name && (
                  <div className="form-field-error" id="name-error" role="alert">
                    <AlertCircle size={13} />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>

              {/* 2. Email address */}
              <div className="auth-input-group">
                <label htmlFor="signup-email">Email address</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <Mail size={16} />
                  </div>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={`auth-input ${touched.email && errors.email ? 'auth-input--error' : ''}`}
                    value={form.email}
                    onChange={handleChange('email')}
                    onBlur={() => handleBlur('email')}
                    disabled={loading}
                    aria-invalid={touched.email && !!errors.email}
                    aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                  />
                </div>
                {touched.email && errors.email && (
                  <div className="form-field-error" id="email-error" role="alert">
                    <AlertCircle size={13} />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* 3. Password */}
              <div className="auth-input-group">
                <label htmlFor="signup-password">
                  <span>Password</span>
                  <span className="form-hint">At least 8 characters</span>
                </label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <Lock size={16} />
                  </div>
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={`auth-input ${touched.password && errors.password ? 'auth-input--error' : ''}`}
                    value={form.password}
                    onChange={handleChange('password')}
                    onBlur={() => handleBlur('password')}
                    disabled={loading}
                    aria-invalid={touched.password && !!errors.password}
                    aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <div className="form-field-error" id="password-error" role="alert">
                    <AlertCircle size={13} />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* 4. Role Selector */}
              <div className="auth-input-group" style={{ marginBottom: '1.5rem' }}>
                <label>Role</label>
                <div className="auth-role-grid" role="radiogroup" aria-label="Role selection">
                  {ROLES.map(role => {
                    const IconComponent = role.icon;
                    const isSelected = form.role === role.value;
                    return (
                      <div
                        key={role.value}
                        id={`role-option-${role.value}`}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        className={`auth-role-card ${isSelected ? 'auth-role-card--selected' : ''}`}
                        onClick={() => setForm(f => ({ ...f, role: role.value }))}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            setForm(f => ({ ...f, role: role.value }));
                          }
                        }}
                      >
                        {isSelected && <Check size={14} className="auth-role-card__check" strokeWidth={2.5} />}
                        <IconComponent size={22} className="auth-role-card__icon" strokeWidth={2} />
                        <span className="auth-role-card__label">{role.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn--primary btn--full btn--lg"
                disabled={loading}
                id="signup-submit"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner-sm" />
                    <span>Creating account…</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>Create account</span>
                  </>
                )}
              </button>

              <p className="auth-footer-prompt">
                Already have an account?
                <Link href="/login" className="auth-footer-link">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
