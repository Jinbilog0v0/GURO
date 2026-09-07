# GURO: GUIDED UNIFIED RESOURCE OPTIMIZATION Educational Platform

GURO is a secure, interactive learning ecosystem designed to bridge offline, gamified learning for primary school students with real-time telemetry analytics for parents and teachers. The platform is structured as a multi-client workspace powered by a Laravel backend API.

---

## Tech Stack & System Architecture

The platform is divided into three primary components:

### 1. Laravel Backend
* **Database Compatibility:** Supports relational configurations (PostgreSQL) and lightweight local environments (SQLite).
* **AI Engine:** Integrated with Google Gemini API to structure custom lesson guides and generate diagnostic question banks.
* **Telemetry Sync:** Manages synchronization endpoints that receive student quiz scores, response paths, progress statistics, and classroom pairing codes.

### 2. Guro-Web Portal
* **Framework:** React, Vite, and CSS.
* **Teacher View:** Allows teachers to manage classrooms, generate custom lessons (manually or via Gemini AI), monitor mastery matrices, and analyze diagnostic alert thresholds.
* **Parent View:** Allows parents to register student accounts, retrieve credentials, and view interactive progress heatmaps.

### 3. Guro-Mobile Client
* **Framework:** Expo and React Native.
* **Offline-First:** Implements offline SQLite databases to cache lessons and track progress without internet dependencies. Telemetry is queued locally and synced when online.
* **State Management:** Zustand state store with AsyncStorage persistence to survive cold restarts.

---

## Key Features & Business Logic

### 1. Parent-Created Student Accounts
* **Restricted Self-Registration:** Direct sign-up is disabled for student roles. To protect young users, student profiles can only be created by authenticated parent accounts.
* **Credentials Auto-Generation:** Parents input basic student information to generate unique access codes. The parent portal auto-populates the telemetry search field with the new student's credentials immediately upon creation.

### 2. Classroom Subject Visibility Rules
* **Teacher-Controlled Offering:** Students enrolled in a teacher's classroom can only view and access subjects actively offered or activated by that teacher (e.g. Mathematics or English).
* **Visibility Filtering:** Off-offered subjects are hidden from the student's dashboard dynamically on both mobile and web clients.

### 3. Paginated Lesson Flow with Checkpoints
* **Refresher Checkpoints:** Rather than showing long, monolithic text blocks, lessons are split into paginated screens.
* **Reading Verification:** Students must complete 1 to 3 short checkpoint questions embedded in the lesson screens. The main quiz remains locked until these checkpoint tasks are completed successfully.

### 4. Grade-Specific Curriculum Mappings
Category dropdown options and interactive question types in the manual lesson builder, editing views, and Gemini AI schema enums adjust dynamically based on the selected Grade Level and Subject:
* **Mathematics Grade 4:** Fractions (uses the Fraction Builder interactive pie-chart slices format).
* **Mathematics Grade 5:** Decimals.
* **Mathematics Grade 6:** Algebraic Equations.
* **English Grade 4:** Figures of Speech (uses the Swipe Card literal-vs-metaphor classification format).
* **English Grade 5:** Reading/Paragraph Comprehension.
* **English Grade 6:** Idiomatic Expressions.

### 5. Adaptive Student Dashboard Layout
* **Layout Grid Optimization:** If a student only has one active subject offered by their teacher, Guro-Web renders the active subject card side-by-side with the statistics panel in a responsive grid. This optimizes space usage and avoids stack stretching.

### 6. Staff & IT Administration Console
* **Discreet Authentication Gateway:** Accessible via a subtle 3-dots button (`•••`) located in the header of the web authentication portal. Toggling switches the interface into the **Staff & IT Console**.
* **Smart Role Auto-Detection:** Logins automatically identify the authenticated user's role from the server, routing `admin` and `developer` users directly to the Admin Console without role mismatch interruptions.
* **Passkey-Gated Admin Registration:** While public registration is limited strictly to Teachers and Parents, administrative accounts require an **Admin Security Passkey** (`admin_secret`), verified against `ADMIN_REGISTRATION_KEY` on the backend.
* **AI Rate Limits & Token Governance:** Real-time configuration of sliding window durations and maximum generation request limits per role (`/api/dev/rate-limits`) to protect against Gemini API quota exhaustion.
* **Master Item Bank Governance:** Real-time tree browser and inspector for global subjects, topics, and question pools that seed all new classrooms.

