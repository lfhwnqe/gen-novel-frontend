# Template Developer Guide

[Read this in Simplified Chinese → docs/开发指南.md](docs/开发指南.md)

This project is a modern admin template built with Next.js 15, TypeScript, Tailwind CSS v4, and Shadcn UI. It follows a colocation architecture and ships with authentication, themes, navigation, data-table utilities, and middleware so you can develop features quickly.

> Update app identity in `src/config/app-config.ts` (`APP_CONFIG.name`, `meta.title`, `meta.description`).

## Online Demo

- URL: https://main.d3919bjo2q9c5.amplifyapp.com/
- Test account: `linuo`
- Test password: `Ur8Djfm6vtuf9Lc!`

## Development Environment

- Node.js: recommended `>= 22`; package manager: `npm` or `yarn`
- Dev server: `npm run dev` at `http://localhost:3456`
- Env vars: `API_BASE_URL` (global backend proxy target)
  - How to set up on first clone: copy `env.example` to `.env.development` and `.env.production`, then edit values
  - Examples: see `env.example`; in CI/hosting set env vars in the provider console (e.g., Amplify)
- Scripts:
  - `npm run dev`: start dev server (port `3456`)
  - `npm run build`: build artifacts
  - `npm run start`: production start (port `3456`)
  - `npm run lint`: lint check (ESLint)
  - `npm run typecheck`: TypeScript type check
  - `npm run format` / `npm run format:check`: Prettier format
  - `npm run generate:presets`: generate theme presets (see “Theme & Preferences”)

## Project Structure (Template View)

- `src/app`: App Router routes and pages
  - `(external)`: external group (e.g., root route redirect)
  - `(main)/dashboard/*`: dashboard features (recommended place for new features)
  - `layout.tsx`: root layout wiring theme and preferences
- `src/components`: shared components
  - `ui/`: Shadcn UI primitives
  - `data-table/`: table ecosystem (columns, pagination, drag, etc.)
  - `layouts/`: layout and page-level fragments
- `src/navigation/sidebar`: sidebar menu and role filtering (`sidebar-items.ts`)
- `src/lib`: utilities (`auth.ts`, `utils.ts`, `theme-utils.ts`, etc.)
- `src/stores`: Zustand stores (`auth/`, `preferences/`)
- `src/server/server-actions.ts`: server actions (cookie-based preferences)
- `src/middleware.ts` + `src/middleware/auth-middleware.ts`: route protection (see “Auth & Middleware”)
- `src/styles/presets`: theme CSS presets; `src/scripts/generate-theme-presets.ts` generates metadata/types
- `src/types/preferences/theme.ts`: theme modes and preset types

## Routing & Pages

- App Router + Route Groups:
  - `src/app/(external)/page.tsx`: redirect root to `/dashboard`
  - `src/app/(main)/dashboard/layout.tsx`: dashboard layout and sidebar
  - `src/app/(main)/dashboard/[...not-found]/page.tsx`: not-found fallback
- Redirects: `next.config.mjs` redirects `/dashboard` to `/dashboard/default`

## Auth & Middleware

- Token storage:
  - Client: `localStorage` (`accessToken`, `refreshToken`, `user`)
  - Cookie: `auth-token` (checked by middleware)
- Key APIs (`src/lib/auth.ts`):
  - `setAuthTokens(tokens)`: write to `localStorage` and `auth-token` cookie, and sync to global auth store
  - `logout()`: clear auth and redirect to `/auth/v1/login`
- Middleware (`src/middleware.ts` + `src/middleware/auth-middleware.ts`):
  - Protected paths: `/dashboard/:path*`
  - Unauthenticated access → redirect to `/auth/v1/login`
  - Accessing login while authenticated → redirect to `/dashboard`
  - Scope changes: edit `export const config.matcher` or the middleware logic

## API Access & Backend Proxy

- Global proxy: `next.config.mjs` `rewrites()` proxies any non-Next-captured routes to `API_BASE_URL`
  - Example: `fetch('/api/users')` → `${API_BASE_URL}/api/users`
- Recommended wrapper: `src/utils/fetch-with-auth.ts`
  - Adds `Authorization: Bearer <accessToken>` automatically
  - On `401`, tries refresh (`/api/auth/refresh`); on failure clears caches and redirects to login
  - `proxyParams`: pass-through `targetPath` and real `method` when your backend expects a proxy envelope
- Usage example:

```tsx
import React from 'react';
import { useFetchWithAuth } from '@/utils/fetch-with-auth';

export default function Demo() {
  const fetchAuth = useFetchWithAuth();
  React.useEffect(() => {
    fetchAuth('/api/products', { method: 'GET' })
      .then(r => r.json())
      .then(console.log);
  }, [fetchAuth]);
  return null;
}
```

## Theme & Preferences

- Initial wiring (`src/app/layout.tsx`):
  - Server-side `getPreference('theme_mode'|'theme_preset')` reads from cookies
  - Wraps `PreferencesStoreProvider`; use `usePreferencesStore` client-side
