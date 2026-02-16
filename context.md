# Career Agent Web App - Technical Context

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    Next.js 14 (Vercel)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Dashboard  │  │ Job Details │  │  Pro Tools  │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES                                  │
│  /api/cv/*  │  /api/jobs/*  │  /api/stripe/*  │  /api/webhooks │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐
│ Supabase │  │   n8n    │  │  Stripe  │  │      Pinecone        │
│ (DB/Auth)│  │(Webhooks)│  │(Payments)│  │   (Vector Store)     │
└──────────┘  └────┬─────┘  └──────────┘  └──────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │  Apify (Scrape) │
         │    + OpenAI     │
         └─────────────────┘
```

---

## Data Flow Diagrams

### 1. CV Upload Flow
```
User uploads CV
       │
       ▼
POST /api/cv/upload
       │
       ├──► Supabase Storage (store file)
       │
       ▼
POST /webhook/cv-parse (n8n)
       │
       ├──► Download file from Supabase
       ├──► OpenAI: Extract text & parse
       ├──► Supabase: Save parsed_content to documents
       ├──► Supabase: Upsert user_skills
       │
       ▼
POST /webhook/cv-vectorize (n8n)
       │
       ├──► OpenAI: Generate embedding
       ├──► Pinecone: Upsert vector
       └──► Supabase: Save cv_embeddings reference
```

### 2. Job Search Flow
```
User enters search query
       │
       ▼
POST /api/jobs/search
       │
       ├──► Supabase: Create search_history entry
       │
       ▼
POST /webhook/job-search (n8n)
       │
       ├──► Apify: Trigger LinkedIn/Indeed scraper
       ├──► Wait for completion
       ├──► Transform data to schema
       ├──► Supabase: Upsert jobs + job_skills
       │
       ▼
POST /api/webhooks/n8n (callback)
       │
       ├──► Supabase: Update search_history status
       └──► Return job IDs to frontend
```

### 3. Match Score Calculation
```
User views job detail
       │
       ▼
POST /api/jobs/match
       │
       ├──► Fetch user skills from Supabase
       ├──► Fetch job skills from Supabase
       │
       ▼
Calculate Match Score:
  - Skill overlap (60% weight)
  - Experience match (25% weight)
  - Education match (15% weight)
       │
       ├──► Generate gap_analysis JSON
       ├──► Supabase: Upsert job_matches
       └──► Return match data to frontend
```

### 4. Pro Feature: Cover Letter
```
Pro user clicks "Draft Cover Letter"
       │
       ▼
Check subscription status
       │
       ├──► If not Pro: Show upgrade prompt
       │
       ▼
POST /api/cover-letter/generate
       │
       ├──► Fetch user CV content
       ├──► Fetch job description
       │
       ▼
POST /webhook/generate-cover-letter (n8n)
       │
       ├──► OpenAI: Generate personalized letter
       ├──► Supabase: Save to generated_cover_letters
       └──► Return content to frontend
```

---

## Database Schema Summary

### Core Tables
| Table | Primary Use |
|-------|-------------|
| profiles | User data (name, email, avatar) |
| subscriptions | Stripe subscription status |
| documents | CV/cover letter files |
| cv_embeddings | Pinecone vector references |
| user_skills | Extracted skills from CV |

### Job Tables
| Table | Primary Use |
|-------|-------------|
| jobs | Scraped job listings |
| job_skills | Required skills per job |
| job_matches | User-job match scores |
| job_interactions | Saved/applied/hidden |
| search_history | Query history |

### Pro Feature Tables
| Table | Primary Use |
|-------|-------------|
| generated_cover_letters | AI cover letters |
| interview_prep | Interview questions |

---

## Integration Details

### Supabase
- **Project URL:** Set in `NEXT_PUBLIC_SUPABASE_URL`
- **Auth:** Email/password + OAuth (Google, LinkedIn)
- **Storage:** `documents` bucket for CV files
- **RLS:** All user tables protected by `auth.uid() = user_id`

### n8n Webhooks
| Webhook | Method | Purpose |
|---------|--------|---------|
| /webhook/job-search | POST | Trigger Apify scraping |
| /webhook/cv-parse | POST | Parse uploaded CV |
| /webhook/cv-vectorize | POST | Generate Pinecone embedding |
| /webhook/generate-cv | POST | Create tailored CV (Pro) |
| /webhook/generate-cover-letter | POST | AI cover letter (Pro) |
| /webhook/interview-questions | POST | Interview prep (Pro) |

### Pinecone
- **Index Name:** Set in `PINECONE_INDEX_NAME`
- **Dimension:** 1536 (text-embedding-3-small)
- **Metric:** Cosine similarity
- **Namespace:** `cv-{user_id}`

### Stripe
- **Products:** Career Agent Pro (monthly/annual)
- **Webhook Events:** checkout.session.completed, subscription.deleted, invoice.payment_failed
- **Portal:** Customer self-service for subscription management

### OpenAI
- **CV Parsing:** GPT-4 with structured output
- **Embeddings:** text-embedding-3-small
- **Cover Letters:** GPT-4 with user context
- **Interview Prep:** GPT-4 with job context

---

## Security Considerations

1. **Authentication:** All dashboard routes protected by Supabase Auth middleware
2. **Authorization:** RLS policies ensure users only access their own data
3. **API Security:** Webhook endpoints verify signatures (n8n, Stripe)
4. **File Upload:** Validate file types, size limits, virus scanning
5. **Secrets:** All API keys in environment variables, never in code
6. **CORS:** Configured for production domain only

---

## Performance Considerations

1. **Caching:** React Query for API response caching
2. **Lazy Loading:** Dynamic imports for Pro components
3. **Image Optimization:** Next.js Image component
4. **Database:** Indexes on frequently queried columns
5. **Edge Functions:** Vercel Edge for low-latency responses

---

## Error Handling Strategy

1. **API Errors:** Consistent JSON error format with status codes
2. **Frontend:** Error boundaries + toast notifications
3. **n8n Failures:** Retry logic + error notifications
4. **Payment Errors:** Graceful degradation to free tier
5. **Logging:** Structured logs for debugging
