# Reserva Aí

> A full-stack booking platform for party venues, connecting clients to venue owners through a seamless reservation flow.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

---

## Overview

**Reserva Aí** is a monorepo with two applications:

- **Client App** — Public-facing site where customers browse venues, check availability, and submit booking requests
- **Admin Portal** — Role-based dashboard for venue owners and super admins to manage venues, schedules, bookings, and payments

---

## Features

### Client App
- Browse active venues with photos, amenities, and capacity info
- Monthly availability calendar filtered by day-of-week schedules
- Shift-based booking (Daytime / Nighttime / Custom hours)
- Booking form with CPF, guest count validation, and advance notice enforcement
- WhatsApp redirect for venue inquiries

### Admin Portal
- **Super Admin**: manage venue owners, view all bookings
- **Venue Owner**: manage own venues, availability schedules, and bookings
- Role-based sidebar navigation
- Dashboard with color-coded calendar (partial / fully booked days)
- Booking management: approve, reject, reschedule, edit shift, track payments
- Payment tracking with automatic "Finalized" status when fully paid
- Client history grouped by CPF
- Profile page with WhatsApp, PIX key, and customizable confirmation message template
- Amenities management with custom icons (Lucide)
- Photo upload via Supabase Storage
- Address autocomplete via ViaCEP API

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Auth | Supabase Auth (email/password) |
| Database | PostgreSQL via Supabase (custom `espacoreserva` schema) |
| Serverless | Supabase Edge Functions (Deno) |
| Deployment | Vercel |

---

## Architecture

```
espacoreserva/
├── apps/
│   ├── client/          # Public booking app (React + Vite)
│   │   └── src/
│   │       ├── pages/   # Home, Booking, Confirm, Success
│   │       ├── hooks/   # useVenues, useAvailability, useVenue
│   │       └── lib/     # Supabase client
│   └── admin/           # Admin portal (React + Vite)
│       └── src/
│           ├── pages/   # Dashboard, Bookings, Venues, Slots, Clients, Owners, Profile
│           ├── components/ # Layout, Sidebar, ProtectedRoute
│           └── hooks/   # useAuth, useProfile
└── supabase/
    └── functions/       # Edge Functions (create-user, delete-user)
```

### Database Schema (`espacoreserva`)

```
profiles          → extends auth.users (role: super_admin | venue_owner)
venues            → party spaces owned by venue_owner profiles
amenities         → custom amenity tags per owner
venue_amenities   → many-to-many: venues ↔ amenities
venue_schedules   → availability rules by day_of_week + shift type
clients           → end customers (name, phone, CPF, email)
bookings          → reservations linking clients ↔ venues ↔ schedules
```

**Row Level Security** enforced on all tables:
- `anon` — read active venues/schedules, insert bookings/clients
- `venue_owner` — full access to own venues, schedules, bookings
- `super_admin` — full access to everything

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project

### Environment Variables

Create `.env` files in both `apps/client` and `apps/admin`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_key
```

### Installation

```bash
# Clone the repository
git clone https://github.com/RafaVPDev/espacoreserva.git
cd espacoreserva

# Install root dependencies
npm install

# Install app dependencies
cd apps/client && npm install
cd ../admin && npm install
```

### Running locally

```bash
# Client app (http://localhost:5173)
cd apps/client
npm run dev

# Admin portal (http://localhost:5174)
cd apps/admin
npm run dev
```

### Database Setup

1. Create a Supabase project
2. Go to **Project Settings → API → Exposed schemas** and add `espacoreserva`
3. Run the migrations from the Supabase SQL Editor (see `/supabase` folder)
4. Deploy Edge Functions:

```bash
npm install -g supabase
supabase login
supabase functions deploy create-user --project-ref YOUR_PROJECT_REF
supabase functions deploy delete-user --project-ref YOUR_PROJECT_REF
```

---

## Key Design Decisions

- **Shift-based availability** (Daytime / Nighttime / Custom) instead of per-slot booking — more realistic for venue rentals
- **RLS at database level** — security enforced in PostgreSQL, not just in application code
- **Edge Functions for admin operations** — user creation/deletion uses service role key server-side, never exposed to the client
- **Monorepo structure** — shared Supabase config, single Git history, two independent deploys

---