'use client';
// app/rider/page.js — Rider Control Desk

import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { formatTimeAgo } from '@/components/dateUtils';
import { TRIP_STATUS_DETAILS, TRIP_STATUSES } from '@/lib/status';
import { farePerPerson, fareTotal } from '@/lib/fare';
import RouteMap from '@/components/RouteMap';
import {
  Car,
  CheckCircle2,
  RefreshCw,
  Check,
  X,
  MapPin,
  Clock,
  User,
  Users,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

const getStatusDetails = (status) => {
  return TRIP_STATUS_DETAILS[status] || { label: status, pillClass: 'status-pill--requested' };
};

export default function RiderPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [requestedTrips, setRequestedTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [cardErrors, setCardErrors] = useState({});

  const [expandedTrips, setExpandedTrips] = useState({});
  const [routeMapTrips, setRouteMapTrips] = useState({});
  const [passengerStatusMap, setPassengerStatusMap] = useState({});

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const [reqRes, accRes, pickRes] = await Promise.all([
        fetch('/api/trips?status=Requested&sort=oldest&limit=50'),
        fetch('/api/trips?status=Accepted&limit=10'),
        fetch('/api/trips?status=Pickup&limit=10'),
      ]);

      const [reqData, accData, pickData] = await Promise.all([
        reqRes.json(),
        accRes.json(),
        pickRes.json(),
      ]);

      setRequestedTrips(reqData.trips || []);

      const active =
        pickData.trips?.[0] ||
        accData.trips?.[0] ||
        null;

      setActiveTrip(active);

      if (active) {
        const ps = {};
        active.passengers?.forEach(p => {
          ps[p.name] = p.status === 'Pending' ? '' : p.status;
        });
        setPassengerStatusMap(ps);
      } else {
        setPassengerStatusMap({});
      }
    } catch (err) {
      console.error('Error loading rider data:', err);
    } finally {
      setLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const doAction = async (tripId, url, body, successMsg, cb) => {
    setActionLoading(tripId);
    setCardErrors(prev => ({ ...prev, [tripId]: '' }));
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }
      showToast(successMsg || data.message, 'success');
      if (cb) cb(data);
      await loadData();
    } catch (err) {
      setCardErrors(prev => ({ ...prev, [tripId]: err.message }));
      showToast(err.message, 'error');
    } finally {
      setActionLoading('');
    }
  };

  const handleAccept = (tripId) => {
    doAction(
      tripId,
      `/api/trips/${tripId}/accept`,
      null,
      'Trip accepted. Head to the pickup point.'
    );
  };

  const handleReject = (tripId) => {
    doAction(
      tripId,
      `/api/trips/${tripId}/reject`,
      null,
      'Request declined.'
    );
  };

  const handleStartPickup = async (tripId) => {
    const passengers = Object.entries(passengerStatusMap)
      .filter(([, s]) => s)
      .map(([name, status]) => ({ name, status }));

    doAction(
      tripId,
      `/api/trips/${tripId}/pickup`,
      { passengers },
      'Pickup started. Mark passengers as they board.'
    );
  };

  const togglePassenger = async (tripId, passengerName, targetStatus) => {
    const currentStatus = passengerStatusMap[passengerName];
    const newStatus = currentStatus === targetStatus ? '' : targetStatus;
    const nextStatuses = { ...passengerStatusMap, [passengerName]: newStatus };
    setPassengerStatusMap(nextStatuses);

    const passengersPayload = Object.entries(nextStatuses)
      .filter(([, s]) => s)
      .map(([name, status]) => ({ name, status }));

    if (passengersPayload.length > 0) {
      try {
        await fetch(`/api/trips/${tripId}/pickup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passengers: passengersPayload }),
        });
      } catch (err) {
        console.error('Failed to sync passenger status:', err);
      }
    }
  };

  const handleDone = (tripId) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#d97706', '#f59e0b', '#10b981', '#3b82f6', '#c084fc'],
    });

    doAction(
      tripId,
      `/api/trips/${tripId}/done`,
      null,
      'Trip finished. Toto is free for the next ride.'
    );
  };

  const toggleExpand = (tripId) => {
    setExpandedTrips(prev => ({ ...prev, [tripId]: !prev[tripId] }));
  };

  const toggleRouteMap = (tripId) => {
    setRouteMapTrips(prev => ({ ...prev, [tripId]: !prev[tripId] }));
  };

  const isTotoFree = !activeTrip;

  const allPassengersMarked =
    activeTrip &&
    activeTrip.passengers?.length > 0 &&
    activeTrip.passengers.every(p => {
      const status = passengerStatusMap[p.name];
      return status === 'Boarded' || status === 'Missed';
    });

  const activePerPersonRate = activeTrip ? farePerPerson(activeTrip.from, activeTrip.to) : 0;
  const activeBoardedCount = activeTrip
    ? Object.values(passengerStatusMap).filter(s => s === 'Boarded').length
    : 0;
  const activeFareSoFar = activeTrip
    ? fareTotal(activeTrip.from, activeTrip.to, activeBoardedCount)
    : 0;

  return (
    <div className="auth-animate-in">
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1.875rem', fontWeight: 800 }}>
          Rider desk
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Live queue and active ride controls
        </p>
      </div>

      {/* Toto Status Card */}
      <div className="rider-status-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className={`rider-status-pill ${isTotoFree ? 'rider-status-pill--free' : 'rider-status-pill--busy'}`}>
            {isTotoFree ? (
              <>
                <CheckCircle2 size={16} strokeWidth={2.5} />
                <span>Toto is free</span>
              </>
            ) : (
              <>
                <Car size={16} strokeWidth={2.5} />
                <span>Toto is on a trip</span>
              </>
            )}
          </div>

          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
              {isTotoFree ? 'Ready for the next request' : `Trip in progress: ${activeTrip?.from} → ${activeTrip?.to} (${activeTrip?.headcount || activeTrip?.passengers?.length || 1} passenger${(activeTrip?.headcount || activeTrip?.passengers?.length || 1) !== 1 ? 's' : ''})`}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {requestedTrips.length} request{requestedTrips.length !== 1 ? 's' : ''} in queue · Auto-refreshing every 10s
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            title="Refresh queue"
            aria-label="Refresh queue"
            id="rider-refresh-queue-btn"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Active Trip Section */}
      {activeTrip && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Car size={18} style={{ color: 'var(--accent-soft)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Active trip
            </h2>
          </div>

          <div className="rider-active-card">
            {cardErrors[activeTrip._id] && (
              <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{cardErrors[activeTrip._id]}</span>
              </div>
            )}

            <div className="rider-active-grid">
              {/* Left Column: Trip Details & Boarding Actions */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                        <span>{activeTrip.from}</span>
                        <ArrowRight size={18} className="text-accent" />
                        <span>{activeTrip.to}</span>
                      </div>
                      <span className="badge badge--student" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        ₹{activePerPersonRate} / person
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Requested by <strong style={{ color: 'var(--text-primary)' }}>{activeTrip.requesterName}</strong>
                    </div>
                  </div>

                  <span className={`status-pill ${getStatusDetails(activeTrip.status).pillClass}`}>
                    {getStatusDetails(activeTrip.status).label}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', fontSize: '0.84375rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Clock size={15} style={{ color: 'var(--accent-soft)' }} />
                    <span>Requested {formatTimeAgo(activeTrip.requestedAt)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Users size={15} style={{ color: 'var(--accent-soft)' }} />
                    <span>{activeTrip.headcount || activeTrip.passengers?.length || 0} passenger{(activeTrip.headcount || activeTrip.passengers?.length || 0) !== 1 ? 's' : ''}</span>
                  </div>
                  {activeTrip.status === 'Pickup' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--accent-soft)', fontWeight: 600 }}>
                      <IndianRupee size={15} />
                      <span>Fare so far: ₹{activeFareSoFar} ({activeBoardedCount} boarded)</span>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '0.625rem' }}>
                    Who's riding
                  </div>

                  <div className="boarding-list">
                    {activeTrip.passengers?.map((p, idx) => {
                      const state = passengerStatusMap[p.name] || '';
                      return (
                        <div key={idx} className="boarding-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={16} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                              {p.name}
                            </span>
                            {state === 'Boarded' && (
                              <span className="badge badge--boarded" style={{ fontSize: '0.6875rem' }}>
                                <Check size={11} /> Boarded
                              </span>
                            )}
                            {state === 'Missed' && (
                              <span className="badge badge--missed" style={{ fontSize: '0.6875rem' }}>
                                <X size={11} /> Missed
                              </span>
                            )}
                          </div>

                          <div className="boarding-actions">
                            <button
                              type="button"
                              id={`btn-board-${idx}`}
                              className={`btn-boarding ${state === 'Boarded' ? 'btn-boarding--boarded' : ''}`}
                              onClick={() => togglePassenger(activeTrip._id, p.name, 'Boarded')}
                              aria-label={`Mark ${p.name} as boarded`}
                            >
                              <Check size={16} />
                              <span>Boarded</span>
                            </button>

                            <button
                              type="button"
                              id={`btn-miss-${idx}`}
                              className={`btn-boarding ${state === 'Missed' ? 'btn-boarding--missed' : ''}`}
                              onClick={() => togglePassenger(activeTrip._id, p.name, 'Missed')}
                              aria-label={`Mark ${p.name} as missed`}
                            >
                              <X size={16} />
                              <span>Missed</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeTrip.status === 'Accepted' ? (
                    <button
                      type="button"
                      id="active-start-pickup-btn"
                      className="btn btn--primary btn--lg"
                      onClick={() => handleStartPickup(activeTrip._id)}
                      disabled={actionLoading === activeTrip._id}
                      style={{ minHeight: '48px', width: '100%' }}
                    >
                      {actionLoading === activeTrip._id ? (
                        <>
                          <Loader2 size={18} className="spinner-sm" />
                          <span>Starting pickup…</span>
                        </>
                      ) : (
                        <>
                          <Car size={18} />
                          <span>Start pickup</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      {allPassengersMarked && (
                        <div style={{ padding: '0.625rem 0.875rem', background: 'var(--accent-glow)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <IndianRupee size={15} style={{ color: 'var(--accent-soft)', flexShrink: 0 }} />
                          <span>Collect ₹{activeFareSoFar} from boarded passengers</span>
                        </div>
                      )}

                      <button
                        type="button"
                        id="active-complete-trip-btn"
                        className="btn btn--success btn--lg"
                        onClick={() => handleDone(activeTrip._id)}
                        disabled={actionLoading === activeTrip._id || !allPassengersMarked}
                        style={{ minHeight: '48px', width: '100%' }}
                      >
                        {actionLoading === activeTrip._id ? (
                          <>
                            <Loader2 size={18} className="spinner-sm" />
                            <span>Finishing trip…</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={18} />
                            <span>Finish trip</span>
                          </>
                        )}
                      </button>

                      {!allPassengersMarked && (
                        <div className="rider-helper-text" style={{ justifyContent: 'center' }}>
                          <AlertTriangle size={14} style={{ color: 'var(--warning-soft)' }} />
                          <span>Mark everyone first</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: Route Map Card */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '0.625rem' }}>
                  Route preview
                </div>
                <RouteMap from={activeTrip.from} to={activeTrip.to} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requests Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Requests
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>
              Ride requests in queue, oldest first
            </p>
          </div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-soft)' }}>
            {requestedTrips.length} requested
          </span>
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : requestedTrips.length === 0 ? (
          <div className="empty-state" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '3rem 1.5rem' }}>
            <div className="accent-circle" style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--accent-soft)' }}>
              <CheckCircle2 size={28} strokeWidth={2} />
            </div>
            <div className="empty-state__title" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Nobody waiting. The Toto is all yours.
            </div>
            <div className="empty-state__sub" style={{ maxWidth: 360, margin: '0.25rem auto 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              New ride requests will show up here automatically.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {requestedTrips.map(trip => {
              const isExpanded = !!expandedTrips[trip._id];
              const isRouteOpen = !!routeMapTrips[trip._id];
              const statusInfo = getStatusDetails(trip.status);

              return (
                <div
                  key={trip._id}
                  className="rider-card"
                  id={`queue-trip-${trip._id}`}
                >
                  {cardErrors[trip._id] && (
                    <div className="alert alert--error" style={{ marginBottom: '0.75rem' }}>
                      <AlertCircle size={15} />
                      <span>{cardErrors[trip._id]}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        <MapPin size={16} style={{ color: 'var(--accent-soft)' }} />
                        <span>{trip.from}</span>
                        <ArrowRight size={15} style={{ color: 'var(--text-muted)' }} />
                        <span>{trip.to}</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Requested by <strong style={{ color: 'var(--text-primary)' }}>{trip.requesterName}</strong>
                      </div>
                    </div>

                    <span className={`status-pill ${statusInfo.pillClass}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Clock size={14} style={{ color: 'var(--accent-soft)' }} />
                      <span>{formatTimeAgo(trip.requestedAt)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Users size={14} style={{ color: 'var(--accent-soft)' }} />
                      <span>{trip.headcount || trip.passengers?.length || 1} passenger{(trip.headcount || trip.passengers?.length || 1) !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <IndianRupee size={14} style={{ color: 'var(--accent-soft)' }} />
                      <span>Estimated fare: ₹{fareTotal(trip.from, trip.to, trip.headcount || trip.passengers?.length || 1)}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => toggleExpand(trip._id)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      aria-expanded={isExpanded}
                    >
                      <span>Passengers ({trip.passengers?.length || 0})</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => toggleRouteMap(trip._id)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', gap: '4px' }}
                      aria-expanded={isRouteOpen}
                    >
                      <MapPin size={12} />
                      <span>{isRouteOpen ? 'Hide route' : 'Show route'}</span>
                      {isRouteOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '0.5rem', padding: '0.625rem 0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {trip.passengers?.map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            <span>{p.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {p.status || 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isRouteOpen && (
                    <div style={{ marginTop: '0.625rem' }}>
                      <RouteMap from={trip.from} to={trip.to} compact={true} />
                    </div>
                  )}

                  <div style={{ marginTop: '1rem' }}>
                    {isTotoFree ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button
                          type="button"
                          id={`btn-accept-${trip._id}`}
                          className="btn btn--primary"
                          onClick={() => handleAccept(trip._id)}
                          disabled={actionLoading === trip._id}
                          style={{ minHeight: '44px' }}
                        >
                          {actionLoading === trip._id ? (
                            <>
                              <Loader2 size={16} className="spinner-sm" />
                              <span>Accepting…</span>
                            </>
                          ) : (
                            <>
                              <Check size={16} />
                              <span>Accept</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          id={`btn-reject-${trip._id}`}
                          className="btn btn--secondary"
                          onClick={() => handleReject(trip._id)}
                          disabled={actionLoading === trip._id}
                          style={{ minHeight: '44px' }}
                        >
                          {actionLoading === trip._id ? (
                            <>
                              <Loader2 size={16} className="spinner-sm" />
                              <span>Declining…</span>
                            </>
                          ) : (
                            <>
                              <X size={16} />
                              <span>Reject</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn--ghost"
                            disabled
                            style={{ minHeight: '44px', opacity: 0.5 }}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost"
                            disabled
                            style={{ minHeight: '44px', opacity: 0.5 }}
                          >
                            Reject
                          </button>
                        </div>
                        <div className="rider-helper-text">
                          <AlertTriangle size={13} style={{ color: 'var(--warning-soft)' }} />
                          <span>Finish the current trip first</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
