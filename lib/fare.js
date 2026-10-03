// lib/fare.js — Shared Fare Configuration & Calculation Logic

export const BASE_FARE = 5; // rupees, charged per boarded person
export const ROUTE_CHARGE = {
  'College-Station': 5,
  'Station-Office': 10,
  'College-Office': 15,
};

export const routeKey = (from, to) => [from, to].sort().join('-');

export const farePerPerson = (from, to) => {
  if (!from || !to) return BASE_FARE;
  const key = routeKey(from, to);
  return BASE_FARE + (ROUTE_CHARGE[key] ?? 0);
};

export const fareTotal = (from, to, boardedCount) => {
  return farePerPerson(from, to) * (boardedCount || 0);
};

export const formatRupee = (amount) => `₹${amount ?? 0}`;