- Add a new theme:
  1) Add a `*.css` in `src/styles/presets/` with `label:`, `value:` comments and `--primary` for light/dark
  2) Run `npm run generate:presets` to update `src/types/preferences/theme.ts`
  3) UI pickers will automatically include the new preset
- Commit automation (`.husky/pre-commit`):
  - Generates presets and runs Prettier; then executes `lint-staged`

## Sidebar & RBAC

- Config file: `src/navigation/sidebar/sidebar-items.ts`
  - `NavGroup` → `items: NavMainItem[]`
  - Control visibility using `roles: Role[]` (see `src/types/auth.ts`)
  - `filterMenuByRole(menuGroups, userRole)` filters items per current user role
- Dev mode: when `IS_DEV` is `true`, demo menus (Default/CRM/Finance) are appended

## Add a Feature Module (Recommended Flow)

1) Create route and page:

```bash
mkdir -p src/app/\(main\)/dashboard/products/_components
```

```tsx
// src/app/(main)/dashboard/products/page.tsx
export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>
      <p className="text-muted-foreground">Manage your product information</p>
    </div>
  );
}
```

2) Add sidebar menu: `src/navigation/sidebar/sidebar-items.ts`

```ts
import { Package } from 'lucide-react';

// Append under the Dashboards group
{
  title: 'Products',
  url: '/dashboard/products',
  icon: Package,
  roles: [Role.ADMIN, Role.SUPER_ADMIN],
}
```

3) Private components and table utilities: put `schema.ts`, `columns.tsx`, `data-table.tsx` in `_components/`

4) Data access: prefer `fetch-with-auth`; use `proxyParams` if a proxy envelope is required

5) UX and state: `react-hook-form` + `zod` for forms; `zustand` for preferences/light state

## Code Quality

- Lint: `npm run lint` (CI: `npm run lint:ci`)
- Type check: `npm run typecheck`
- Formatting: `npm run format` / `npm run format:check`
- File naming: kebab-case (see `unicorn/filename-case` in `eslint.config.mjs`)
- React rules: avoid unstable nested components, array index keys; memoize context values, etc.
- Build speed: `next.config.mjs` skips ESLint/TS during build; run `lint` + `typecheck` in CI or locally before deploying

## Env Vars & Running

- `API_BASE_URL`: backend base (target for `rewrites()`); configure via `.env.development` / `.env.production`
- Dev: `npm run dev` → `http://localhost:3456`
- Build/Run: `npm run build` → `npm run start`

### First-time Setup (Env Vars)

- Copy examples:
  - `cp env.example .env.development`
  - `cp env.example .env.production`
- Edit values:
  - Dev: set `API_BASE_URL` to your dev backend (e.g., API Gateway dev stage like `https://xxxx.execute-api.<region>.amazonaws.com/dev`)
  - Prod: set `API_BASE_URL` to your prod backend (e.g., `https://xxxx.execute-api.<region>.amazonaws.com/prod` or custom domain)
- Optional overrides:
  - Use `.env.local` for developer-specific overrides (git-ignored); Next.js loads `.env.local` last
- Notes:
  - `.env.*` files are git-ignored (see `.gitignore`), so they won’t be committed
  - In hosted environments (e.g., AWS Amplify), set `API_BASE_URL` in the environment variables configuration
  - After setting envs: `npm ci` then `npm run dev` (port `3456`)

## FAQ

- Menu not visible: ensure you are logged in and the `user.role` has access (`roles` in `sidebar-items.ts`)
- 401 loop: ensure backend implements `/api/auth/refresh`; or temporarily disable auto-refresh logic
- API 404: check `API_BASE_URL`; ensure `next.config.mjs` `rewrites()` is applied
- Middleware not working: ensure `src/middleware.ts` exists and `config.matcher` matches your routes
- Port mismatch: template scripts use port `3456` (see `package.json` `dev/start`)

## Backend & Deploy

- Backend template: `aws-cdk-nestjs-template` (NestJS + AWS CDK). Repo: https://github.com/lfhwnqe/aws-cdk-nestjs-template
  - Matches this frontend in auth (JWT/refresh), path proxying (`/api/*`), and env var conventions (`API_BASE_URL`).
- Deployment recommendation (AWS Amplify for frontend): use AWS Amplify Hosting for this Next.js app and deploy the backend with the above template to AWS (API Gateway + Lambda or ECS/Fargate).
  - In Amplify console, set `API_BASE_URL` to your backend API Gateway domain (or custom domain).
  - Keep frontend and backend in the same AWS Account/Region to minimize latency and simplify IAM.
  - Amplify recognizes Next.js; if needed, use `npm ci && npm run build` to build.
  - Proxy note: this template's `rewrites()` forwards non-Next `/api/*` requests to `API_BASE_URL`.

## References

- Quick Start: `docs/快速开始.md`
- Practical Examples: `docs/实战示例.md`
- Query/Action Bar: `docs/query-action-bar.md`
- Style & Contribution: `AGENTS.md`
