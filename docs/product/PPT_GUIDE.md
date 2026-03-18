# PPT Guide (Complete User-Manual Deck)

This document gives full, ready-to-use content for the entire presentation.
It is written for non-technical users.

Use this as your script + slide content.

## Slide 1: Introduction to Platform
**Title:** `Welcome to Automation Hub`

**On-slide bullets (3-4 max):**
- One place to run all automation workflows
- Simple flow: select, run, monitor, download
- Built to reduce manual work and confusion

**What to show:**
- Platform logo
- Home page screenshot (clean, no annotations needed)

**Speaker notes:**
- “This platform is our central workspace for running automation.”
- “Instead of using multiple files and disconnected steps, everything is managed here.”

## Slide 2: Importance of Platform
**Title:** `Why This Platform Matters`

**On-slide bullets:**
- One platform for all automation workflows
- Faster execution with fewer manual mistakes
- Easy run tracking and output downloads
- Better visibility for users and teams

**What to show:**
- Simple before/after visual
  - Before: scattered manual steps
  - After: one guided process

**Speaker notes:**
- “The key benefit is standardization. Everyone follows the same process.”
- “This improves speed, quality, and transparency.”

## Slide 3: Login Page
**Title:** `Step 1 – Login to Access Platform`

**What user sees:**
- Email ID field
- Password field
- LOGIN button
- Sign up link

**What to fill:**
- Email ID: company email (`@merkle.com` or `@dentsu.com`)
- Password: account password

**Button action:**
- LOGIN -> opens Home page if credentials are valid

**Common mistakes:**
- Wrong email domain
- Typo in password

**Speaker notes:**
- “Access starts from Login. Only approved company domains are allowed.”

## Slide 4: Sign Up Page
**Title:** `Step 2 (If Needed) – Create Account`

**What user sees:**
- Full Name
- Email ID
- Password
- CREATE ACCOUNT button

**What to fill:**
- Full Name: your real name
- Email: company email only
- Password: minimum 6 characters

**When to use:**
- For first-time users without an account

**Speaker notes:**
- “If self-signup is not available, admin can create your account.”

## Slide 5: Home Page
**Title:** `Step 3 – Select Project and Automation`

**What user sees:**
- `Select a Project` dropdown
- `Select an Automation` dropdown
- `Continue` button

**How to use:**
1. Select Project
2. Select Automation
3. Click Continue

**Why important:**
- This decides which workflow page opens next

**Speaker notes:**
- “Home page is the routing point to all workflows.”

## Slide 5A: Sidebar Navigation Guide
**Title:** `Sidebar – Where to Go in the Platform`

**What to show:**
- Full screenshot of left sidebar with menu expanded
- Highlight `Navigation` and `Admin` sections

**Main navigation items (for all logged-in users):**
- Home
- PL Conso Automation
- PL Input Creation Automation
- PDP Conso Automation
- AE PP Conso Automation
- Downloads
- Feedback
- Analytics

**Admin-only navigation items (visible only for admins):**
- Users
- File Management
- Analytics (Admin)
- Audit Log
- Feedback (Admin)

**How to explain it simply:**
- Sidebar is the platform map.
- Main section = day-to-day user pages.
- Admin section = restricted management pages.

**Why important:**
- Helps users quickly reach the correct page.
- Prevents confusion between normal pages and admin pages.

**Speaker notes:**
- “If a menu item is missing, it usually means your role does not have access.”
- “Use sidebar as your primary navigation instead of manually typing URLs.”
## Slide 6: Automation Options Overview
**Title:** `Available Workflows`

**On-slide list:**
- PL Conso Automation
- PL Input Automation
- PDP Conso Automation
- AE PP Conso Automation

**What to explain:**
- Each workflow has different required input files
- The page layout is similar, so once learned, all are easy to use

## Slide 7: Common Run Configuration Fields
**Title:** `Fields You Will See in Every Workflow`

**Common fields:**
- Project
- Market (Site)
- Scope
- Run Automation button

**Importance of each:**
- Project -> business context
- Market -> location/site context
- Scope -> run type context
- Run button -> starts the process

**Speaker notes:**
- “Think of these as mandatory run identity fields.”

## Slide 8: PL Conso Page Breakdown
**Title:** `PL Conso – What to Select`

**Fields:**
- Crawl Input File (upload/select)
- Crawl Input (IP) File
- Master File

**User action flow:**
1. Fill required fields
2. Upload/select files
3. Click Run Automation

**Why important:**
- Wrong file selection can produce wrong results

