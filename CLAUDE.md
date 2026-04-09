# Forja / Metodo R3SET

## Project overview

- Maintain a React Native fitness app built with Expo 54, React 19, React Native 0.81, and TypeScript.
- Preserve the existing visual direction: dark UI, high-contrast lime primary, cyan/orange accents, and bold typography.
- Treat the app as a 3-pillar product: training, nutrition, and progress/health tracking.
- Build toward an Apple App Store-ready product, with production-minded UX, copy, flows, and platform behavior.
- Keep the app generic at its core so it can later be customized for multiple clients through configuration, branding, content, and feature parameters instead of forks.

## Core stack

- Expo app entry: `App.tsx`
- Navigation: React Navigation v7 with native stack + bottom tabs
- State: Zustand stores in `src/store`
- Backend/auth: Supabase client in `src/lib/supabase.ts`
- Session persistence: `expo-secure-store`
- UI effects: `expo-blur`, `expo-linear-gradient`, `react-native-reanimated`

## Important commands

- Install deps: `npm install`
- Start dev server: `npx expo start`
- Start Android: `npx expo start --android`
- Start iOS: `npx expo start --ios`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`

## Architecture map

- `App.tsx`: bootstraps fonts, status bar, and navigation container
- `src/navigation/RootNavigator.tsx`: decides between auth flow and main app flow
- `src/navigation/MainTabs.tsx`: hosts the 5-tab shell and center add-menu modal
- `src/store/authStore.ts`: login/signup/logout/session restoration
- `src/store/trainingStore.ts`: training phase and workout session state
- `src/services/*`: domain services for goals, hydration, meals, measurements, photos, profile, and workouts
- `src/theme/*`: colors, spacing, typography, and design tokens
- `supabase/migrations/*`: database evolution and storage setup

## Product and UX constraints

- Keep the current brand language consistent with "The Kinetic Monolith" design system.
- Favor intentional, premium-feeling mobile UI over default Expo or generic RN layouts.
- Do not introduce light theme assumptions unless explicitly requested.
- Preserve Spanish product copy unless the task explicitly requires another language.
- Optimize decisions for a consumer fitness product centered on follow-up, adherence, training plans, and nutrition logging.
- Prefer patterns that will scale to multi-client customization: configurable labels, assets, modules, and business rules where reasonable.
- Avoid baking client-specific assumptions too deeply into shared flows unless explicitly requested.

## Product vision

- The app is a generic fitness/coaching platform focused on seguimiento, entrenamiento, and alimentación.
- The current implementation represents one branded instance, but the long-term goal is to support multiple clients with different identities and parameter sets.
- Favor architecture that can evolve toward white-label or tenant-style customization without rewriting core flows.
- When adding new features, consider whether they belong in shared platform behavior or client-configurable behavior.

## Coding guidance for this repo

- Prefer TypeScript-safe changes and keep strict-mode compatibility.
- Reuse design tokens from `src/theme` instead of hardcoding new values unless matching existing local patterns.
- Follow the current navigation structure instead of introducing parallel routing patterns.
- Keep Zustand logic focused in stores; avoid scattering app state across screens unless local UI state is enough.
- When touching auth, remember session restoration depends on `expo-secure-store` and Supabase refresh/sign-out behavior.
- When touching data flows, check whether the source is still mock data or already backed by Supabase.
- When a change introduces branding, copy, or business rules, prefer a parameterizable shape so the same code can later serve different clients.
- Prefer extensible naming and configuration seams over one-off hardcoded behavior when the extra abstraction is still lightweight.

## Known implementation details

- `App.tsx` loads `BebasNeue_400Regular` before rendering navigation.
- Auth gating happens in `RootNavigator` through `useAuthStore().checkSession()`.
- The center tab in `MainTabs` is not a real screen; it opens `AddMenuOverlay` in a modal.
- The training store currently contains substantial mock workout data and simulated async completion.
- Supabase auth storage is wrapped with an Expo SecureStore adapter in `src/lib/supabase.ts`.

## Files to inspect first for common tasks

- Auth issues: `src/store/authStore.ts`, `src/lib/auth/*`, `src/lib/supabase.ts`
- Navigation bugs: `src/navigation/types.ts`, `src/navigation/RootNavigator.tsx`, `src/navigation/MainTabs.tsx`
- Visual changes: `src/theme/colors.ts`, `src/theme/typography.ts`, shared components in `src/components`
- Backend/data changes: `src/services/*`, `supabase/migrations/*`

## Working style

- Make focused edits that fit the existing codebase instead of broad rewrites.
- Prefer small, verifiable changes and run `npm run typecheck` after non-trivial TypeScript edits.
- Flag assumptions clearly if a feature still depends on missing backend wiring, fonts, or assets.
- When relevant, think one step ahead about App Store polish: onboarding clarity, perceived quality, permissions copy, empty states, and reliability.
