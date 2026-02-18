# Career Agent Web App - Claude Instructions

## Project Overview
A career management web app helping users find job matches, analyze skill gaps, and improve applications.

## Tech Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Next.js API Routes + Supabase
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (CV/documents)
- **AI:** OpenAI (GPT-4 for parsing, embeddings)
- **Vector DB:** Pinecone (CV embeddings, job matching)
- **Payments:** Stripe (Pro subscription)
- **Automation:** n8n (webhooks, job scraping, CV generation)
- **Scraping:** Apify (job boards via n8n)
- **Deployment:** Vercel

## Key Commands
```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript check

# Database
npx supabase start   # Start local Supabase
npx supabase db push # Push migrations
npx supabase gen types typescript --local > src/types/database.ts

# Testing
npm run test         # Run tests
npm run test:e2e     # E2E tests
```

## Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── dashboard/         # Dashboard-specific components
│   ├── jobs/              # Job-related components
│   └── pro/               # Premium feature components
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── openai/            # OpenAI integration
│   ├── pinecone/          # Vector search
│   ├── stripe/            # Payment handling
│   └── n8n/               # Webhook triggers
├── hooks/                 # Custom React hooks
├── stores/                # Zustand state stores
└── types/                 # TypeScript types
```

## Code Patterns

### Supabase Server Client
```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // ...
}
```

### Protected API Route
```typescript
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

### Pro Feature Check
```typescript
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('plan_type')
  .eq('user_id', user.id)
  .single();

if (subscription?.plan_type !== 'pro') {
  return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
}
```

### n8n Webhook Trigger
```typescript
import { triggerN8nWebhook } from '@/lib/n8n/client';

await triggerN8nWebhook('job-search', {
  userId: user.id,
  query: searchQuery,
  filters: searchFilters
});
```

## Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `N8N_WEBHOOK_BASE_URL`
- `NEXT_PUBLIC_APP_URL`

## Important Notes
- All UI triggers call n8n webhooks (not direct API calls to external services)
- All permanent data stored in Supabase
- CV vectors stored in Pinecone with reference in `cv_embeddings` table
- Pro features gated by `subscriptions.plan_type = 'pro'`
- Use Row Level Security (RLS) on all user data tables

---

## Current Progress (Updated: Jan 2025)

### ✅ Phase 1: Project Setup - COMPLETE
- Next.js 14 + TypeScript + Tailwind + shadcn/ui setup
- Dashboard layout (Sidebar, MobileNav)
- UI Components: CareerProfileCard, JobSearchBar, MatchCard, RecentMatchesGrid
- Job UI: SkillBadge, GapAnalysisTab, SuitabilityTab
- Pro UI: ProActionDrawer

### ✅ Phase 1.2: Supabase Database - COMPLETE
- **Supabase Project:** CareerWebApp (`vtqqjrrqmxttukkoiywx`)
- 6 tables created: profiles, subscriptions, cvs, cv_embeddings, job_searches, job_matches
- RLS policies on all tables
- Storage bucket `cvs` for CV uploads
- TypeScript types generated (`src/types/database.ts`)
- Triggers: auto-create profile/subscription on signup, auto-update timestamps

### ✅ Phase 2: Authentication - COMPLETE
- Login page (`src/app/(auth)/login/page.tsx`) - email/password + Google OAuth
- Signup page (`src/app/(auth)/signup/page.tsx`) - with email confirmation
- Forgot password (`src/app/(auth)/forgot-password/page.tsx`)
- Reset password (`src/app/(auth)/reset-password/page.tsx`)
- Auth callback (`src/app/api/auth/callback/route.ts`)
- Middleware protection (`src/middleware.ts`) - protects /dashboard routes
- useAuth hook (`src/hooks/useAuth.ts`) - manages auth state
- Sidebar shows real user data (name, plan type, logout)
- Dev bypass: email containing "test" skips real auth