**Failure handling flow (add as callout):**
1. If validation/output shows failures, download the report/output file used for review.
2. Check failed rows and failure message details.
3. Correct data based on failure reason.
4. Re-run PL Conso (or rerun action) to recheck.
5. Verify corrected output before final upload/share.

**Speaker notes:**
- “For PL Conso, always inspect failed rows first, fix based on message, then rerun and verify.”

## Slide 9: PL Input Page Breakdown
**Title:** `PL Input – What to Select`

**Fields:**
- Crawl Input File (business file)
- Crawl Input (IP) File
- Master File

**Key message:**
- Similar flow as PL Conso, but different file sources

**Speaker notes:**
- “Always double-check file names before running.”

## Slide 10: PDP Conso Page Breakdown
**Title:** `PDP Conso – What to Select`

**Fields:**
- PDP Output File
- PDP Crawl Input File
- PDP Master File

**Action:**
- Click Run Automation after all required fields are selected

**Why important:**
- PDP pipeline needs all three files for accurate output

**Failure handling flow (add as callout):**
1. Download the generated report/output for failed-run review.
2. Inspect failed rows and exact failure messages.
3. Correct source data according to those messages.
4. Re-run PDP Conso to recheck.
5. Confirm no critical failed rows before final upload/share.

**Speaker notes:**
- “In PDP, correction is message-driven: read failure reason, fix data, rerun, then verify.”

## Slide 11: AE PP Conso Page Breakdown
**Title:** `AE PP Conso – Fresh vs Revalidation`

**Fields:**
- Execution Mode (Fresh Run / Revalidation)
- AE PP Source File
- AE PP Review File
- AE PP Template File (sometimes required)
- AE PP Reference File

**Key guidance:**
- Choose correct execution mode first
- Then fill files according to mode

**Why important:**
- Mode decides which files are mandatory

**Error correction flow (add as callout on this slide):**
1. If run shows errors, download the **AE Check Report**.
2. Review error rows/messages in that report.
3. Correct the source/review data based on report guidance.
4. Upload corrected review file.
5. Switch to `Revalidation` mode and run again.
6. Revalidation generates a **ready-to-upload output file with today’s date** in filename.

**Speaker notes:**
- “AE PP is designed for correction cycles.”
- “Use AE Check Report as the fix list, then revalidate to generate today-dated ready file.”

## Slide 11A: Automation Deep Dive (What + Importance)
**Title:** `What Each Automation Does and Why It Matters`

**On-slide table (recommended):**
- Automation
- What it does
- Main output
- Business importance

**Use these exact talking points:**

### PL Conso
- What it does: consolidates PL-related data from selected input files.
- Main output: PL consolidated file for selected project/site.
- Importance: creates standardized PL output for downstream use and reporting.

### PL Input
- What it does: prepares PL input package from business + crawl-team + master data.
- Main output: structured PL input output package.
- Importance: improves input readiness and reduces manual preparation errors.

### PDP Conso
- What it does: processes PDP output with crawl input and master reference.
- Main output: validated PDP output file.
- Importance: improves PDP data consistency and quality.

### AE PP Conso
- What it does: performs PP checks in Fresh or Revalidation mode.
- Main output: PP final output and check results.
- Importance: supports repeatable PP quality checks and controlled revalidation.

## Slide 12: Run Automation Button and What Happens
**Title:** `What Happens After You Click Run`

**User view:**
- Run appears in run list
- Status changes over time
- Logs start showing in execution console

**Status values:**
- Pending
- Running
- Completed
- Failed
- Cancelled

## Slide 13: Execution Console (Run Logs)
**Title:** `How to Read Run Logs`

**What user sees:**
- Timestamp
- Log level (INFO/WARN/ERROR)
- Message text

**How to use logs:**
- INFO = normal progress
- WARN = attention needed
- ERROR = likely failure reason

**Why important:**
- Fastest way to understand run behavior

## Slide 14: My Runs and Team Runs Tabs
**Title:** `Run History Tabs`

**My Runs tab:**
- Your own run history

**Team Runs tab:**
- Team-level visibility (based on access)

**Why important:**
- Helps track ownership and shared progress

## Slide 15: Actions in Run Table
**Title:** `Run Actions and When to Use Them`

**Actions:**
- View Logs (Play icon)
- Download output
- Rerun
- Cancel

**Use cases:**
- Rerun: transient issue, retry needed
- Cancel: wrong run or no longer needed

## Slide 16: Downloads Page Guide
**Title:** `Downloads – Find the Right Output Fast`

