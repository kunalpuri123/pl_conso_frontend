# UI Field Guide (Field-by-Field Explanation)

This guide explains each important screen and each field in simple language:
- what the field is
- what to select/upload
- where options come from
- why it is important

## 1. Home Page (`/`)

### Field: `Select a Project`
- Type: dropdown
- Values: dynamic list from `projects` table
- What to do: choose your business project first
- Why important: this controls which markets/sites and files are relevant

### Field: `Select an Automation`
- Type: dropdown
- Fixed values:
  - PL Conso Automation
  - PL Input Automation
  - PDP Conso Automation
  - AE PP Conso Automation
- What to do: choose the workflow you want to run
- Why important: each automation has different required files and backend route

### Button: `Continue`
- Enabled when: project + automation are both selected
- What it does: opens correct automation page

## 1A. Login Page (`/login`)

### Field: `Email ID`
- Type: text/email input
- What to enter: your work email (`@merkle.com` or `@dentsu.com`)
- Why important: platform blocks non-company domains

### Field: `Password`
- Type: password input
- What to enter: your account password
- Why important: required for authentication

### Button: `LOGIN`
- Enabled when: email is valid and password entered
- What it does: signs you in and redirects to Home

### Link: `Don't have an account? Sign up`
- What it does: switches form to Sign Up mode

### Common login error shown on page
- “Only @merkle.com and @dentsu.com emails are allowed”
- Meaning: wrong email domain format

## 1B. Sign Up Page (Login screen in Sign Up mode)

### Field: `Full Name`
- Type: text input
- What to enter: your real full name
- Why important: used for profile display and admin/user identification

### Field: `Email ID`
- Type: email input
- Rule: only `@merkle.com` or `@dentsu.com`

### Field: `Password`
- Type: password input
- Rule: minimum 6 characters

### Button: `CREATE ACCOUNT`
- What it does: creates a new auth user

### Link: `Already have an account? Sign in`
- What it does: switches back to Login mode

## 1C. Header Account Menu (top-right avatar)

### Menu item: `Profile`
- Opens user profile/security page

### Menu item: `Sign out`
- Ends session and returns to login page

## 2. Common Fields in Automation Pages

These fields appear in PL Conso, PL Input, PDP Conso, and PP Conso.

### Field: `Project *`
- Type: dropdown with search
- Source: `projects` table
- Why important: scopes the run to a project

### Field: `Market *` (site)
- Type: dropdown with search
- Source: `sites` table filtered by selected project
- Why important: scopes run to the correct market/site

### Field: `Scope *`
- Type: dropdown
- Source: fixed value per page (example: `PL`, `PDP`, `PP`)
- Why important: backend logic and naming rules depend on scope

### Button: `Run Automation`
- Enabled only when required fields/files are selected
- What it does:
  1. creates a row in `runs`
  2. calls backend start endpoint
- Why important: this is the actual trigger for execution

## 3. PL Conso Page (`/automation/pl-conso`)

### Field: `Crawl Input File`
- Type: upload + dropdown
- Upload target: `input-files` bucket + `input_files` table record
- Dropdown source: `input_files` table (`file_type = CRAWL`)
- Why important: this is one of the primary source files

### Field: `Crawl Input (IP) File`
- Type: dropdown with search
- Source: `crawl-input` storage bucket
- Why important: used as input parameter file for processing

### Field: `Master File`
- Type: dropdown with search
- Source: `masters` storage bucket
- Why important: reference/master data for final output generation

### Note: filename validation
- For non-POC project, crawl file naming is validated in UI
- Why important: prevents wrong file format from starting run

### Output
- Download bucket: `run-outputs`

## 4. PL Input Page (`/automation/pl-input`)

### Field: `Crawl Input File`
- Type: upload + dropdown
- Upload target: `input-creation-bussiness-file`
- Dropdown source: `input-creation-bussiness-file` bucket list
- Why important: source file for PL Input creation flow

### Field: `Crawl Input (IP) File`
- Type: dropdown
- Source: `input-creation-crawl-team-file` bucket
- Why important: supporting crawl-team input for run

