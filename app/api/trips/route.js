// app/api/trips/route.js — List trips with person-matching & Book Now trip creation

import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import Trip from '@/lib/models/Trip';
import { isValidTripStatus, TRIP_STATUSES, PASSENGER_STATUSES } from '@/lib/status';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  let query = {};

  if (user.role === 'rider') {
    // Rider sees all trips; optional search filter by passenger name
    const search = searchParams.get('search') || searchParams.get('passenger');
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { requesterName: searchRegex },
          { 'passengers.name': searchRegex },
        ],
      };
    }
  } else {
    // Student / Employee sees every trip that names them (filer or passenger)
    const escapedName = user.name ? user.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
    query = {
      $or: [
        { requester: user.id },
        { 'passengers.name': { $regex: new RegExp(`^${escapedName}$`, 'i') } },
      ],
    };
  }

  // Optional status filter (Requested, Accepted, Pickup, Done, Clash)
  const status = searchParams.get('status');
  if (status && status !== 'all') {
    if (!isValidTripStatus(status)) {
      return NextResponse.json(
        { error: `Invalid status filter: '${status}'. Allowed values are: Requested, Accepted, Pickup, Done, Clash.` },
        { status: 400 }
      );
    }
    query.status = status;
  }

  // Optional sort order: oldest first or newest first
  const sortParam = searchParams.get('sort');
  const sortOrder = (sortParam === 'asc' || sortParam === 'oldest') ? { requestedAt: 1 } : { requestedAt: -1 };

  const [trips, total] = await Promise.all([
    Trip.find(query)
      .populate('requester', 'name email role')
      .populate('rider', 'name')
      .sort(sortOrder)
      .skip(skip)
      .limit(limit),
    Trip.countDocuments(query),
  ]);

  return NextResponse.json({ trips, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role === 'rider') {
    return NextResponse.json({ error: 'Riders cannot create ride requests' }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const { from, to, passengers } = body;

  // Validate route
  if (!from || !to || from === to) {
    return NextResponse.json({ error: 'From and To destinations must be different' }, { status: 400 });
  }
  const validRoutes = ['College', 'Station', 'Office'];
  if (!validRoutes.includes(from) || !validRoutes.includes(to)) {
    return NextResponse.json({ error: 'Invalid route' }, { status: 400 });
  }

  // Validate passengers (array of {name}, unique, non-empty)
  if (!Array.isArray(passengers) || passengers.length === 0 || passengers.length > 20) {
    return NextResponse.json({ error: 'Please provide between 1 and 20 passengers' }, { status: 400 });
  }

  const cleanNames = [];
  for (const p of passengers) {
    const trimmed = typeof p === 'string' ? p.trim() : (p?.name?.trim() || '');
    if (!trimmed) {
      return NextResponse.json({ error: 'Each passenger must have a name' }, { status: 400 });
    }
    cleanNames.push(trimmed);
  }

  // Check unique passenger names in group
  const uniqueNames = new Set(cleanNames.map(n => n.toLowerCase()));
  if (uniqueNames.size !== cleanNames.length) {
    return NextResponse.json({ error: 'Each passenger name in the group must be unique' }, { status: 400 });
  }

  const passengerDocs = cleanNames.map(name => ({
    name,
    status: 'Pending',
  }));

  // Check if Toto is currently held by an Accepted or Pickup trip
  const heldTrip = await Trip.findOne({ holdKey: 'TOTO' });

  if (heldTrip) {
    // Toto is currently busy: create trip directly as Clash
    const trip = await Trip.create({
      requester: user.id,
      requesterName: user.name,
      from,
      to,
      requestedAt: new Date(),
      passengers: passengerDocs,
      headcount: cleanNames.length,
      status: 'Clash',
    });

    return NextResponse.json({
      trip,
      clashed: true,
      message: 'The Toto is busy with another ride right now. Try again in a few minutes.',
    }, { status: 201 });
  }

  // Toto is free: create trip as Requested
  const trip = await Trip.create({
    requester: user.id,
    requesterName: user.name,
    from,
    to,
    requestedAt: new Date(),
    passengers: passengerDocs,
    headcount: cleanNames.length,
    status: 'Requested',
  });

  return NextResponse.json({
    trip,
    clashed: false,
    message: 'Request sent. Waiting for the rider.',
  }, { status: 201 });
}
