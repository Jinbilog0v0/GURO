# GURO-App

GURO-App is a comprehensive educational platform that bridges offline mobile learning with online teacher and parent analytics. It includes a Laravel backend, a React/Vite teacher dashboard, and an offline-first React Native mobile client.

---

## Tech Stack & Architecture

### 1. Routing & Navigation (Mobile)
* **Framework:** `@react-navigation/native` & `@react-navigation/native-stack`
* **Performance:** Native primitives via `react-native-screens` and `react-native-safe-area-context`.

### 2. State Management (Offline Persisted)
* **Library:** `zustand`
* **Persistence:** State is persisted to local flash storage using `@react-native-async-storage/async-storage` via the Zustand `persist` middleware, ensuring state is preserved across app terminations.

### 3. Database & Storage
* **Local Database (Mobile):** Local SQLite storage is utilized to cache lessons, quizzes, and telemetry logs offline.
* **File System Storage:** Local sandboxed disk operations are managed through a custom wrapper (`src/services/fileService.ts`) built on `expo-file-system/legacy`.

### 4. Zero Network Constraint (Mobile Client)
* Offline operations are prioritized; all core lesson reading and quiz tracking run completely offline. Local telemetry logs are synced automatically when an internet connection becomes available.

---

## Key Features

### 1. Curriculum & Lesson Flow
* **Interleaved Checkpoint Questions:** Lessons are presented page-by-page, with active check-in questions (1-3 checkpoint questions per lesson topic) to verify student comprehension before unlocking the main quiz.
* **Dynamic Category & Format Mappings:** Question categories and format styles are dynamically mapped by subject and grade level:
  * **Mathematics:**
    * **Grade 4:** Fractions (with Fraction Builder pie-chart visualization)
    * **Grade 5:** Decimals (with multiple-choice, fill-in-the-blank, matching)
    * **Grade 6:** Algebraic Equations
  * **English:**
    * **Grade 4:** Figures of Speech (with Swipe Card literal vs metaphor classification)
    * **Grade 5:** Reading/Paragraph Comprehension
    * **Grade 6:** Idiomatic Expressions

### 2. Role-Based Portals & Sync
* **Teacher Space:** Manage classroom invitation codes, view telemetry analytics dashboards, review mastery matrices, and build custom lessons/quizzes (either manually or using Gemini AI generation).
* **Parent Space:** Create student accounts securely and monitor real-world learning progression logs.
* **Classroom Pairing & Visibility:** Students enrolled under a teacher only access the subjects active or offered by their teacher. If a subject isn't offered, it is automatically hidden from the student's dashboard.

---

## Project Structure

```text
GURO-App/
├── backend/            # Laravel backend server (PostgreSQL/SQLite sync logs)
└── frontend/           # Frontend workspace
    ├── guro-mobile/    # React Native client app (offline local storage)
    └── Guro-Web/       # React/Vite web dashboard for teacher and parent analytics
```

---

## Development Scripts

To run the application locally:

### 1. Start backend server (Laravel)
```bash
cd backend
composer install
php artisan serve
```

### 2. Start teacher web dashboard
```bash
cd frontend/Guro-Web
npm install
npm run dev
```

### 3. Start Expo mobile client
```bash
cd frontend/guro-mobile
npm install
npx expo start
```

---

## Backend Directory
The `backend` directory contains the PHP/Laravel API server managing telemetry sync logs, classroom configurations, parent-student profile generation, and user accounts. It supports both a local SQLite fallback database and a relational structure, with Gemini API integration for curriculum generation.