### Field: `Master File`
- Type: dropdown
- Source: `input-creation-master` bucket
- Why important: reference data for transformation/output

### Output
- Download bucket: `input-creation-output`

## 5. PDP Conso Page (`/automation/pdp-conso`)

### Field: `PDP Output File *`
- Type: upload + dropdown
- Upload target: `pdp-input` bucket
- Dropdown source: `pdp-input` bucket
- Why important: source output file used as run input

### Field: `PDP Crawl Input File *`
- Type: dropdown
- Source: `pdp-crawl-input` bucket
- Why important: crawl input needed by backend pipeline

### Field: `PDP Master File *`
- Type: dropdown
- Source: `pdp-masters` bucket
- Why important: master/reference data for validation and output

### Output
- Download bucket: `pdp-run-output`

## 6. AE PP Conso Page (`/automation/pp-conso`)

### Field: `Execution Mode *`
- Type: two-state selector
- Values:
  - `Fresh Run`
  - `Revalidation`
- Why important:
  - Fresh Run needs source file
  - Revalidation needs review file

### Field: `AE PP Source File`
- Type: upload + dropdown
- Required when: `Fresh Run`
- Upload target/source bucket: `pp-input`
- Why important: primary source for fresh execution

### Field: `AE PP Review File`
- Type: upload + dropdown
- Required when: `Revalidation`
- Upload target/source bucket: `pp-review-input`
- Why important: corrected review file for re-check runs

### Field: `AE PP Template File`
- Type: dropdown
- Source: `pp-ae-checks` bucket
- Required when: source filename matches template-required patterns
- Why important: template-based validation for selected file sets

### Field: `AE PP Reference File *`
- Type: dropdown
- Source: `pp-reference` bucket
- Why important: static reference data for PP checks

### Output
- Download bucket: `pp-run-output`

## 7. Execution Console (all automation pages)

### Section: `Execution Console`
- Shows live logs for selected run
- Why important: lets user track progress and errors in real-time

### Action: `Enable/Disable Auto-scroll`
- Keeps latest logs visible automatically

### Tabs: `My Runs` / `Team Runs`
- My Runs: your own recent runs
- Team Runs: broader run visibility depending on role/policies

### Run Actions per row
- `Play` icon: view logs for that run
- `Download` icon: download output file
- `Rerun` icon: triggers backend rerun endpoint
- `Cancel`/trash flow: marks run cancelled and informs backend

## 7A. Profile / Settings Page (`/profile`)

This is the closest current equivalent of a user settings page.

### Section: `Personal Information`

#### Field: `Full Name`
- Editable in Edit mode
- Why important: displayed in header, user lists, and audit contexts

#### Field: `Username`
- Editable in Edit mode
- Why important: secondary identity label

#### Field: `Email Address`
- Read-only
- Why important: primary login identity

#### Field: `Member Since`
- Read-only date
- Why important: account metadata

### Buttons in Profile section
- `Edit Profile`: enables editing
- `Save Changes`: saves profile updates
- `Cancel`: discards unsaved edits

### Section: `Security` (Change Password)

#### Field: `New Password`
- Type: password input
- Rule: minimum 6 characters

#### Field: `Confirm Password`
- Type: password input
- Rule: must match new password

### Buttons in Security section
- `Change Password`: applies new password
- `Cancel`: closes dialog without changes

### Notes
- Profile and security are user settings functions.
- If your org refers to “Settings page”, it maps to this screen in current app.

## 7B. Dedicated Settings Page Status
- There is currently no separate `/admin/settings` or `/settings` route in active navigation.
- Settings-related actions are handled through:
  - `/profile` for personal settings
  - admin pages for platform-level controls

## 8. Downloads Page (`/downloads`)

### Field: search box
- Placeholder: `Search file, project, site, user...`
- Why important: quick find by name or owner

### Filter: `All Sites`
- Values: dynamic from downloaded dataset
- Why important: narrow by site/market

### Filter: `All Automation`
- Values:
  - all
  - pl-input
  - pl-conso
  - pdp-conso
  - pp-conso
- Why important: quickly find output from one automation type

