# Career Agent Web App - Implementation Plan

## Phase 1: Project Setup (Day 1-2)

### 1.1 Initialize Next.js Project
- [x] Create Next.js 14 app with TypeScript
- [x] Configure Tailwind CSS
- [x] Install and configure shadcn/ui
- [x] Set up project folder structure
- [ ] Create `.env.local` with all required variables
- [ ] Configure ESLint and Prettier

### 1.2 Supabase Setup
- [x] Create Supabase project (CareerWebApp - vtqqjrrqmxttukkoiywx)
- [x] Run database migrations (6 tables: profiles, subscriptions, cvs, cv_embeddings, job_searches, job_matches)
- [x] Configure RLS policies (all tables protected)
- [x] Create storage bucket for documents (cvs bucket)
- [x] Generate TypeScript types (src/types/database.ts)

### 1.3 Base Layout
- [x] Create root layout with providers
- [x] Build sidebar navigation component (with real user data)
- [x] Build mobile navigation
- [ ] Create loading and error states

---

## Phase 2: Authentication (Day 3-4) ✅ COMPLETE

### 2.1 Auth Pages
- [x] Login page with email/password (src/app/(auth)/login/page.tsx)
- [x] Signup page (src/app/(auth)/signup/page.tsx)
- [x] Forgot password flow (src/app/(auth)/forgot-password/page.tsx)
- [x] Reset password page (src/app/(auth)/reset-password/page.tsx)
- [x] OAuth callback handler (src/app/api/auth/callback/route.ts)

### 2.2 Auth Components
- [x] LoginForm component (integrated in login page)
- [x] SignupForm component (integrated in signup page)
- [x] SocialAuthButtons (Google OAuth implemented)
- [x] Password reset form (forgot-password + reset-password pages)

### 2.3 Auth Middleware
- [x] Next.js middleware for protected routes (src/middleware.ts)
- [x] Supabase server client setup (src/lib/supabase/server.ts)
- [x] useAuth custom hook (src/hooks/useAuth.ts)
- [x] Sidebar connected to real user data

---

## Phase 3: Dashboard Core (Day 5-7)

### 3.1 Career Profile Section (Top)
- [x] CareerProfileCard component
- [ ] CVQuickView (filename, date)
- [ ] CVUploadButton with dropzone
- [ ] GlobalMatchScore circular display
- [ ] Upload API route (`/api/cv/upload`)

### 3.2 Job Search Section (Middle)
- [x] JobSearchBar component
- [ ] Search API route (`/api/jobs/search`)
- [ ] n8n webhook trigger integration
- [ ] Loading state while searching

### 3.3 Recent Matches Section (Bottom)
- [x] RecentMatchesGrid component
- [x] MatchCard component (title, company, score)
- [x] Fetch from search_history + job_matches
- [x] Empty state for new users

---

## Phase 4: Job Details Page (Day 8-10)

### 4.1 Job Header
- [x] JobHeader component (integrated in job detail page)
- [ ] Company logo display
- [x] Save/Apply buttons
- [x] Job metadata (salary, location, type)

### 4.2 Gap Analysis Tab
- [x] GapAnalysisTab component
- [x] SkillBadge component (red/yellow/grey)
- [ ] SkillTipModal for missing skills
- [ ] Match score breakdown display
- [ ] Match calculation API (`/api/jobs/match`)

### 4.3 Suitability Tab
- [x] SuitabilityTab component
- [ ] AI analysis text display
- [ ] Suggested jobs list
- [ ] Link to alternative jobs

---

## Phase 5: n8n Integration (Day 11-13)

### 5.1 Webhook Client
- [ ] n8n client library (`/lib/n8n/client.ts`)
- [ ] Job search trigger function
- [ ] CV parse trigger function
- [ ] CV vectorize trigger function

### 5.2 Webhook Receivers
- [ ] n8n callback route (`/api/webhooks/n8n`)
- [ ] Update search_history on completion
- [ ] Error handling for failed workflows

### 5.3 n8n Workflows (in n8n)
- [ ] Job Search workflow (Apify trigger)
- [ ] CV Parse workflow (OpenAI)
- [ ] CV Vectorize workflow (Pinecone)

---

## Phase 6: AI Features (Day 14-16)

