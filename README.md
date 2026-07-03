# HEI Talk

Whitelabel event registration and RSVP platform built with Next.js and Supabase.

## Features

- Public event listing and registration
- QR code tickets with PDF download
- Admin dashboard for event and attendee management
- CSV import/export
- Live check-in scanner

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Add your Supabase URL and anon key, then optionally customize branding:

```env
NEXT_PUBLIC_APP_NAME=HEI Talk
NEXT_PUBLIC_EVENT_URL_PREFIX=your-domain.com/event/
```

4. Run the development server:

```bash
npm run dev
```

## Database

SQL migrations are in `supabase/migrations/`. Apply them to your Supabase project before use.

## Admin

Sign in at `/admin` (credentials are configured in the app).
