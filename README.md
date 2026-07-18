# GURO Educational Platform

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

---

## Project Structure

```text
GURO-App/
├── backend/            # Laravel backend API server
└── frontend/           # Frontend client workspace
    ├── guro-mobile/    # React Native client application
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
cd frontend/guro-mobile
npm install
npx expo start
```

---

## Test Suites

Run the test suites in their respective directories:
* **Backend:** `./vendor/bin/pest`
* **Web Portal:** `npm run test`
* **Mobile App:** `npm run test`
