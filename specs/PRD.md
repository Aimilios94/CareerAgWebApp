# Career Agent Web App - Product Requirements Document

## Product Vision
Career Agent is a web application that helps job seekers find the best job matches, understand their skill gaps, and improve their applications through AI-powered tools.

---

## User Personas

### Primary: Job Seeker (Free Tier)
- Actively looking for new opportunities
- Wants to understand how well they match job requirements
- Needs to track job searches and applications

### Secondary: Power Job Seeker (Pro Tier)
- Applying to many positions
- Wants AI assistance with CVs and cover letters
- Needs interview preparation support

---

## Features

### 1. User Authentication
**Priority:** P0 (Must Have)

| Requirement | Description |
|-------------|-------------|
| Email/Password | Standard signup and login |
| OAuth | Google, LinkedIn, GitHub |
| Password Reset | Email-based recovery |
| Session Management | Persistent login, logout |

### 2. Career Profile (Free)
**Priority:** P0 (Must Have)

| Requirement | Description |
|-------------|-------------|
| CV Upload | PDF/DOCX upload to Supabase Storage |
| CV Parsing | Extract skills, experience, education via OpenAI |
| Skill Extraction | Store individual skills with proficiency levels |
| Vectorization | Generate embedding, store in Pinecone |
| Global Match Score | Average match against market trends |

**User Stories:**
- As a user, I can upload my CV so the system understands my background
- As a user, I can see my extracted skills and edit them if needed
- As a user, I can see my overall match score against current job market

### 3. Job Discovery (Free)
**Priority:** P0 (Must Have)

| Requirement | Description |
|-------------|-------------|
| Search Bar | "What job are you looking for today?" input |
| Real-time Results | Display jobs from Apify scraping |
| Job Cards | Title, Company, Salary, Location, Match Score |
| Filters | Location, salary range, employment type, remote |
| Apply Link | Direct link to job application |

**User Stories:**
- As a user, I can search for jobs by title/keyword
- As a user, I can see my match score for each job
- As a user, I can filter results by my preferences
- As a user, I can click through to apply on the original site

### 4. Search History (Free)
**Priority:** P1 (Should Have)

| Requirement | Description |
|-------------|-------------|
| History Dashboard | View all previous searches |
| Recall Search | Re-run previous search query |
| Match Cards | Display saved jobs with scores |
| Delete History | Clear individual or all history |

**User Stories:**
- As a user, I can see all my previous job searches
- As a user, I can quickly re-run a past search
- As a user, I can delete searches I no longer need

### 5. Skill Gap Analysis (Free)
**Priority:** P0 (Must Have)

| Requirement | Description |
|-------------|-------------|
| Visual Indicators | Red (missing), Yellow (partial), Grey (matched) |
| Interactive Skills | Click skill for improvement tips |
| Match Breakdown | Skill, experience, education scores |
| Gap Summary | List of top skills to acquire |

**User Stories:**
- As a user, I can see exactly which skills I'm missing for a job
- As a user, I can click on a missing skill to get improvement tips
- As a user, I can understand why my match score is what it is

### 6. Suitability Suggestions (Free)
**Priority:** P1 (Should Have)

| Requirement | Description |
|-------------|-------------|
| AI Analysis | Explain match strengths/weaknesses |
| Alternative Jobs | Suggest better-matching roles |
| Score Comparison | Show how other jobs score higher |

**User Stories:**
- As a user, I can see jobs that match me better than my current search
- As a user, I can understand which roles suit my profile best

### 7. Auto-Fix CV (Pro)
**Priority:** P1 (Should Have)

| Requirement | Description |
|-------------|-------------|
| Tailored CV | Generate CV optimized for specific job |
| PDF Output | Downloadable formatted document |
| Highlight Skills | Emphasize matching skills |
| ATS Optimization | Format for applicant tracking systems |

**User Stories:**
- As a Pro user, I can generate a tailored CV for any job
- As a Pro user, I can download the CV as PDF
- As a Pro user, my CV is optimized for ATS systems

### 8. AI Cover Letter (Pro)
**Priority:** P1 (Should Have)

| Requirement | Description |
|-------------|-------------|
| Generated Letter | AI-written cover letter for job |
| Preview Mode | View before saving/copying |
| Edit Capability | Modify the generated content |
| Tone Options | Professional, friendly, formal |

**User Stories:**
- As a Pro user, I can generate a cover letter for any job
- As a Pro user, I can edit the generated letter
- As a Pro user, I can choose the tone of my letter

### 9. Interview Buddy (Pro)
**Priority:** P2 (Nice to Have)

| Requirement | Description |
|-------------|-------------|
| Question Generation | Top 5 interview questions for job |
| Suggested Answers | AI-generated answer guidance |
| Practice Mode | Practice answering questions |
| Tips | General interview tips for the role |

**User Stories:**
- As a Pro user, I can see likely interview questions
- As a Pro user, I can practice answering questions
- As a Pro user, I can get tips on how to answer

### 10. Subscription Management
**Priority:** P0 (Must Have)

| Requirement | Description |
|-------------|-------------|
| Pricing Page | Free vs Pro comparison |
| Stripe Checkout | Secure payment flow |
| Monthly/Annual | Two billing options |
| Customer Portal | Manage subscription |
| Cancellation | Easy cancel flow |

---

## Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Page load < 3s, search results < 5s |
| Availability | 99.9% uptime |
| Security | HTTPS, RLS on all user data, encrypted storage |
| Scalability | Support 10,000 concurrent users |
| Mobile | Fully responsive (375px - 1920px) |
| Accessibility | WCAG 2.1 AA compliance |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| User Signups | 1,000 in first month |
| CV Uploads | 70% of users upload CV |
| Job Searches | 5+ searches per user per week |
| Pro Conversion | 5% free to pro conversion |
| Retention | 40% monthly active users |

---

## Out of Scope (V1)
- Mobile native apps (iOS/Android)
- Job application tracking
- Company reviews
- Salary negotiation tools
- Networking features
- Resume templates library