**Filters:**
- Search
- Site
- Automation

**Table helps confirm:**
- file name
- project/site
- user
- generated time

**Best practice:**
- Always verify automation + site + timestamp before download

## Slide 17: Analytics Page Guide
**Title:** `Analytics – Monitor Platform Health`

**Key metrics:**
- Total Runs
- Success Rate
- Failed Runs
- Avg Duration

**Filters available:**
- Date range
- Automation
- Project
- User

**Why important:**
- Helps monitor quality and performance trends

## Slide 17A: AI Report Guide
**Title:** `AI Report – What It Is and How to Use It`

**What it is:**
- A downloadable run-level report (PDF) available from analytics run rows (where generated).

**How user accesses it:**
1. Open Analytics page.
2. Find the required run row.
3. Click AI report download action.
4. Review downloaded PDF.

**What user should look for in report:**
- run summary/context
- key findings/highlights
- warnings or quality flags
- final recommendation/interpretation section (if present)

**Why important:**
- gives fast summary without reading full raw logs
- helps users share run insights with stakeholders

**Good practice:**
- use AI report with run status + output checks
- do not rely on AI report alone if run has errors

## Slide 18: Profile / Settings Page
**Title:** `Profile and Password Management`

**What user can do:**
- Edit full name
- Edit username
- Change password

**Why important:**
- Keeps account info accurate and secure

## Slide 19: Feedback Page
**Title:** `Feedback – Report Issues and Suggestions`

**Fields:**
- Subject dropdown
- Message text
- Optional attachment

**Why important:**
- Direct channel to improve platform and report issues

## Slide 20: Common Errors and Quick Fixes
**Title:** `If Something Goes Wrong`

**Examples:**
- Invalid credentials -> recheck password
- Domain not allowed -> use company email
- Access denied -> check role with admin
- No output found -> verify run completed

**Support checklist:**
- share email, time, screenshot, page URL, steps performed

## Slide 21: Best Practices for Users
**Title:** `Do This Every Time`

**Checklist:**
- Select correct project/site/scope
- Verify file names before run
- Watch logs for errors
- Download only verified output
- Sign out on shared devices

## Slide 22: Final Summary
**Title:** `Key Takeaways`

**On-slide bullets:**
- One platform, one process
- Easy workflow execution and monitoring
- Clear actions: run, track, download, rerun, cancel
- Better visibility and better control

## Slide 23: Q&A
**Title:** `Questions`

**On-slide text:**
- “Thank you. Let’s take questions.”
- “Detailed user guides are available in `/docs/product`.”

---

## 23A. Modular Slide Design (Required)
Keep deck modular with this rule:
- One UI page = one separate slide
- One process = one separate slide
- Do not combine multiple pages/processes in one slide

## 23B. Modular UI Slide List (Use As Separate Slides)
Create one slide each for:
1. Login Page
2. Sign Up Page
3. Sidebar Navigation
4. Home Page
5. PL Conso Page
6. PL Input Page
7. PDP Conso Page
8. AE PP Conso Page
9. My Runs / Team Runs
10. Downloads Page
11. Analytics Page
12. Profile / Settings Page
13. Feedback Page

## 23C. Modular Process Slide List (Use As Separate Slides)
Create one slide each for:
1. Start Run Process
2. Status Lifecycle Process
3. Log Reading Process
4. Run Action Process (View/Download/Rerun/Cancel)
5. PL Conso Error-Correction Process
6. PDP Error-Correction Process
7. AE PP Error-Correction + Revalidation Process
8. Download Verification Process
9. Analytics Review Process
10. AI Report Review Process
11. Escalation/Support Process

## 23D. Reusable Modular Slide Template
Use this exact structure for every UI slide and process slide:

```md
Slide Title: <UI Page Name OR Process Name>

1. Purpose
- Why this page/process exists

2. Step-by-Step
- Step 1
- Step 2
- Step 3

3. Field/Action Meaning
- Name: ...
- Meaning: ...
- Why important: ...

4. Common Mistakes
- ...

5. Quick Fix
- ...
```

## 24. AI-Ready Detailed Content (Use in Generated PPT)
Use this section when prompting AI tools (Gamma, Beautiful.ai, Canva AI, PowerPoint Copilot).
Copy slide text directly from below.

## 24.1 Automation Explanations (Plain Language)

