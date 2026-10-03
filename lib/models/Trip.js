// lib/models/Trip.js

import mongoose from 'mongoose';

const PassengerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['pending', 'boarded', 'missed'],
    default: 'pending',
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
    enum: ['College', 'Station', 'Office', 'College Station'],
    required: true,
  },
  to: {
    type: String,
    enum: ['College', 'Station', 'Office', 'College Station'],
    required: true,
  },

  // When the pickup is scheduled
  scheduledAt: { type: Date, required: true },

  // Passenger list (filed by requester)
  passengers: { type: [PassengerSchema], required: true },

  // Fare
  farePerPerson: { type: Number, default: 0 },
  totalFare: { type: Number, default: 0 },

  // Status lifecycle
  // pending → confirmed | clashed → in_progress → completed | cancelled
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'clashed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },

  // Which rider accepted
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Timestamps for each stage
  acceptedAt: { type: Date, default: null },
  pickupStartedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },

  // Notes
  note: { type: String, default: '' },
}, { timestamps: true });

// Index for clash detection
TripSchema.index({ scheduledAt: 1, status: 1 });

export default mongoose.models.Trip || mongoose.model('Trip', TripSchema);