### 7. DepEd Academic Year & Term/Quarter Structure
* **Philippine Elementary Alignment:** Classes operate under official DepEd elementary School Years (e.g. `2026-2027`) divided into four quarterly terms (`Quarter 1`, `Quarter 2`, `Quarter 3`, `Quarter 4`).
* **Session Configuration:** When generating classroom pairing codes, teachers specify the active School Year and Quarter. All synced telemetry logs automatically inherit this period context.
* **Filtering & Term Breakdowns:** Mastery matrices, student profiles, and progress reports support granular filtering by academic term and assessment type.

### 8. Diagnostic Pre-Test & Summative Post-Test Growth Tracking
* **Diagnostic Baseline:** Before accessing full lesson study guides, learners can take a Diagnostic Pre-Test to evaluate entry-level competence without negative grade penalties.
* **Summative Assessment:** Upon finishing module study checkpoints, learners complete the Summative Post-Test.
* **Comparative Learning Gains:** Evaluates both Absolute Gain ($\Delta\% = \text{Post} - \text{Pre}$) and Hake Normalized Gain ($g = \frac{\text{Post} - \text{Pre}}{100 - \text{Pre}} \times 100$), classifying learner progress into *High Gain* ($g \ge 70\%$), *Medium Gain* ($30\% \le g < 70\%$), *Low Gain* ($0\% \le g < 30\%$), or *Needs Remediation* ($g < 0\%$).

### 9. End-of-School-Year (EOSY) Promotion & SF9 Transcript Console
* **Form 138 / SF9 Standard:** Teachers review cumulative quarterly grades (Q1–Q4), overall General Final Averages, and diagnostic growth per learner in the dedicated EOSY console.
* **Automated Promotional Eligibility:** Evaluates DepEd promotion thresholds ($\ge 75\%$ passing standard) with status indicators:
  - 🟢 **Eligible for Promotion** ($\ge 75\%$)
  - 🟡 **Conditional / Remedial** ($60\% - 74\%$)
  - 🔴 **Retained** ($< 60\%$)
* **Batch Promotion Execution:** Teachers select eligible learners to execute grade-level promotions (e.g. Grade 4 $\to$ Grade 5, Grade 5 $\to$ Grade 6). Promotions automatically archive permanent transcripts into the `student_academic_records` table.
* **Official SF9 Printout:** Teachers can generate and print official School Form 9 (SF9) Learner Progress Reports complete with DepEd header, quarterly grades, pre/post gain summary, and certificate of promotion.

---

## Default Administrative Credentials (Seeded)

For local development and testing, default administrative credentials can be seeded via `php artisan db:seed --class=DeveloperUserSeeder`:
* **Email:** `nealjeanclaro@guro.dev`
* **Password:** `JinBilog0v0`
* **Role:** `developer` / `admin`
* **Default Admin Passkey:** `GURO_ADMIN_SECRET_2026` (configurable via `ADMIN_REGISTRATION_KEY` in `.env`)

---

## Project Structure

```text
GURO-App/
├── backend/            # Laravel backend API server
└── frontend/           # Frontend client workspace
    ├── Guro-Mobile/    # React Native client application
    └── Guro-Web/       # React/Vite teacher and parent administration web portal
```

---

## Development Setup

### 1. Laravel Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### 2. Guro-Web Administration Dashboard
```bash
cd frontend/Guro-Web
npm install
npm run dev
```

### 3. Guro-Mobile Client
```bash
cd frontend/Guro-Mobile
npm install
npx expo start
```

---

## Test Suites

Run the test suites in their respective directories:
* **Backend:** `./vendor/bin/pest`
* **Web Portal:** `npm run test`
* **Mobile App:** `npm run test`