### 6.1 CV Parsing
- [ ] OpenAI client setup
- [ ] CV text extraction
- [ ] Skill extraction with GPT-4
- [ ] Store parsed data in Supabase

### 6.2 Vector Embeddings
- [ ] Pinecone client setup
- [ ] Generate CV embeddings
- [ ] Store/update vectors
- [ ] Similarity search function

### 6.3 Gap Analysis Logic
- [ ] Skill matching algorithm
- [ ] Score calculation weights
- [ ] Gap analysis generation

---

## Phase 7: Stripe Integration (Day 17-19)

### 7.1 Stripe Setup
- [ ] Stripe client library
- [ ] Create Pro product/prices in Stripe Dashboard
- [ ] Checkout session API (`/api/stripe/checkout`)
- [ ] Customer portal API (`/api/stripe/portal`)

### 7.2 Webhook Handler
- [ ] Stripe webhook route (`/api/webhooks/stripe`)
- [ ] Handle checkout.session.completed
- [ ] Handle subscription.deleted
- [ ] Handle invoice.payment_failed

### 7.3 Subscription Check
- [ ] useSubscription hook
- [ ] Pro feature gate component
- [ ] Upgrade prompt component

---

## Phase 8: Pro Features (Day 20-23)

### 8.1 Pro Action Drawer
- [x] ProActionDrawer component
- [ ] Drawer animation/styling
- [ ] Subscription check integration

### 8.2 Auto-Fix CV
- [ ] AutoFixCVButton component
- [ ] Generate CV API (`/api/cv/generate`)
- [ ] n8n workflow for CV generation
- [ ] PDF download functionality

### 8.3 AI Cover Letter
- [ ] CoverLetterPreview modal
- [ ] Generate API (`/api/cover-letter/generate`)
- [ ] Edit capability in modal
- [ ] Copy/download options

### 8.4 Interview Prep
- [ ] InterviewPrepMode component
- [ ] Questions API (`/api/interview/questions`)
- [ ] Practice mode UI
- [ ] Tips display

---

## Phase 9: Polish & Testing (Day 24-27)

### 9.1 Responsive Design
- [ ] Mobile breakpoint testing (375px)
- [ ] Tablet breakpoint testing (768px)
- [ ] Desktop optimization (1280px+)
- [ ] Touch-friendly interactions

### 9.2 Error Handling
- [ ] Global error boundary
- [ ] Toast notifications
- [ ] API error messages
- [ ] Retry logic

### 9.3 Testing
- [x] Vitest + React Testing Library setup
- [x] Component tests (MatchCard, RecentMatchesGrid - 18 tests passing)
- [ ] API route tests
- [ ] E2E test for critical flows

---

## Phase 10: Deployment (Day 28-30)

### 10.1 Pre-Deployment
- [ ] Environment variables in Vercel
- [ ] Database migrations on production Supabase
- [ ] Stripe webhook endpoint configuration
- [ ] n8n production webhooks

### 10.2 Deploy
- [ ] Connect repo to Vercel
- [ ] Configure build settings
- [ ] Deploy to production
- [ ] Verify all integrations

### 10.3 Post-Deployment
- [ ] Monitor for errors
- [ ] Test all user flows
- [ ] Performance check
- [ ] SSL/security verification

---

## Verification Checklist

### Authentication ✅
- [x] Can sign up with email
- [x] Can login/logout
- [x] OAuth works (Google)
- [x] Password reset works
- [x] Dev bypass (email with "test" skips auth)

### CV Upload
- [ ] File uploads to Supabase Storage
- [ ] CV appears in profile card
- [ ] Skills are extracted and displayed
- [ ] Global match score updates

### Job Search
- [ ] Search triggers n8n workflow
- [ ] Jobs appear in results
- [ ] Match scores display correctly
- [ ] Search history saves

### Gap Analysis
- [ ] Red/Yellow/Grey skills render
- [ ] Clicking skill shows tips
- [ ] Score breakdown is accurate
- [ ] Suitability suggestions work

### Pro Features
- [ ] Stripe checkout completes
- [ ] Subscription status updates
- [ ] Pro features unlock
- [ ] Auto-Fix CV generates PDF
- [ ] Cover letter generates
- [ ] Interview questions display

### Responsive
- [ ] Works on mobile (375px)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1280px)
