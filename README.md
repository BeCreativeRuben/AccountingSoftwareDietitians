# Diëtisten Accounting SaaS

Accounting & management platform for Belgian diëtisten (dieticians).

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy the SQL schema from `DATABASE_SCHEMA.sql` and run it in the Supabase SQL editor
   - Get your project URL and API keys from Settings > API

3. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## 📁 Project Structure

```
dietisten-app/
├── app/
│   ├── (auth)/          # Authentication pages (login, signup)
│   ├── (dashboard)/     # Protected dashboard pages
│   ├── api/             # API routes
│   └── layout.tsx       # Root layout
├── components/          # React components
├── lib/
│   ├── auth.ts         # Authentication utilities
│   ├── encryption.ts   # Encryption utilities
│   ├── supabase/       # Supabase client setup
│   └── types/          # TypeScript type definitions
├── store/              # Zustand state management
└── public/             # Static assets
```

## 🎯 Features

### MVP Features (Day 1-4)

- ✅ User authentication (signup/login)
- ✅ Client management (CRUD + CSV import)
- ✅ Appointment scheduling (calendar view)
- ✅ Expense tracking (with recurring support)
- ✅ Insurance reimbursement tracker (5 Belgian companies)
- ✅ Dashboard with analytics
- ✅ Settings (dark mode, appointment types, categories)

## 🔐 Security

- End-to-end encryption for sensitive client data
- Password-derived encryption keys
- Audit logging for all CRUD operations
- JWT-based session management
- Rate limiting on auth endpoints

## 📚 Documentation

- `PROJECT_SPEC.md` - Complete business & technical specification
- `DATABASE_SCHEMA.sql` - Database schema (ready to import)
- `TYPESCRIPT_TYPES.ts` - TypeScript type definitions
- `IMPLEMENTATION_GUIDE.md` - Step-by-step implementation guide
- `TEST_DATA.json` - Test data for development

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **State Management:** Zustand
- **Calendar:** React Big Calendar
- **Charts:** Recharts
- **Encryption:** TweetNaCl.js

## 📅 Development Timeline

- **Day 1:** Foundation & Auth ✅
- **Day 2:** Clients & Appointments
- **Day 3:** Expenses, Dashboard & Insurance
- **Day 4:** Polish, Testing & Deploy

## 📝 License

Private project - All rights reserved
