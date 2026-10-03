# 🛺 Toto Saathi

> Real-time campus & office shuttle dispatch system — instant booking, group rosters, atomic single-toto concurrency, and automatic fare calculation.

---

## 🌟 Highlights

- **⚡ Instant "Book Now" Flow**: No slot picking or date snapping. Requests are dispatched immediately with server timestamps (`requestedAt`).
- **🔒 Atomic Single-Toto Concurrency**: Guaranteed by a MongoDB unique partial index on `holdKey: "TOTO"`. Only one active ride (`Accepted` or `Pickup`) can hold the Toto at any time; competing requests are clashed automatically without race conditions.
- **👥 Multi-Passenger Rosters**: File a group ride for up to 20 passengers. Riders individually mark each passenger as **Boarded** or **Missed** before completing the trip.
- **💰 Built-in Fare Engine**:
  - Base fare: ₹5 per boarded passenger.
  - Route charges: College ↔ Station (+₹5 = **₹10/person**), Station ↔ Office (+₹10 = **₹15/person**), College ↔ Office (+₹15 = **₹20/person**).
  - Final fare is calculated and recorded on `Done` strictly for passengers who actually boarded (missed passengers add ₹0).
- **🗺️ Interactive Schematic Route Map**: Pure inline SVG projection of stops with active route highlight and directions links.
- **🌓 Light & Dark Modes**: Responsive, accessible interface built with CSS design tokens, Lucide icons, and full mobile bottom navigation.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** 18.17+ or 20+ installed ([nodejs.org](https://nodejs.org))
- **MongoDB** cluster (Atlas or local instance)

### 2. Installation
```bash
git clone https://github.com/kamranakmal749/Toto_Desk-VibeNerds.git toto-saathi
cd toto-saathi
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the project root:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/lawazia?retryWrites=true&w=majority
JWT_SECRET=your_secure_random_jwt_secret_here
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔄 Trip Lifecycle & State Machine

```
[Student / Employee]                     [Rider Desk]
  Filer creates request
           │
           ▼
    ┌─────────────┐
    │  Requested  │ ────── Rider declines ──────▶ [ Declined / Clash ]
    └─────────────┘
           │
      Rider accepts (Atomic lock: holdKey = "TOTO")
      Auto-clashes competing Requested trips
           │
           ▼
    ┌─────────────┐
    │  Accepted   │
    └─────────────┘
           │
      Rider starts pickup
           │
           ▼
    ┌─────────────┐
    │   Pickup    │ ◀─── Rider marks each passenger (Boarded / Missed)
    └─────────────┘
           │
      All passengers resolved ──▶ Finish trip (Calculates & saves fareTotal, releases holdKey)
           │
           ▼
    ┌─────────────┐
    │    Done     │ ─── Toto is free for new requests
    └─────────────┘
```

### Trip Statuses
| Status | Description |
|---|---|
| `Requested` | Ride request sent and waiting in the rider's queue. |
| `Accepted` | Rider claimed the trip. Toto is locked to this ride. |
| `Pickup` | Rider has arrived at pickup. Boarding in progress. |
| `Done` | All passengers boarded/missed and trip completed. Final fare recorded. |
| `Clash` | Toto was unavailable or another trip was accepted for this window. Filer can 1-click retry. |

---

## 👥 User Roles

| Role | Permissions & Capabilities |
|---|---|
| **Student** | Create ride requests, manage group rosters, track live ride state, view personal trip history with boarding statuses and fares. |
| **Employee** | Same capabilities as Student for office/campus commute. |
| **Rider** | Live queue desk, 1-click Accept/Decline, boarding controls (Boarded / Missed toggles), fare collection prompts, rider stats (Total, Done, Boarded, Missed, Fares collected). |

---

## 💵 Fare Rules & Pricing (`lib/fare.js`)

| Route | Base Fare | Route Charge | Per Person Fare |
|---|---|---|---|
| **College ↔ Station** | ₹5 | ₹5 | **₹10** |
| **Station ↔ Office** | ₹5 | ₹10 | **₹15** |
| **College ↔ Office** | ₹5 | ₹15 | **₹20** |

- **Formula**: `fareTotal = (BASE_FARE + ROUTE_CHARGE[route]) × boardedCount`
- Live estimates are displayed during request and in the queue.
- Recorded upon completion in `Trip.fareTotal`.

---

## 🛠 Project Structure

```
toto-saathi/
├── app/
│   ├── api/
│   │   ├── auth/              # JWT login, register, logout, me
│   │   ├── trips/             # CRUD, filters, search
│   │   │   └── [id]/          # accept, pickup, done, reject endpoints
│   │   └── history/passenger/ # Passenger search by name
│   ├── dashboard/             # Student & Employee interface
│   │   ├── page.js            # Overview & active trip banner
│   │   ├── request/page.js    # Book now form with live fare estimate
│   │   └── history/page.js    # My trips with status filter pills
│   ├── rider/                 # Rider control desk
│   │   ├── page.js            # Live queue, active pickup desk & boarding actions
│   │   └── history/page.js    # Rider metrics (5 stats), filters & search
│   ├── login/page.js          # Authentication split screen
│   ├── signup/page.js         # Account creation with role selection
│   ├── layout.js              # Root layout & SEO metadata
│   └── globals.css            # Complete design system & responsive styling
├── components/
│   ├── Navbar.js              # Header, theme toggle & user dropdown
│   ├── AuthBrandPanel.js      # Auth brand visual & route diagram
│   ├── TripCard.js            # Reusable trip card with map & fare badges
│   ├── RouteMap.js            # SVG schematic map with projected coordinates
│   └── dateUtils.js           # Formatted timestamps (Asia/Kolkata)
├── context/
│   ├── AuthContext.js         # Auth state provider
│   ├── ThemeContext.js        # Light/Dark mode state
│   └── ToastContext.js        # Notification toasts
├── lib/
│   ├── db.js                  # Mongoose connection pooling
│   ├── auth.js                # JWT token signing & verification
│   ├── status.js              # Single source of truth for statuses
│   ├── fare.js                # Fare calculation engine
│   ├── places.js              # Stop coordinates & route distances
│   └── models/
│       ├── User.js            # User model
│       └── Trip.js            # Trip model with holdKey unique index & fareTotal
└── scripts/
    ├── check.mjs              # Automated acceptance & concurrency tests
    ├── migrate.mjs            # Status normalization & index migration
    └── migrate-fare.mjs       # Fare backfill migration script
```

---

## 🧪 Testing & Verification

Run the automated acceptance suite verifying atomic concurrency, group boarding state validation, history lookup, and fare math:

```bash
npm run check
```

Run database migrations:
```bash
npm run migrate       # Normalize statuses and setup partial indexes
npm run migrate:fare  # Backfill fareTotal on historical Done trips
```

Create an optimized production build:
```bash
npm run build
```

---

## 📦 Deployment (Vercel)

1. Push your repository to GitHub.
2. Import project in [Vercel Dashboard](https://vercel.com).
3. Add Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
4. Click **Deploy**.

---

## 📄 License
MIT License. Created for campus and office shuttle management.
