# Copilot / AI Agent Instructions — Lifeline Pulse

Purpose: provide concise, actionable guidance so an AI coding agent can be immediately productive in this repo.

- **Big picture**: This is a Vite + React + TypeScript app using React Router v6. Auth is handled by Supabase. UI primitives come from `shadcn-ui` (components under `src/components/ui`) and Tailwind CSS. The app mounts the hospital dashboard at the route `/hospital/*` (see `src/App.tsx`).

- **Important entry points**:
  - App router: `src/App.tsx` (hospital is routed via `<Route path="/hospital/*" element={<HospitalDashboard />} />`).
  - Auth: `src/contexts/AuthContext.tsx` — use `useAuth()` to access `user`, `roles`, `signOut()` and `getDashboardPath()`.
  - Supabase client and server functions: `integrations/supabase/` and `supabase/functions/` (server hooks like `create-emergency`, `chat`, `verify-otp`).
  - Shared UI primitives: `src/components/ui/*` and app components in `src/components/`.

- **Project-specific conventions** (follow these exactly):
  - Path alias: imports use `@/...` (configured in `tsconfig.json`) — preserve this in new files.
  - Dashboard isolation: hospital pages must be contained under a single folder `src/pages/hospital/` and routed only under `/hospital/*`. Do NOT change other dashboards or global routes.
  - UI: use existing `Button`, `Badge`, `Toast` components (`src/components/*`), and Tailwind utility classes — avoid adding new UI frameworks.
  - Map handling: use `react-leaflet` / `mapbox-gl` and helper hook `src/hooks/useGeolocation.tsx` for device location.
  - Data loading: prefer `@tanstack/react-query` (already used) for async queries and cache management.

- **Hospital dashboard rules (must follow)**
  - All hospital pages live in `src/pages/hospital/` and export via `src/pages/hospital/index.ts`.
  - The top-level hospital layout file must be `HospitalDashboard.tsx` (inside that folder) and render the header, sidebar and nested routes.
  - Internal routes (examples): `/hospital/overview`, `/hospital/emergencies`, `/hospital/blood`, `/hospital/live`, `/hospital/history`, `/hospital/notifications`, `/hospital/profile`. Implement these as nested routes in the HospitalDashboard layout using React Router v6.
  - Logout must call `signOut()` from `useAuth()`, clear roles (AuthContext already does this), and redirect to `/` with `navigate('/', { replace: true })` so the back button cannot reopen the dashboard.

- **Where to look for examples**
  - Header & small interactions: `src/hospital-dashboard/components/HospitalHeader.tsx` (current header implementation — adapt but move logic into new `src/pages/hospital/HospitalDashboard.tsx` header area).
  - Admin workflows & helpers: `src/lib/adminActions.ts` and `lib/offlineStorage.ts`.
  - Hooks: `src/hooks/useGeolocation.tsx`, `src/hooks/useOfflineSync.ts` — reuse for live tracking and offline delivery flows.

- **Build / run / test commands** (use these exact npm scripts):
  - Start dev server: `npm run dev` (runs `vite`)
  - Build: `npm run build`
  - Preview build: `npm run preview`
  - Run tests: `npm run test` (vitest)
  - Lint: `npm run lint`

- **Examples & small code patterns to follow**
  - Protect routes by checking `useAuth().hasRole('hospital_staff')` before rendering hospital layout. Example: inside `HospitalDashboard.tsx`, if not authorized, redirect to `/`.
  - Nested routes example (React Router v6):
    - In `HospitalDashboard.tsx` render a `<Routes>` with `<Route path="overview" element={<Overview/>} />` etc. The parent route is already mounted at `/hospital/*` in `src/App.tsx`.
  - Logout: call `await signOut(); navigate('/', { replace: true });` (this project already clears roles inside `AuthContext.signOut`).

- **Integration notes**
  - Supabase: server actions live in `supabase/functions/` and client calls use `integrations/supabase/client`. When adding backend workflows, mirror existing patterns (see `supabase/functions/create-emergency`).
  - Notifications and admin approvals frequently use `lib/adminActions.ts` and `@tanstack/react-query` mutations — keep consistent mutation keys and optimistic updates.

- **Files to create when implementing Hospital pages (mandatory)**
  - `src/pages/hospital/HospitalDashboard.tsx` (layout + nested routes)
  - `src/pages/hospital/Overview.tsx`
  - `src/pages/hospital/EmergencyRequests.tsx`
  - `src/pages/hospital/BloodCoordination.tsx`
  - `src/pages/hospital/LiveTracking.tsx`
  - `src/pages/hospital/HistoryRecords.tsx`
  - `src/pages/hospital/Notifications.tsx`
  - `src/pages/hospital/ProfileSettings.tsx`
  - `src/pages/hospital/index.ts` (export default HospitalDashboard or named exports)

- **One-line summary you may include in docs**
  “All hospital dashboard pages are contained within a single /hospital folder with internally linked routes, ensuring seamless navigation without 404 errors. The dashboard is role-protected, admin-verified, and fully isolated from public pages.”

If any of the hospital files already exist elsewhere (`src/hospital-dashboard/*`), move/merge them into `src/pages/hospital/` and update imports; keep other dashboards untouched.

If you want next: say `NEXT` to get exact React Router code, a Tailwind layout scaffold, or an admin approval workflow implementation.
