# 🛺 Toto Saathi

> Ride management system for Toto Saathi — one toto, two stops, real-time tracking.

---

## 🚀 Quick Start

### 1. Install Node.js
Download from [nodejs.org](https://nodejs.org) (LTS version).

### 2. Install dependencies
```bash
cd lawazia-toto
npm install
```

### 3. Set up MongoDB
- Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
- Copy your connection string
- Edit `.env.local`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lawazia?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_here
NEXT_PUBLIC_FARE_PER_KM=5
NEXT_PUBLIC_ROUTE_DISTANCE_KM=8
```

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Deploy to Vercel

```bash
npm install -g vercel
vercel
```
In Vercel dashboard → Settings → Environment Variables, add:
- `MONGODB_URI`
- `JWT_SECRET`

---

## 🏗 Project Structure

```
lawazia-toto/
├── app/
│   ├── api/
│   │   ├── auth/           login, register, logout, me
│   │   ├── trips/          CRUD + accept, pickup, done, cancel
│   │   ├── rider/          location endpoint
│   │   └── history/        passenger history search
│   ├── dashboard/          Student/Employee pages
│   │   ├── page.js         Overview + stats
│   │   ├── request/        Request a ride form
│   │   ├── history/        Trip history + passenger search
│   │   └── track/          Live map tracking
│   ├── rider/              Rider pages
│   │   ├── page.js         Queue + active trip desk
│   │   └── history/        Rider trip history
│   ├── login/page.js
│   ├── register/page.js
│   ├── layout.js
│   └── globals.css
├── components/
│   ├── Navbar.js
│   ├── TripCard.js
│   ├── TotoMap.js          Leaflet map (dynamic)
│   ├── Providers.js
│   └── dateUtils.js
├── context/
│   ├── AuthContext.js      JWT cookie auth
│   └── ToastContext.js     Toast notifications
└── lib/
    ├── db.js               MongoDB connection
    ├── auth.js             JWT helpers (no SDK)
    └── models/
        ├── User.js         student | employee | rider
        └── Trip.js         Full trip lifecycle
```

---

## 🔄 Trip Lifecycle

```
pending → confirmed (rider accepts, clashes others)
        → clashed   (another trip accepted same slot)

confirmed → in_progress (rider starts pickup)
in_progress → completed (rider marks done, toto free)

Any status → cancelled
```

---

## 👥 Roles

| Role | What they can do |
|------|-----------------|
| **Student** | Register freely, request rides, view history, live track |
| **Employee** | Same as student |
| **Rider** | Register freely, see queue, accept trips, mark pickup, complete trips, share GPS |

---

## 💰 Fare Calculation

`Fare per person = FARE_PER_KM × ROUTE_DISTANCE_KM`

Default: ৳5/km × 8 km = **৳40 per person**

Change in `.env.local`:
- `NEXT_PUBLIC_FARE_PER_KM=5`
- `NEXT_PUBLIC_ROUTE_DISTANCE_KM=8`

---

## 🗺 Map Coordinates

In `components/TotoMap.js`, update the `STOPS` object with real GPS coordinates:
```js
const STOPS = {
  'College Station': { lat: YOUR_LAT, lng: YOUR_LNG, label: '🎓 College Station' },
  'Office':          { lat: YOUR_LAT, lng: YOUR_LNG, label: '🏢 Office' },
};
```

---

## 🌟 Features

- ✅ Role-based auth (student, employee, rider) — JWT cookie, manual (no SDK)
- ✅ Trip request with dynamic passenger list (N names, one filer)
- ✅ Rider accepts → auto-clashes overlapping pending trips  
- ✅ Mark each passenger: Boarded or Missed
- ✅ Complete trip → toto free
- ✅ Passenger history search by name
- ✅ Rider history with stats
- ✅ Live GPS map (Leaflet, rider's browser shares location)
- ✅ Fare per person calculated from distance
- ✅ Dark premium UI with animations
- ✅ Ready to deploy on Vercel
