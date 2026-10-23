# BidChip Web

Frontend for the BidChip electronics component sourcing marketplace. Built with Next.js 14 App Router.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: next-auth v5 (Credentials → Django API)
- **Server state**: TanStack Query v5
- **HTTP**: Axios
- **Validation**: Zod + React Hook Form
- **Linting**: ESLint + Prettier

## Getting started

```bash
cp .env.local.example .env.local
# Edit .env.local with your values

npm install
npm run dev
```

App runs at http://localhost:3000.

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Django API base URL (e.g. `http://localhost:8000/api/v1`) |
| `NEXTAUTH_URL` | Public URL of this Next.js app |
| `NEXTAUTH_SECRET` | Random secret for JWT signing — generate with `openssl rand -base64 32` |

## Project structure

```
app/              Next.js App Router pages
  (auth)/         Login + Register pages (unauthenticated)
  (dashboard)/    Protected dashboard pages
  (admin)/        Staff-only admin layout
components/
  ui/             shadcn/ui component stubs
  layout/         Sidebar, Header, Providers
  auth/           LoginForm, RegisterForm
lib/
  api.ts          Axios instance
  auth.ts         next-auth v5 config
  utils.ts        cn() helper
hooks/            React hooks
types/api.ts      TypeScript interfaces matching Django models
middleware.ts     Route protection
```

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript (no emit)
npm run format       # Prettier
```

## Docker (local dev)

```bash
docker-compose up
```

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs lint, type-check, and build on every PR and push to main. Deployment to AWS Amplify is triggered automatically when the main branch is updated.