### 🔜 Next: Phase 3 - Dashboard Core
1. **CV Upload:** CVUploadButton, upload API, CVQuickView
2. **Job Search:** Search API, n8n webhook trigger
3. **Recent Matches:** Fetch from database, empty states

### Reference Files
- `specs/plan.md` - Full implementation checklist
- `specs/PRD.md` - Product requirements
- `specs/context.md` - Architecture diagrams
- `docs/n8n/` - n8n workflow JSON files (need to make dynamic)


# Rule: Verification-Led Development (VLD)

## Core Requirement

You are a TDD-first engineer. You are **forbidden** from writing implementation code before a failing test exists.

## The Workflow

### 1. Define: Create Tests First
- Create test file: `tests/test_[feature].py` (Python) or `__tests__/[feature].test.js` (JavaScript)
- Write the test case for the feature you want to build
- A "failing test" means:
  - Test file exists and is executable
  - Test runs and produces a non-zero exit code
  - Error is logged (e.g., `ImportError`, `AssertionError`, `ReferenceError`)

### 2. Execute: Run the Test & Report Failure
Run the test immediately to confirm it fails.

**Report failures in this format:**
```
[Test Name] → [Error Type] → [Root Cause]
Example: test_user_login → AssertionError → Missing password validation function
```

**Language-specific test runners:**
- Python: `pytest tests/test_[feature].py`
- JavaScript/Node: `npm test` or `jest [test_file].test.js`
- Go: `go test ./...`
- TypeScript: `npm test` or `ts-jest`

### 3. Implement: Write Code to Pass the Test
Write the minimum code necessary to make the failing test pass. Do not over-engineer.

### 4. Verify: Run the Test Again
- Run the test: Confirm it passes (exit code 0)
- If test passes → proceed to step 5
- If test fails → return to step 3 and fix the implementation

### 5. Refactor (Optional but Recommended)
Clean and optimize your code while keeping the test passing.

**Critical:** Re-run the test after refactoring to confirm it still passes.

### 6. Next Feature or Cleanup
Move to the next feature and repeat steps 1-5.

## Background Testing

If a test suite is slow, run it in the background:
- Python: `pytest &` or `pytest -n` (parallel mode with pytest-xdist)
- JavaScript: `npm test -- --watch &`

**Do not wait idly.** While tests run in the background:
- Document the logic or next test case
- Plan the next feature
- Review code for clarity

## Handling Edge Cases

### Flaky or Timeout Tests
If a test hangs, times out, or fails intermittently:
1. Kill the process: `Ctrl+C`
2. Log the issue: `"Test [name] timed out after [X]s — investigating root cause"`
3. Investigate the root cause (infinite loop, external API call, race condition)
4. Fix or skip the test with a clear comment: `# TODO: Fix flaky test - [reason]`

### Multiple Test Suites
If your project has multiple test files:
- Run module-specific tests first: `pytest tests/test_auth.py`
- Run full suite before committing: `pytest` or `npm test`

## Stop Hook: Mandatory Verification Before Turn End

**CRITICAL:** Before finishing your turn, if ANY code was written, modified, or deleted:

1. **Run the full test suite for the modified module:**
```bash
   pytest tests/test_[feature].py
   # or
   npm test -- [feature].test.js
```

2. **Report results in this format:**
```
   ✅ [X tests passing] / [X tests total]
   # or
   ❌ [X tests passing] / [X tests total] — [test names that failed]
```

3. **Decision:**
   - ✅ **100% pass rate** → Feature complete. Safe to move on.
   - ❌ **<100% pass rate** → DO NOT mark feature as complete. Return to step 3 (Implement) and fix failures.

## Example Workflow
```
Turn Start:
1. ✏️ Create tests/test_password_validator.py with test case
2. 🔴 Run pytest → NameError: name 'validate_password' is not defined
3. 💻 Implement validate_password() function in password.py
4. 🟢 Run pytest → PASSED
5. 🔧 Refactor code for readability
6. ✅ Run pytest → PASSED
7. Turn End Hook: Verify full test suite passes before finishing turn
```

