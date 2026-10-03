// app/api/trips/[id]/accept/route.js
// Rider accepts a Requested trip → Accepted with holdKey: "TOTO", clashes competing Requested trips

import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import Trip from '@/lib/models/Trip';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(req, { params }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'rider') {
    return NextResponse.json({ error: 'Only riders can accept trips' }, { status: 403 });
  }

  await connectDB();

  // Check if Toto is already held
  const currentlyHeld = await Trip.findOne({ holdKey: 'TOTO' });
  if (currentlyHeld) {
    return NextResponse.json({
      error: 'The Toto is currently held by an active trip. Finish it first.',
    }, { status: 409 });
  }

  try {
    // Atomically claim the holdKey and transition to Accepted
    const trip = await Trip.findOneAndUpdate(
      { _id: params.id, status: 'Requested' },
      {
        $set: {
          status: 'Accepted',
          holdKey: 'TOTO',
          rider: user.id,
          acceptedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!trip) {
      return NextResponse.json({
        error: 'This request is no longer pending or is already processed.',
      }, { status: 409 });
    }

    // Atomically clash all other competing Requested trips
    await Trip.updateMany(
      { _id: { $ne: trip._id }, status: 'Requested' },
      { $set: { status: 'Clash' }, $unset: { holdKey: 1 } }
    );

    return NextResponse.json({
      trip,
      message: 'Trip accepted. Toto is now held.',
    });
  } catch (err) {
    // Handle duplicate key error on holdKey unique index
    if (err.code === 11000) {
      return NextResponse.json({
        error: 'The Toto was just claimed by another action.',
      }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
}
