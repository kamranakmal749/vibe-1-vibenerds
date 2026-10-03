// lib/models/Trip.js — Toto Trip Model (Book Now, HoldKey Guarantee, Zero Slots)

import mongoose from 'mongoose';
import { ALL_TRIP_STATUSES, ALL_PASSENGER_STATUSES, TRIP_STATUSES, PASSENGER_STATUSES } from '@/lib/status';

const PassengerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ALL_PASSENGER_STATUSES,
    default: PASSENGER_STATUSES.PENDING,
  },
}, { _id: false });

const TripSchema = new mongoose.Schema({
  // Who filed this request
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requesterName: { type: String, required: true },

  // Route
  from: {
    type: String,
    enum: ['College', 'Station', 'Office'],
    required: true,
  },
  to: {
    type: String,
    enum: ['College', 'Station', 'Office'],
    required: true,
  },

  // When request was filed (Book now timestamp)
  requestedAt: {
    type: Date,
    default: Date.now,
  },

  // Passenger list & headcount
  passengers: {
    type: [PassengerSchema],
    required: true,
  },
  headcount: {
    type: Number,
    default: 1,
  },

  // Exact statuses: Requested, Accepted, Pickup, Done, Clash
  status: {
    type: String,
    enum: ALL_TRIP_STATUSES,
    default: TRIP_STATUSES.REQUESTED,
  },

  // Assigned rider
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Guarantee single active trip: "TOTO" when Accepted or Pickup, unset on Done or Clash
  holdKey: {
    type: String,
    default: undefined,
  },

  // Lifecycle Timestamps
  acceptedAt: { type: Date, default: null },
  pickupStartedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  // Final recorded fare on Done
  fareTotal: { type: Number, default: undefined },

  note: { type: String, default: '' },
}, { timestamps: true });

// Unique Partial Index: Guarantees at most ONE trip can hold "TOTO" simultaneously
TripSchema.index(
  { holdKey: 1 },
  { unique: true, partialFilterExpression: { holdKey: { $type: 'string' } } }
);

TripSchema.index({ requestedAt: -1, status: 1 });
TripSchema.index({ requester: 1, requestedAt: -1 });
TripSchema.index({ 'passengers.name': 1, requestedAt: -1 });

export default mongoose.models.Trip || mongoose.model('Trip', TripSchema);