## Discipline Reminders

- **No shortcuts:** Tests must exist before implementation code.
- **No premature optimization:** Write code to pass the test, not to be "perfect."
- **No skipping verification:** Every code change requires a test run.
- **No hand-waving:** Report specific errors, not vague statements like "it works."

---

## Browser Testing Rules (Chrome Extension)

### Token Optimization
- NEVER use scroll-and-stitch for full page tests. Use /fullpage-test command instead.
- NEVER extract all HTML within <main> or <body>. Only extract specific, relevant divs for the current task.
- NEVER use browser_snapshot (accessibility tree) unless explicitly asked — it's extremely token-heavy.
- Before starting any browser test session, check context window usage. If above 50%, compact first.
- Prefer browser_evaluate with targeted JS queries over loading full DOM content.

### Pre-Execution
- Before any visual capture, run the dismiss-popups script at C:\Users\aimilios\.claude\scripts\dismiss-popups.js to auto-dismiss cookie banners and overlays.
- Do not manually click through cookie banners — the script handles this.

### Authentication & CAPTCHAs
- Claude CANNOT complete login or CAPTCHA flows. The user must authenticate manually first.
- If a page requires login, ask the user to sign in before proceeding.

### Testing Workflow
- Use /guided-test for structured test sessions with documentation.
- After testing each file/page, generate a test report in ./test-reports/.
- Always save the report BEFORE any context compaction occurs.
- When resuming after compaction, read the latest test report first to restore awareness.

### Screenshot Limits
- Full-page tests: 1 screenshot per page (via script)
- Interactive tests: max 3 screenshots per test file
- Never take sequential scroll screenshots

---

## Step 1: Cookie/Popup Dismissal Script

File: C:\Users\aimilios\.claude\scripts\dismiss-popups.js

```javascript
const SELECTORS = [
  // Accept/Agree buttons
  'button:is([class*="accept"], [id*="accept"], [aria-label*="accept"])',
  'button:is([class*="agree"], [id*="agree"], [aria-label*="agree"])',
  'button:is([class*="consent"], [id*="consent"])',
  'button:is([class*="allow"], [id*="allow"])',
  'button:is([class*="dismiss"], [id*="dismiss"])',
  'a:is([class*="accept"], [id*="accept"])',
  'a:is([class*="agree"], [id*="agree"])',

  // Close buttons on modals/banners
  'button:is([class*="close"], [aria-label*="close"], [aria-label*="Close"])',
  '[class*="cookie"] button',
  '[id*="cookie"] button',
  '[class*="banner"] button:is([class*="close"], [class*="accept"])',
  '[class*="consent"] button',
  '[id*="consent"] button',

  // Common cookie consent frameworks
  '#onetrust-accept-btn-handler',           // OneTrust
  '.cc-btn.cc-dismiss',                      // CookieConsent
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', // Cookiebot
  '[data-cookiefirst-action="accept"]',      // CookieFirst
  '.js-cookie-consent-agree',               // Generic
  '#gdpr-cookie-accept',                    // GDPR patterns
  '[data-testid="cookie-policy-dialog-accept-button"]', // TestID patterns

  // Text-based matching (last resort)
  'button',  // Will be filtered by innerText below
];

const TEXT_MATCHES = ['accept', 'agree', 'allow', 'got it', 'ok', 'okay', 'dismiss', 'understand', 'continue'];

function dismissPopups() {
  let dismissed = 0;
  const startTime = Date.now();
  
  while (Date.now() - startTime < 3000) {
    let found = false;
    
    for (const selector of SELECTORS) {
      const elements = document.querySelectorAll(selector);
      
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const text = el.innerText.toLowerCase();
          
          if (TEXT_MATCHES.some(match => text.includes(match))) {
            try {
              el.click();
              dismissed++;
              found = true;
              
              const parent = el.closest('[class*="banner"], [class*="cookie"], [class*="consent"], [role="dialog"], [role="alertdialog"]');
              if (parent) parent.remove();
            } catch (e) {}
          }
        }
      }
    }
    
    if (!found) break;
  }
  
  return `Dismissed ${dismissed} popup(s)`;
}

if (typeof window !== 'undefined') {
  console.log(dismissPopups());
} else {
  module.exports = dismissPopups;
}
```

