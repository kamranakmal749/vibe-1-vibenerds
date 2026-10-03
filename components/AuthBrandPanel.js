'use client';
// components/AuthBrandPanel.js — Brand & Story Panel with Route Visual and 3 Steps

import { Car, Users, CalendarClock, CheckCircle2 } from 'lucide-react';

export default function AuthBrandPanel() {
  return (
    <div className="auth-brand-panel auth-animate-in">
      {/* Brand Logo & Name */}
      <div className="auth-brand-top">
        <div className="auth-brand-badge" aria-hidden="true">
          <Car size={22} strokeWidth={2.2} />
        </div>
        <span className="auth-brand-title">
          Lawazia <span style={{ color: 'var(--accent-soft)' }}>Toto</span>
        </span>
      </div>

      {/* Hero Headline & Subheadline */}
      <div className="auth-brand-hero">
        <h1 className="auth-brand-headline">
          Your ride between College, Station and Office.
        </h1>
        <p className="auth-brand-subheadline">
          One shared Toto for students and employees. Request a seat, or book for your whole group, in under a minute.
        </p>

        {/* Route Visual: College - Station - Office */}
        <div className="route-visual" aria-label="Route stops: College, Station, Office">
          <div className="route-visual__track">
            <div className="route-visual__line" />
            <div className="route-visual__car" title="Lawazia Toto shuttle">
              <Car size={15} strokeWidth={2.4} />
            </div>
          </div>
          <div className="route-visual__stops">
            <div className="route-visual__stop">
              <div className="route-visual__dot" />
              <span className="route-visual__name">College</span>
            </div>
            <div className="route-visual__stop">
              <div className="route-visual__dot" />
              <span className="route-visual__name">Station</span>
            </div>
            <div className="route-visual__stop">
              <div className="route-visual__dot" />
              <span className="route-visual__name">Office</span>
            </div>
          </div>
        </div>

        {/* How It Works (3 Steps) */}
        <div className="auth-steps-list">
          <div className="auth-step-item">
            <div className="auth-step-icon">
              <Car size={16} strokeWidth={2} />
            </div>
            <div className="auth-step-text">
              <span className="auth-step-num">1.</span> Pick your route.
            </div>
          </div>

          <div className="auth-step-item">
            <div className="auth-step-icon">
              <Users size={16} strokeWidth={2} />
            </div>
            <div className="auth-step-text">
              <span className="auth-step-num">2.</span> Add everyone riding with you.
            </div>
          </div>

          <div className="auth-step-item">
            <div className="auth-step-icon">
              <CheckCircle2 size={16} strokeWidth={2} />
            </div>
            <div className="auth-step-text">
              <span className="auth-step-num">3.</span> The rider confirms, and you board.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Reassurance */}
      <div className="auth-brand-footer">
        Group bookings, instant requests, and a full trip history in one place.
      </div>
    </div>
  );
}