### PL Conso Automation (What it does)
- Purpose: combines and validates PL-related input data into final usable output.
- User outcome: one consolidated output file for selected project/site/scope.
- When to use: when you need PL consolidation from crawl and master references.
- Inputs user selects:
  - project, market, scope
  - crawl input file
  - crawl IP file
  - master file
- Why important for business:
  - standardizes PL outputs
  - reduces rework from manual consolidation
- Error recovery behavior:
  - download report/output review file
  - check failed rows and failure message
  - correct data and rerun before final upload

### PL Input Automation (What it does)
- Purpose: prepares/creates PL input package from business + crawl-team + master files.
- User outcome: generated PL input output package.
- When to use: when upstream PL input needs to be created before further processing.
- Inputs user selects:
  - project, market, scope
  - business/crawl input file
  - crawl-team IP file
  - master file
- Why important for business:
  - improves data readiness
  - lowers input preparation mistakes

### PDP Conso Automation (What it does)
- Purpose: processes PDP outputs using crawl input and master reference.
- User outcome: validated PDP final output.
- When to use: for PDP-specific conso workflow with project/site scope.
- Inputs user selects:
  - project, market, scope
  - PDP output file
  - PDP crawl input file
  - PDP master file
- Why important for business:
  - improves PDP data reliability
  - ensures project/site-level consistency
- Error recovery behavior:
  - download report/output review file
  - review failed rows and failure reason
  - correct and rerun to verify before final upload

### AE PP Conso Automation (What it does)
- Purpose: performs AE PP checks in two modes:
  - Fresh Run: full new processing
  - Revalidation: re-check with corrected review input
- User outcome: PP final output and validation outcome.
- When to use: for AE PP workflows requiring source/review/reference/template files.
- Inputs user selects:
  - project, market, scope
  - execution mode
  - source/review/template/reference files (based on mode/rules)
- Why important for business:
  - supports controlled quality validation
  - enables fast correction via revalidation mode
- Error recovery behavior:
  - run can produce AE check report if issues are found
  - user fixes data using report
  - revalidation run generates today-date ready upload file

## 24.2 Field Meaning Glossary (for UI Slides)

### Project
- Meaning: business account/project context.
- Why required: tells system which project data and rules apply.

### Market (Site)
- Meaning: geography/site under selected project.
- Why required: ensures output belongs to correct market.

### Scope
- Meaning: workflow scope label (PL/PDP/PP).
- Why required: drives run type and processing path.

### Crawl Input File / Source File / Output File (names vary by page)
- Meaning: primary file that contains raw/extracted data to process.
- Why required: run cannot start without core source input.

### IP File (Crawl Input IP / Review Input)
- Meaning: supporting input used during processing/validation.
- Why required: backend uses it to complete transformation or revalidation.

### Master File / Reference File
- Meaning: baseline reference dataset used for matching, validation, or enrichment.
- Why required: keeps output accurate and aligned with expected standards.

### Template File (AE PP Template)
- Meaning: template used in specific PP file patterns.
- Why sometimes required: some source patterns need template-driven checks.

### Execution Mode (AE PP only)
- Meaning:
  - Fresh Run = full new run
  - Revalidation = corrected review-based run
- Why required: decides mandatory fields and processing logic.

### Run Automation button
- Meaning: confirms inputs and starts processing.
- What it triggers: run creation + backend execution request.

## 24.3 Action Icons Meaning (Runs Table)

### Play (View Logs)
- Opens selected run logs in execution console.
- Importance: fastest way to see progress/errors.

### Download
- Downloads final output file for that run.
- Importance: delivers final business file to user.

### Rerun
- Re-triggers the run.
- Importance: recovery option after temporary errors.

### Cancel
- Stops/marks run cancelled.
- Importance: avoids wasting time on wrong or stale runs.

### AE Check Report (when available)
- Download and review detailed error list for AE PP runs.
- Importance: provides exact corrections required before revalidation.

## 24.4 Status Meaning (Use on Run Lifecycle Slide)
- Pending: run created, waiting to start.
- Running: backend is processing.
- Completed: successful output produced.
- Failed: processing ended with error.
- Cancelled: user/admin stopped run.

## 24.4A AE PP Revalidation Message (Use as Verbatim Training Line)
- “If AE PP run has errors, download AE Check Report, fix issues, run Revalidation, and use the newly generated today-date file for upload.”

## 24.4B PL Conso/PDP Correction Message (Use as Verbatim Training Line)
- “For PL Conso and PDP, if run output/report shows failed rows, check failure message, correct data, rerun, and verify clean results before final upload.”

