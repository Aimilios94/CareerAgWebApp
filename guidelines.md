# Career Agent Web App - Project Guidelines

## Current Project Status

**Last Updated:** January 2025

### Phase Progress

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1.1: Next.js Setup | COMPLETE | 4/6 items |
| Phase 1.2: Supabase Setup | NOT STARTED | 0/5 items |
| Phase 1.3: Base Layout | MOSTLY COMPLETE | 3/4 items |
| Phase 2: Authentication | NOT STARTED | 0/11 items |
| Phase 3: Dashboard Core | UI ONLY | 4/12 items (UI components done, no API) |
| Phase 4: Job Details | UI ONLY | 3/13 items (UI components done, no API) |
| Phase 5-10 | NOT STARTED | 0/all items |

### What's Built (Frontend UI Shell)

**Core Layout:**
- `src/app/layout.tsx` - Root layout
- `src/app/(dashboard)/layout.tsx` - Dashboard layout
- `src/components/dashboard/Sidebar.tsx` - Navigation sidebar
- `src/components/dashboard/MobileNav.tsx` - Mobile navigation

**Dashboard Components:**
- `src/components/dashboard/CareerProfileCard.tsx`
- `src/components/dashboard/JobSearchBar.tsx`
- `src/components/dashboard/MatchCard.tsx`
- `src/components/dashboard/RecentMatchesGrid.tsx`

**Job Components:**
- `src/components/jobs/SkillBadge.tsx`
- `src/components/jobs/GapAnalysisTab.tsx`
- `src/components/jobs/SuitabilityTab.tsx`

**Pro Components:**
- `src/components/pro/ProActionDrawer.tsx`

**UI Base (shadcn/ui):**
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/progress.tsx`

### What's Missing

**Backend (None Built):**
- [ ] `src/lib/supabase/` - Supabase clients (server/browser)
- [ ] `src/lib/openai/` - OpenAI integration
- [ ] `src/lib/pinecone/` - Vector search
- [ ] `src/lib/stripe/` - Payment handling
- [ ] `src/lib/n8n/` - Webhook triggers
- [ ] `src/app/api/*` - All API routes
- [ ] `src/types/database.ts` - Supabase types

**Auth (None Built):**
- [ ] `src/app/(auth)/login/page.tsx`
- [ ] `src/app/(auth)/signup/page.tsx`
- [ ] `src/middleware.ts` - Auth middleware
- [ ] `src/hooks/useAuth.ts`

**State/Hooks:**
- [ ] `src/stores/` - Zustand stores
- [ ] `src/hooks/` - Custom hooks

**Configuration:**
- [ ] `.env.local` - Environment variables
- [ ] Supabase migrations
- [ ] Supabase RLS policies

---

## Resumption Prompt

Copy and paste this after clearing context:

```
Project: CareerAgWebApp - Career management web app

Tech Stack: Next.js 14 + TypeScript + Tailwind + shadcn/ui + Supabase + Stripe + n8n + Pinecone + OpenAI

Current Status: Frontend UI shell is complete. Backend integrations not started.

Completed:
- Next.js project with TypeScript and Tailwind
- shadcn/ui components (button, card, input, progress)
- Dashboard layout (Sidebar, MobileNav)
- Dashboard components (CareerProfileCard, JobSearchBar, MatchCard, RecentMatchesGrid)
- Job components (SkillBadge, GapAnalysisTab, SuitabilityTab)
- Pro component (ProActionDrawer)

Not Started:
- Supabase setup (migrations, RLS, types)
- Authentication (login, signup, middleware)
- All API routes
- All lib/ integrations
- Environment variables

Next Steps:
1. Phase 1.2 - Supabase Setup: Create migrations, RLS policies, storage bucket, generate types
2. Phase 2 - Authentication: Login/signup pages, middleware, Supabase auth

Read plan.md for full implementation plan. Read PRD.md for requirements. Read context.md for architecture.
```

---

## Development Workflow

### Starting Development
```bash
npm run dev          # Start Next.js dev server
npx supabase start   # Start local Supabase (when set up)
```

### Before Committing
```bash
npm run lint         # Check for lint errors
npm run type-check   # Verify TypeScript types
npm run build        # Test production build
```

### Database Changes
```bash
npx supabase db push                                    # Push migrations
npx supabase gen types typescript --local > src/types/database.ts  # Regenerate types
```

---

## Key Decisions Made

1. **n8n for all external integrations** - UI triggers n8n webhooks, not direct API calls
2. **Supabase for everything** - Auth, Database, Storage (no separate services)
3. **Pinecone for vectors** - CV embeddings stored separately from Supabase
4. **Stripe for payments** - Pro subscription model (monthly/annual)
5. **shadcn/ui for components** - Customizable, accessible, Tailwind-based

---

## File Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Claude AI instructions and code patterns |
| `PRD.md` | Product requirements and features |
| `plan.md` | Implementation plan with checkboxes |
| `context.md` | Technical architecture and data flows |
| `guidelines.md` | This file - current state and resumption |