### Button: `Clear`
- Resets filters

### Table fields
- Automation, Project, Site, File Name, User, Type, Scope, Generated At
- Why important: gives download traceability

## 9. Admin File Management (`/admin/files`)

### Tab: `Crawl Input Files`
- Upload accepts: `.csv`, `.tsv`, `.xlsx`
- Upload target: `input-files` bucket (+ DB row in `input_files`)
- Why important: controls available crawl files for downstream workflows

### Tab: `Master Files`
- Upload accepts: `.csv`
- Upload target: `masters` bucket
- Why important: central master references used by workflows

### Actions per row
- Download file
- Delete file (crawl tab has active delete)

## 10. Feedback Page (`/feedback`)

### Field: `Subject`
- Dropdown values:
  - Bug Report
  - Feature Request
  - General Feedback
  - Question
  - Other
- Why important: helps triage feedback quickly

### Field: `Message`
- Free text area
- Why important: describes issue/request in detail

### Field: `Attachment (optional)`
- Allowed: images, pdf, doc, docx, txt
- Why important: attach evidence (error screenshot, sample file)

## 11. Why All These Fields Matter (Simple Summary)
- Project + Market + Scope: tell system where run belongs
- Source/Input/Master files: raw data + references for processing
- Execution mode (PP): changes backend behavior
- Run actions: operate lifecycle (monitor, rerun, cancel, download)
- Filters: help find the correct output quickly

## 11A. Quick Map of Pages and Purpose
| Page | Path | Main Purpose |
|---|---|---|
| Login | `/login` | Authenticate user |
| Sign Up | `/login` (toggle mode) | Create new account |
| Home | `/` | Choose project + automation |
| PL Conso | `/automation/pl-conso` | Run PL consolidation workflow |
| PL Input | `/automation/pl-input` | Run PL input creation workflow |
| PDP Conso | `/automation/pdp-conso` | Run PDP workflow |
| AE PP Conso | `/automation/pp-conso` | Run PP workflow |
| Downloads | `/downloads` | Search and download outputs |
| Analytics | `/analytics` | View run metrics |
| Profile/Settings | `/profile` | Edit profile + change password |
| Feedback | `/feedback` | Submit user feedback |

## 12. Screenshot Annotation Option
If you share screenshots (or attach them), I can annotate each one line-by-line:
- mark each field number
- explain what to fill
- show required vs optional
- show common mistakes for that screen

## 13. Run Log Guide (for Each Project/Workflow)

Run logs are shown in the `Execution Console` on each automation page.  
They help you know if the run is progressing, waiting, failed, or completed.

### 13.1 How to Open Logs
1. Go to automation page (`PL Conso`, `PL Input`, `PDP Conso`, or `AE PP Conso`).
2. In `My Runs` or `Team Runs`, find your run row.
3. Click `Play` icon in `Actions`.
4. Logs appear in the center `Execution Console`.

### 13.2 Log Line Format
Typical line format:
- `[HH:mm:ss] [LEVEL] message`

Fields:
- `time`: when event happened
- `LEVEL`: INFO/WARN/ERROR
- `message`: step output from backend processing

Why this is important:
- INFO confirms normal progress
- WARN signals possible data/quality issue
- ERROR usually needs file correction or rerun

### 13.3 Workflow-Specific Log Meaning

#### PL Conso
- Focus: consolidation flow using selected crawl/IP/master files
- Important checks:
  - input file accepted
  - transformation started
  - output generated

#### PL Input
- Focus: input creation pipeline
- Important checks:
  - source file parsed
  - crawl-team and master reference joined
  - final package/zip generated

#### PDP Conso
- Focus: PDP output + crawl input + master processing
- Important checks:
  - PDP output file loaded
  - validation against master completed
  - final output written

#### AE PP Conso
- Focus: fresh or revalidation mode logic
- Important checks:
  - execution mode recognized
  - template requirement handled correctly
  - final output created in PP output bucket

### 13.4 What to Do If Logs Stop
If no new logs for long time:
1. Click refresh icon in runs section.
2. Check run status (pending/running/failed/completed).
3. If status is stuck and no progress:
  - cancel run
  - verify file selections
  - rerun
