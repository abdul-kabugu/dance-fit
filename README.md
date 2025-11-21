# **Project Overview**

We’re building a **modern event management and discovery platform**, an Eventbrite-style system optimized for **dance communities** (Bachata, Salsa, Kizomba, Zouk, etc.).

The platform supports:

- Event creation & management
- Artist/teacher profiles
- NFT ticketing using **Bitcoin Cash (CashTokens)**
- BCH payments + fiat (Google Pay / Apple Pay)
- Cashback via **CashStamp**
- Multi-step, premium checkout flow

This is a full-stack application with **Next.js App Router**, modern UI components, and a scalable backend.

# 🧰 **Tech Stack**

### **Frontend**

- Next.js App Router (v15+)
- TypeScript
- TailwindCSS
- Shadcn UI

### **Backend**

- Next.js API routes
- Prisma ORM
- PostgreSQL
- Clerk Authentication
- BCH Payments (CashScript & address generation)
- NFT Ticketing via CashTokens
- Cashback via CashStamp

# 👥 **User Types**

### **1\. Organizers**

- Create events (single + recurring)
- Manage tickets
- Track sales & analytics
- Feature artists on events

### **2\. Artists (Teachers)**

- Public profile page
- Social links
- Dance styles
- Listed on events they teach

### **3\. Attendees (Dancers)**

- Browse events
- View event details
- Buy tickets (BCH or fiat)
- Receive NFT ticket
- Claim BCH cashback

# 🎨 **UI Philosophy**

- Mobile-first
- Clean, elegant, professional
- Minimal friction, high conversion
- Inspired by Eventbrite & Airbnb
- Smooth multi-step flows
- Premium checkout & success pages
- Soft shadows, rounded corners, modern spacing

# ✅ **Current Progress (Completed UI)**

We have already designed :

### **Organizer & Admin UI**

✔ Organizer Dashboard✔ Organizer Analytics placeholders✔ Create Event (3-step multi-page flow)✔ Event List (admin) UI planned✔ Artist List UI planned

### **Event Creation Flow**

✔ Step 1 — Event details page✔ Step 2 — Ticket type creation page✔ Step 3 — Review & Publish page

### **Checkout Flow (Attendee side)**

✔ Step 1 — Checkout information✔ Step 2 — Payment selection✔ Step 3 — BCH Payment page (with QR, timer, status UI)✔ Step 4 — Success page (NFT ticket + CashStamp QR)

### **Other UI**

✔ Success modal component✔ Base layout styling✔ Premium event pages (structure)

🔜 Yet to build (UI):

- Organizer Events List (dashboard)
- Artist Creation Page
- Artist Public Profile Page
- Analytics UI
- Admin Event Editing UI

# 🚧 **Next Phase: Backend + API Implementation**

We are now entering the **backend development phase**, which includes:

### **1\. Database Layer (Prisma)**

- User / Artist / Organizer models
- Event model + slug system
- Ticket types
- Tickets
- Checkout sessions
- BCH payment session model
- NFT ticket record
- Cashback record
- Relationships (ArtistOnEvent, Organizer events, etc.)

### **2\. API Routes (Next.js App Router)**

We will build:

- /api/events (create, list, detail)
- /api/events/\[id\] (update, delete)
- /api/artists (create profile)
- /api/organizers (create profile)
- /api/payments/sessions (create BCH payment session)
- /api/payments/webhooks/bch (confirm payment)
- /api/tickets (issue NFT ticket + cashback)
- /api/onboarding (role assignment + profile setup)

### **3\. Integration**

- Connect checkout UI → backend checkout session
- Connect BCH Payment Page → payment watcher
- Connect success page → NFT ticket issuance
- Connect organizer UI → event CRUD
- Connect artists UI → profiles

# 📍 **Roadmap**

### **PHASE 1 – UI (COMPLETED)**

✔ Event creation flow✔ Checkout flow✔ BCH payment UI✔ Success page✔ Dashboard initial designs

### **PHASE 2 – Backend (NEXT)**

🔜 Prisma schema completion🔜 Event CRUD APIs🔜 Artist + Organizer onboarding APIs🔜 Ticket + payment APIs🔜 BCH payment integration🔜 NFT ticket generation

### **PHASE 3 – Connecting UI to Backend**

🔜 Frontend → API wiring🔜 Error handling + toasts🔜 Auth gates (Clerk)🔜 Organizer dashboards🔜 Artist public pages

# 🏁 **Goal**

Deliver a production-style, Eventbrite-like dance event platform with:

- Slick UI
- Fast performance
- Web3 ticketing
- BCH payments
- Creator tools for studios & artists
- Attendee-friendly checkou
