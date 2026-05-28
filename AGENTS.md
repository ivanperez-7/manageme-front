# printpos-web

Stack: React 19, Vite 7, TanStack Router v1 (file-based), TanStack Table v8,
TanStack Form v1, TanStack Store, shadcn/ui (New York, zinc), Tailwind v4,
axios, zod v4, date-fns (es locale), framer-motion, recharts, sonner.

## Commands

- `npm run dev` — dev server on **port 3000**
- `npm run build` — `vite build && tsc` (type-check is separate, **not** part of dev)
- `npm test` — `vitest run`
- No eslint/prettier/biome — only TS compiler checks

## Project structure

- **Routes**: `src/routes/`, file-based, auto-generates `src/routeTree.gen.ts`
  via `@tanstack/router-plugin/vite`. Do **not** edit `.gen` files by hand.
- **Auth layout**: `src/routes/_app.tsx` — applies `authGuard` beforeLoad;
  all routes under `_app/` require login.
- **UI**: shadcn/ui components in `src/components/ui/`. Add new ones with
  `npx shadcn@latest add <name>`.
- **API**: Endpoint constants in `src/api/endpoints.ts`, base URL from
  `VITE_API_URL` (`.env`).
- **API clients**: `src/api/` — `withAuth` (axios) auto-injects Bearer token
  and `x-branch-id`. Use `withAuth.get/post/patch/delete` directly;
  no React Query/SWR layer.
- **Types**: `src/lib/types.ts` — zod schemas + TS types shared across routes.
- **Stores**: `src/stores/` — TanStack Store for auth token + user profile.
- **Navigation entries**: `src/lib/navigation.tsx` — add here when creating
  a new sidebar route.
- **No README or CI/CD workflows exist.**

## Routing patterns

- **Route loaders** fetch data via TanStack Router's `loader` —
  not React Query. Use `staleTime` on the route to prevent unnecessary
  refetches on same-route navigation.
- **`loaderDeps` must return only the deps the loader actually uses.**
  Returning a new object every call is fine (deep-compared by router),
  but including extra params in `loaderDeps` triggers unwanted refetches.
- **Search params & pagination**: DataTable uses controlled pagination.
  Pass `initialPage` + `onChangePage`. Always include `staleTime` on routes
  with pagination so nav-back restores the page without a refetch.
- **Route codegen** runs automatically during `vite` dev/build. If a new
  route isn't recognized, restart the dev server.
- **Route masking**: Search params can be hidden from the browser's URL via
  masking on `src\main.tsx`, where multiple createRouteMask functions can be
  seen being created and configured in router.routeMasks. These have to perfectly
  match the target route's search params. This is all TanStack Router functionalities.

## Forms

- Use `useAppForm` (`src/hooks/use-app-form.tsx`) — wraps `@tanstack/react-form`.
  Available field components: `<Field.InputField>`, `<Field.NumberSelectField>`.
  Available form component: `<form.SaveButton>`.
- Zod v4 schemas for validation. Use `validators` option on `useAppForm`.

## Auth

- **Login**: POST `ENDPOINTS.auth.login` → stores access token + fetches user
  info → navigates to dashboard.
- **Token**: Bearer in memory (TanStack Store), refresh via POST
  `ENDPOINTS.auth.refresh` on 401.
- **Branch**: `x-branch-id` cookie, sent on every `withAuth` request.
- **Roles**: `admin` | `operativo` | `consulta` — checked for
  movement approval.

## Conventions

- UI text is in **Spanish** (es-MX locale for number formatting, `es` for
  date-fns).
- `@/` path alias maps to `src/`.
- TypeScript strict mode with `noUnusedLocals`, `noUnusedParameters`.
- ESM (`"type": "module"` in package.json).
- Use `cn()` from `@/lib/utils` for class merging.
- Toast notifications via `sonner`'s `toast.promise(...)` for all mutations.
- Use `router.invalidate()` (from `@tanstack/react-router`) to refetch
  route data after mutations.