4. Share latest ERROR line with support/admin.

## 14. Action Tabs Guide (My Runs / Team Runs / Actions)

### 14.1 Tab: `My Runs`
- Shows runs created by you.
- Best for day-to-day execution tracking.
- Importance: personal accountability and quick self-debug.

### 14.2 Tab: `Team Runs`
- Shows broader team history (based on access policy).
- Importance: team visibility, collaboration, and status sharing.

### 14.3 Action Icons in Each Run Row

#### `Play` (View Logs)
- Opens that run in execution console.
- Importance: primary debugging and progress monitoring action.

#### `Download`
- Downloads final output of that run.
- Importance: business deliverable retrieval.

#### `Rerun`
- Calls backend rerun endpoint for that run.
- Use when:
  - transient backend issue
  - fixed input and need reprocessing
- Importance: faster recovery without recreating full setup.

#### `Cancel`
- Marks run as cancelled and notifies backend cancel endpoint.
- Use when:
  - wrong file selected
  - run stuck/irrelevant
- Importance: saves processing time and avoids wrong output usage.

## 15. Downloads Page Guide (Detailed + Importance)

### 15.1 What This Page Is For
Central place to find and download generated files from all automations.

### 15.2 Filters and Fields

#### Search box
- Search by filename/project/site/user.
- Importance: fastest way to find a specific output.

#### Site filter (`All Sites`)
- Shows only selected market/site.
- Importance: avoids downloading wrong market output.

#### Automation filter (`All Automation`)
- Values: PL Input, PL Conso, PDP Conso, AE PP Conso.
- Importance: separates outputs by workflow type.

#### Table columns and why they matter
- `Automation`: identifies generation flow
- `Project`: business context
- `Site`: market context
- `File Name`: exact downloadable artifact
- `User`: who generated it
- `Type`: output type
- `Scope`: run scope
- `Generated At`: freshness/recency check

### 15.3 Safe Download Checklist
Before downloading:
1. Confirm automation type.
2. Confirm project + site.
3. Confirm generated time is recent and expected.
4. Confirm filename pattern looks correct.

Why important:
- prevents wrong output distribution to stakeholders.

## 16. Analytics Page Guide (Detailed + Importance)

Analytics page path:
- `/analytics` (and admin analytics variant under `/admin/analytics`)

### 16.1 KPI Cards

#### `Total Runs`
- Count of runs in selected filter window.
- Importance: workload volume indicator.

#### `Success Rate`
- Percent of completed runs.
- Importance: overall reliability and process quality.

#### `Failed Runs`
- Number of failed runs.
- Importance: highlights operational pain and where fixes are needed.

#### `Avg Duration`
- Average runtime for finished runs.
- Importance: performance trend and capacity planning signal.

### 16.2 Filters

#### Automation filter
- Narrow analytics by workflow type.
- Importance: isolate one pipeline’s health.

#### Date range filter
- Last 24h/7d/30d/90d/custom.
- Importance: trend analysis over meaningful business windows.

#### User filter
- Show runs by specific user.
- Importance: workload ownership and support follow-up.

#### Project filter
- Show runs by project.
- Importance: business-unit level reporting.

### 16.3 Runs Table in Analytics
Typical columns include:
- user
- project/site
- automation
- status
- timing
- optional AI report actions

Importance:
- combines KPI summary with drill-down details for root-cause checks.

### 16.4 Export/Report Actions

#### `Export CSV`
- Downloads analytics rows for offline analysis or sharing.
- Importance: reporting and stakeholder updates.

#### AI report download (where available)
- Downloads run-level report PDF.
- Importance: deeper quality/summary artifact for review.

## 17. Field Importance Summary (One View)
If you remember only this:
1. **Project + Site + Scope** = where run belongs.
2. **Source/IP/Master/Template files** = what run processes.
3. **Run logs + status** = whether run is healthy.
4. **Action icons** = operate lifecycle (view, rerun, cancel, download).
5. **Downloads + analytics filters** = find correct outputs and monitor platform health.