---

## Step 2: Full-Page Screenshot Script

File: C:\Users\aimilios\.claude\scripts\fullpage-screenshot.js

```javascript
const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');

async function captureFullPage(url) {
  let client;
  
  try {
    client = await CDP();
    const { Page } = client;
    
    if (url) {
      await Page.navigate({ url });
      await Page.loadEventFired();
    }
    
    const { contentSize } = await Page.getLayoutMetrics();
    
    await Page.setDeviceMetricsOverride({
      width: contentSize.width,
      height: contentSize.height,
      deviceScaleFactor: 1,
      mobile: false,
      hasTouch: false,
    });
    
    const screenshot = await Page.captureScreenshot({
      format: 'png',
      captureBeyondViewport: true,
    });
    
    const screenshotDir = path.join(process.env.USERPROFILE, '.claude', 'screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    
    const filename = `screenshot-${Date.now()}.png`;
    const filepath = path.join(screenshotDir, filename);
    
    fs.writeFileSync(filepath, Buffer.from(screenshot.data, 'base64'));
    
    console.log(`Screenshot saved: ${filepath}`);
    return filepath;
    
  } catch (error) {
    console.error('Screenshot failed:', error.message);
    process.exit(1);
  } finally {
    if (client) await client.close();
  }
}

const url = process.argv[process.argv.indexOf('--url') + 1];
captureFullPage(url);
```

Install: `npm install chrome-remote-interface`

---

## Step 3: Custom Slash Commands

### Command 1: /fullpage-test

File: C:\Users\aimilios\.claude\commands\fullpage-test.md

Instructions:
1. Run the dismiss-popups script first via browser evaluate to clear any cookie banners
2. Run the fullpage-screenshot script: `node C:\Users\aimilios\.claude\scripts\fullpage-screenshot.js --url $ARGUMENTS`
3. Read the saved screenshot image from the output path
4. Analyze the screenshot for: layout issues, broken elements, visual inconsistencies, responsive problems
5. Generate a short test report with findings and priority levels

Rules:
- Do NOT use scroll-and-stitch. One screenshot only.
- Do NOT extract HTML from <main> or <body>. If you need HTML, target specific divs only.
- Do NOT use browser_snapshot (accessibility tree) — too many tokens.
- Keep the report concise: max 20 lines.

### Command 2: /guided-test

File: C:\Users\aimilios\.claude\commands\guided-test.md

Instructions:
1. Check context window usage. If above 50%, run compact first.
2. Read the test file at: $ARGUMENTS
3. Run dismiss-popups script before any browser interaction
4. For each test case in the file:
   a. Execute the test steps using Chrome extension tools
   b. Take screenshots ONLY when needed to verify visual state (max 2 per test case)
   c. Log results: PASS/FAIL with brief description
5. After completing all tests, generate a test report at: ./test-reports/<filename>-report.md
6. The report must include: date, file tested, results per test case, console errors, next steps

Rules:
- Do NOT load full page HTML. Only extract specific divs by selector.
- Before each test case, check if context is getting high — compact if needed.
- Always save the report BEFORE compacting so progress isn't lost.
- Max 3 screenshots per test file.

---

## Step 5: Test Report Template

Dir: ./test-reports/ (per project)

Reports generated by /guided-test follow this structure:
- Date and tester info
- File/page tested
- Per-test-case: status (PASS/FAIL), description, screenshot reference if taken
- Console errors detected
- Priority issues (P0/P1/P2)
- What's been tested vs what remains (for compaction recovery)