## 24.5 Downloads Page Field Meanings
- Search: find by file/project/site/user text.
- Site filter: narrow to one market.
- Automation filter: narrow to one workflow.
- File Name: actual downloadable artifact.
- Generated At: output freshness timestamp.
- Importance: helps pick the correct file confidently.

## 24.6 Analytics Field Meanings
- Total Runs: number of runs in selected period.
- Success Rate: percentage of completed runs.
- Failed Runs: count of failed runs.
- Avg Duration: average run processing time.
- Importance: shows workflow health, speed, and reliability.

## 24.6B AI Report Field Meaning (for Training)
- Run Summary: quick context of what was executed.
- Observations/Findings: notable points detected during run analysis.
- Warnings/Flags: areas needing attention or manual verification.
- Recommendation/Conclusion: suggested interpretation.

User training message:
- “AI report is a fast review layer, not a replacement for status, logs, and output checks.”

## 24.6A Filters Detailed Guide (Add as Dedicated Slide or Speaker Notes)

Use this section to explain filters in user-friendly language.

### A. Run Configuration Page Search Filters (inside dropdowns)
These appear while selecting files/projects/sites in automation pages.

#### Project search filter
- Where: inside Project dropdown
- What it does: narrows project list by typed text
- Why important: faster selection in large project lists

#### Site/Market search filter
- Where: inside Market dropdown
- What it does: narrows site list for selected project
- Why important: avoids selecting wrong market

#### File search filter
- Where: inside file dropdowns (source/IP/master/template)
- What it does: filters long file lists by filename text
- Why important: helps users find correct file quickly and reduces mistakes

### B. Downloads Page Filters (Detailed)

#### Search filter
- Input placeholder: search file/project/site/user
- Best use: type part of filename or user name
- Importance: fastest way to locate one output file

#### Site filter
- Values: dynamic list of sites in results
- Best use: when you only want one market
- Importance: prevents downloading wrong market output

#### Automation filter
- Values: PL Input, PL Conso, PDP Conso, AE PP Conso, All
- Best use: isolate files from one workflow
- Importance: avoids confusion between similar filenames across automations

#### Clear button
- What it does: resets all filters to default
- Importance: helps users quickly restart search if no results

### C. Analytics Page Filters (Detailed)

#### Automation filter
- Purpose: show metrics for one workflow or all
- Importance: identifies which automation is performing well/poorly

#### Date range filter
- Presets: last 24h/7d/30d/90d/custom
- Importance: trend analysis across short and long windows

#### User filter
- Purpose: show runs for one user or all users
- Importance: ownership tracking and support follow-up

#### Project filter
- Purpose: view metrics for one project
- Importance: project-level reporting and planning

### D. Filter Usage Best Practices (Teach Users)
1. Start broad (`All`) then narrow step-by-step.
2. Use automation filter before typing filename text.
3. For investigations, apply date range first, then user/project.
4. If no results appear, click `Clear` and retry.
5. Before download, confirm automation + site + generated time.

### E. Common Filter Mistakes
- Keeping old filters active and thinking data is missing
- Using wrong automation filter and not finding expected file
- Not resetting date range in analytics

### F. One-Line Teaching Script
- “Filters are your safety tool: they help you find the right run/file/metric and avoid wrong decisions.”

## 24.7 AI Prompt You Can Reuse
Use this exact prompt in your AI slide tool:

```text
Create a non-technical user training PPT for Automation Hub.
Keep language simple and visual.
Slide 1: Introduction to platform.
Slide 2: Why platform is important.
Then explain each UI page step-by-step:
Login, Sign Up, Home, PL Conso, PL Input, PDP Conso, AE PP Conso, Execution Console, My Runs/Team Runs, Run Actions, Downloads, Analytics, Profile, Feedback.
Include one dedicated slide: "What each automation does and why it is important".
Include one dedicated slide: "AI report - what it is, how to download, how to interpret".
For each page include:
- What this page is for
- Each field meaning
- What user should select/upload
- Why that field is important
- Common mistakes
- Quick fix
Use 3-5 bullets per slide and include speaker notes.
```

## Presentation Design Rules (Use for Every Slide)
- Keep language simple.
- Max 5 bullets per slide.
- Use arrows/callouts on screenshots.
- Highlight required fields with `*`.
- Put one key message in slide footer.

## If You Want Me to Build Your Exact Deck
Send:
1. Your target audience (users/admins/mixed)
2. Desired slide count
3. Whether you want speaker notes in long or short format
4. If screenshots will be added by you or should be marked as placeholders
