'use client';
// components/TripCard.js — Restyled Trip Card with Collapsible Route Map

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatRequestedAt } from './dateUtils';
import { TRIP_STATUS_DETAILS, TRIP_STATUSES } from '@/lib/status';
import RouteMap from '@/components/RouteMap';
import { Clock, Users, ArrowRight, RotateCcw, Check, X, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

export default function TripCard({ trip }) {
  const { user } = useAuth();
  const [showRoute, setShowRoute] = useState(false);

  const statusInfo = TRIP_STATUS_DETAILS[trip.status] || TRIP_STATUS_DETAILS[TRIP_STATUSES.REQUESTED];
  const prefillNames = trip.passengers?.map(p => p.name).join(',') || '';
  const headcount = trip.headcount || trip.passengers?.length || 1;
  const isPickupOrDone = trip.status === 'Pickup' || trip.status === 'Done';
  const canShowRouteMap = ['Requested', 'Accepted', 'Pickup'].includes(trip.status);

  const currentUserName = user?.name?.trim().toLowerCase();

  return (
    <div className={`trip-card ${statusInfo.cardClass}`}>
      {/* Top Row: Route & Requester on Left, Status Pill on Right */}
      <div className="trip-card__header">
        <div>
          <div className="trip-card__route">
            <span>{trip.from}</span>
            <ArrowRight size={15} style={{ color: 'var(--text-muted)' }} />
            <span>{trip.to}</span>
          </div>
          <div className="trip-card__requester">
            Requested by <span className="trip-card__requester-name">{trip.requesterName}</span>
          </div>
        </div>

        <span className={`status-pill ${statusInfo.pillClass}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Meta Row: Clock & Headcount */}
      <div className="trip-card__meta">
        <div className="trip-card__meta-item">
          <Clock size={16} className="trip-card__meta-icon" />
          <span>{formatRequestedAt(trip.requestedAt)}</span>
        </div>
        <div className="trip-card__meta-item">
          <Users size={16} className="trip-card__meta-icon" />
          <span>{headcount} passenger{headcount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Passengers: Clean Chips with 'You' Tag and Boarded/Missed Status */}
      {trip.passengers && trip.passengers.length > 0 && (
        <div className="trip-card__passengers-row">
          {trip.passengers.map((p, idx) => {
            const isYou = currentUserName && p.name?.trim().toLowerCase() === currentUserName;
            const pStatus = p.status || 'Pending';

            return (
              <span
                key={idx}
                className={`passenger-chip ${isYou ? 'passenger-chip--you' : ''}`}
              >
                <span>{p.name}</span>
                {isYou && <span className="chip-you-tag">You</span>}

                {isPickupOrDone && (
                  <>
                    {pStatus === 'Boarded' && (
                      <span className="passenger-status-tag passenger-status-tag--boarded">
                        <Check size={11} strokeWidth={2.5} /> Boarded
                      </span>
                    )}
                    {pStatus === 'Missed' && (
                      <span className="passenger-status-tag passenger-status-tag--missed">
                        <X size={11} strokeWidth={2.5} /> Missed
                      </span>
                    )}
                    {pStatus === 'Pending' && (
                      <span className="passenger-status-tag passenger-status-tag--pending">
                        Pending
                      </span>
                    )}
                  </>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Collapsible Route Map (Requested, Accepted, Pickup only) */}
      {canShowRouteMap && (
        <div style={{ marginTop: '0.625rem' }}>
          <button
            type="button"
            className="trip-card__route-toggle-btn"
            onClick={() => setShowRoute(prev => !prev)}
            aria-expanded={showRoute}
            id={`btn-route-toggle-${trip._id}`}
          >
            <MapPin size={13} />
            <span>{showRoute ? 'Hide route' : 'Show route'}</span>
            {showRoute ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showRoute && (
            <div className="trip-card__route-map-container">
              <RouteMap from={trip.from} to={trip.to} compact={true} />
            </div>
          )}
        </div>
      )}

      {/* Footer Row: Single Status Explanation & Action Button */}
      <div className="trip-card__footer">
        <div className="trip-card__footer-msg">
          {statusInfo.message}
        </div>

        {trip.status === 'Clash' && (
          <div className="trip-card__footer-actions">
            <Link
              href={`/dashboard/request?from=${encodeURIComponent(trip.from)}&to=${encodeURIComponent(trip.to)}&passengers=${encodeURIComponent(prefillNames)}`}
              className="btn btn--primary"
              style={{ minHeight: '40px', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              <RotateCcw size={15} strokeWidth={2} /> Book again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
