'use client';
// app/dashboard/request/page.js — Book Now Request Form (No slots/schedule, instant submit, quiet summary)

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Plus, Trash2, ArrowRightLeft, AlertCircle, Loader2 } from 'lucide-react';

const ROUTES = ['College', 'Station', 'Office'];

function RequestFormContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Route state
  const [from, setFrom] = useState('College');
  const [to, setTo] = useState('Office');
  const [routeError, setRouteError] = useState('');

  // Passengers list (prefilled with logged in user or query params from Clash retry)
  const [passengers, setPassengers] = useState([{ name: user?.name || '' }]);
  const [passengerErrors, setPassengerErrors] = useState('');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Read URL prefill params (e.g. from Clash "Book again" CTA)
  useEffect(() => {
    const urlFrom = searchParams.get('from');
    const urlTo = searchParams.get('to');
    const urlPassengers = searchParams.get('passengers');

    if (urlFrom && ROUTES.includes(urlFrom)) setFrom(urlFrom);
    if (urlTo && ROUTES.includes(urlTo)) setTo(urlTo);

    if (urlPassengers) {
      const names = urlPassengers.split(',').map(n => n.trim()).filter(Boolean);
      if (names.length > 0) {
        setPassengers(names.map(name => ({ name })));
      }
    }
  }, [searchParams]);

  // Keep Passenger 1 updated if user object loads asynchronously
  useEffect(() => {
    if (user?.name && passengers[0]?.name === '' && !searchParams.get('passengers')) {
      setPassengers(prev => [{ name: user.name }, ...prev.slice(1)]);
    }
  }, [user?.name, passengers, searchParams]);

  const handleFromChange = (newFrom) => {
    setFrom(newFrom);
    if (newFrom === to) {
      const nextTo = ROUTES.find(r => r !== newFrom) || 'Office';
      setTo(nextTo);
    }
    setRouteError('');
  };

  const handleToChange = (newTo) => {
    if (newTo === from) {
      setRouteError('From and To destinations must be different.');
      return;
    }
    setTo(newTo);
    setRouteError('');
  };

  const swapRoute = () => {
    setFrom(to);
    setTo(from);
    setRouteError('');
  };

  const addPassenger = () => {
    if (passengers.length >= 20) return;
    setPassengers(prev => [...prev, { name: '' }]);
  };

  const removePassenger = (index) => {
    if (index === 0) return;
    setPassengers(prev => prev.filter((_, idx) => idx !== index));
  };

  const setPassengerName = (index, name) => {
    setPassengers(prev => prev.map((p, idx) => (idx === index ? { ...p, name } : p)));
    setPassengerErrors('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setPassengerErrors('');
    setRouteError('');

    if (from === to) {
      setRouteError('From and To destinations must be different.');
      return;
    }

    const cleanNames = passengers.map(p => p.name.trim());
    if (cleanNames.some(n => !n)) {
      setPassengerErrors('Fill in names for everyone in your group.');
      return;
    }

    // Check duplicate names
    const uniqueNames = new Set(cleanNames.map(n => n.toLowerCase()));
    if (uniqueNames.size !== cleanNames.length) {
      setPassengerErrors('Each passenger name in the group must be unique.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          passengers: cleanNames.map(name => ({ name })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not send your request. Try again in a moment.');
      }

      if (data.clashed) {
        showToast('The Toto is busy with another ride right now. Try again in a few minutes.', 'error');
      } else {
        showToast('Request sent. Waiting for the rider.', 'success');
      }
      router.push('/dashboard/history');
    } catch (err) {
      setFormError(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Page Title & Subtitle */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1.875rem', fontWeight: 800 }}>
          Where to?
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Pick a route and who's riding. The rider accepts or declines.
        </p>
      </div>

      <form onSubmit={handleSubmit} id="request-ride-form">
        <div className="request-layout">
          {/* Left Column: Route & Passengers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 1. Route Card */}
            <div className="card">
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 700 }}>
                Route
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.625rem', alignItems: 'end' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="select-from">From</label>
                  <select
                    id="select-from"
                    className="form-select"
                    value={from}
                    onChange={e => handleFromChange(e.target.value)}
                  >
                    {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div style={{ paddingBottom: '0.25rem' }}>
                  <button
                    type="button"
                    className="btn btn--ghost btn--icon"
                    onClick={swapRoute}
                    title="Swap route"
                    id="swap-route-btn"
                  >
                    <ArrowRightLeft size={16} strokeWidth={2} />
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="select-to">To</label>
                  <select
                    id="select-to"
                    className="form-select"
                    value={to}
                    onChange={e => handleToChange(e.target.value)}
                  >
                    {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {routeError && (
                <div className="form-error" style={{ marginTop: '0.625rem' }}>
                  <AlertCircle size={14} /> {routeError}
                </div>
              )}
            </div>

            {/* 2. Who's riding? Card */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: 700 }}>
                  Who's riding?
                </h3>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={addPassenger}
                  disabled={passengers.length >= 20}
                  id="add-passenger-btn"
                >
                  <Plus size={14} strokeWidth={2} /> Add someone
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {passengers.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <input
                      id={`passenger-input-${i}`}
                      type="text"
                      className="form-input"
                      placeholder={i === 0 ? 'Your name' : 'Their full name'}
                      value={p.name}
                      onChange={e => setPassengerName(i, e.target.value)}
                      style={{ flex: 1 }}
                    />
                    {i === 0 ? (
                      <span className="badge badge--student" style={{ fontSize: '0.6875rem', whiteSpace: 'nowrap' }}>
                        You
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm btn--icon"
                        onClick={() => removePassenger(i)}
                        title="Remove passenger"
                        style={{ color: 'var(--danger-soft)' }}
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {passengerErrors && (
                <div className="form-error" style={{ marginTop: '0.75rem' }}>
                  <AlertCircle size={14} /> {passengerErrors}
                </div>
              )}
            </div>

            {formError && (
              <div className="alert alert--error">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Submit Button & Helper */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <button
                type="submit"
                className="btn btn--primary btn--full btn--lg"
                disabled={loading}
                id="submit-ride-request-btn"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner-sm" /> Sending request…
                  </>
                ) : (
                  <span>Book now</span>
                )}
              </button>

              <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                The rider accepts or declines. You'll see the result in My trips.
              </div>
            </div>
          </div>

          {/* Right Column: Quiet Summary Card */}
          <div className="card sticky-summary" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', fontSize: '1rem', fontWeight: 700 }}>
              Your trip
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Route
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {from} → {to}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Riding ({passengers.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.25rem' }}>
                  {passengers.map((p, idx) => (
                    <span key={idx} className="passenger-chip">
                      {p.name.trim() || (idx === 0 ? 'You' : `Passenger ${idx + 1}`)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
      <RequestFormContent />
    </Suspense>
  );
}
