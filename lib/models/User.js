// lib/models/User.js

import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // bcrypt hash
  role: {
    type: String,
    enum: ['student', 'employee', 'rider'],
    required: true,
  },
  // For rider: current location
  currentLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    updatedAt: { type: Date, default: null },
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
