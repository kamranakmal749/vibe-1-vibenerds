'use client';
// app/rider/page.js — Rider Desk: Queue + Active Trip Management + Celebration Confetti

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import confetti from 'canvas-confetti';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import TripCard from '@/components/TripCard';
import { format } from '@/components/dateUtils';
import { Car, CheckCircle, RefreshCw, Check, X, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

const TotoMap = dynamic(() => import('@/components/TotoMap'), { ssr: false });

export default function RiderPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [pendingTrips, setPendingTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  // Pickup state: {[name]: 'boarded'|'missed'}
  const [pickupStatus, setPickupStatus] = useState({});

  // Rider location
  const [myLocation, setMyLocation] = useState(null);
  const locationInterval = useRef(null);

  const loadData = useCallback(async () => {
    const [pendRes, activeRes1, activeRes2] = await Promise.all([
      fetch('/api/trips?status=pending&limit=20'),
      fetch('/api/trips?status=confirmed&limit=5'),
      fetch('/api/trips?status=in_progress&limit=1'),
    ]);
    const [pend, conf, inProg] = await Promise.all([
      pendRes.json(), activeRes1.json(), activeRes2.json(),
    ]);

    setPendingTrips(pend.trips || []);

    // Active trip is in_progress > confirmed
    const active = inProg.trips?.[0] || conf.trips?.find(t => t.rider?._id === user?.id || t.rider === user?.id) || null;
    setActiveTrip(active);

    if (active) {
      // Pre-fill pickup status from existing data
      const ps = {};
      active.passengers.forEach(p => { ps[p.name] = p.status === 'pending' ? '' : p.status; });
      setPickupStatus(ps);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // GPS sharing
  useEffect(() => {
    if (!navigator?.geolocation) return;
    const shareLocation = () => {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setMyLocation({ lat, lng });
        fetch('/api/rider/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng }),
        }).catch(() => {});
      });
    };
    shareLocation();
    locationInterval.current = setInterval(shareLocation, 8000);
    return () => clearInterval(locationInterval.current);
  }, []);

  const doAction = async (url, successMsg, cb) => {
    setActionLoading(url);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(successMsg || data.message, 'success');
      if (cb) cb(data);
      await loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading('');
    }
  };

  const handleAccept = (tripId) => doAction(
    `/api/trips/${tripId}/accept`,
    'Trip accepted! Toto is held.',
  );

  const handlePickupSave = async (tripId) => {
    const passengers = Object.entries(pickupStatus)
      .filter(([, s]) => s)
      .map(([name, status]) => ({ name, status }));

    if (passengers.length === 0) {
      showToast('Please mark at least one passenger as boarded or missed.', 'error');
      return;
    }

    setActionLoading('pickup');
    try {
      const res = await fetch(`/api/trips/${tripId}/pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passengers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Pickup updated!', 'success');
      await loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading('');
    }
  };

  const handleDone = (tripId) => {
    // Fire festive confetti animation
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#d97706', '#f59e0b', '#10b981', '#3b82f6', '#c084fc']
    });

    doAction(
      `/api/trips/${tripId}/done`,
      'Trip completed! Toto is now free.',
    );
  };

  const setPassengerStatus = (name, status) =>
    setPickupStatus(ps => ({ ...ps, [name]: ps[name] === status ? '' : status }));

  const totoFree = !activeTrip;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Rider Control Desk</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage real-time queue and active ride operations</p>
      </div>

      {/* Toto status card */}
      <div className={`toto-status ${totoFree ? 'toto-status--free' : 'toto-status--busy'}`}>
        <div className="toto-status__indicator">
          <Car size={22} />
        </div>
        <div>
          <div className="toto-status__title">
            Toto is {totoFree ? 'Available & Free' : 'Currently On a Trip'}
          </div>
          <div className="toto-status__sub">
            {totoFree
              ? 'Ready to accept a pending ride request'
              : `Active: ${activeTrip?.from} → ${activeTrip?.to} · ${activeTrip?.passengers?.length} passenger(s)`}
          </div>
        </div>
        {myLocation && (
          <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--success-soft)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span className="pulse-dot" /> Live GPS Active
          </div>
        )}
      </div>

      {/* ─── Active Trip Panel ─── */}
      {activeTrip && (
        <div className="card card--glow" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Car size={20} style={{ color: 'var(--accent-soft)' }} />
              Active Ride: {activeTrip.from} → {activeTrip.to}
            </h3>
            <span className={`badge badge--${activeTrip.status}`}>{activeTrip.status.replace('_', ' ')}</span>
          </div>

          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Scheduled for <strong style={{ color: 'var(--text-primary)' }}>{format(activeTrip.scheduledAt)}</strong>
            {' '}· Requested by <strong style={{ color: 'var(--text-primary)' }}>{activeTrip.requesterName}</strong>
          </div>

          {/* Map */}
          <TotoMap
            from={activeTrip.from}
            to={activeTrip.to}
            riderLocation={myLocation}
            height={280}
          />

          {/* Pickup panel */}
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem', fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>
              Passenger Boarding Status
            </div>
            <div className="pickup-grid">
              {activeTrip.passengers.map((p, i) => (
                <div key={i} className="pickup-row">
                  <div className="pickup-row__name">
                    {p.name}
                    {p.status !== 'pending' && (
                      <span className={`badge badge--${p.status}`} style={{ marginLeft: '0.75rem' }}>{p.status}</span>
                    )}
                  </div>
                  <div className="pickup-row__actions">
                    <button
                      id={`board-${i}`}
                      className={`btn btn--sm ${pickupStatus[p.name] === 'boarded' ? 'btn--success' : 'btn--ghost'}`}
                      onClick={() => setPassengerStatus(p.name, 'boarded')}
                    >
                      <Check size={14} /> Boarded
                    </button>
                    <button
                      id={`miss-${i}`}
                      className={`btn btn--sm ${pickupStatus[p.name] === 'missed' ? 'btn--danger' : 'btn--ghost'}`}
                      onClick={() => setPassengerStatus(p.name, 'missed')}
                    >
                      <X size={14} /> Missed
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <button
                id="save-pickup-btn"
                className="btn btn--primary"
                onClick={() => handlePickupSave(activeTrip._id)}
                disabled={actionLoading === 'pickup'}
              >
                {actionLoading === 'pickup' ? 'Saving…' : 'Save Boarding Status'}
              </button>
              <button
                id="mark-done-btn"
                className="btn btn--success"
                onClick={() => handleDone(activeTrip._id)}
                disabled={!!actionLoading}
              >
                <Sparkles size={16} /> Complete & Free Toto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Pending Queue ─── */}
      <div className="section-header">
        <div>
          <div className="section-header__title">Pending Ride Requests</div>
          <div className="section-header__sub">
            {pendingTrips.length} request{pendingTrips.length !== 1 ? 's' : ''} in queue
          </div>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={loadData} id="refresh-queue-btn">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : pendingTrips.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={40} className="empty-state__icon" />
          <div className="empty-state__title">Queue is clear</div>
          <div className="empty-state__sub">No pending requests right now. Check back soon.</div>
        </div>
      ) : (
        <div className="trips-list">
          {pendingTrips.map(trip => (
            <TripCard
              key={trip._id}
              trip={trip}
              actions={
                totoFree ? (
                  <button
                    id={`accept-${trip._id}`}
                    className="btn btn--success"
                    onClick={() => handleAccept(trip._id)}
                    disabled={actionLoading === `/api/trips/${trip._id}/accept`}
                  >
                    {actionLoading === `/api/trips/${trip._id}/accept` ? 'Accepting…' : 'Accept Request'}
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Toto busy — finish active trip first
                  </span>
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
