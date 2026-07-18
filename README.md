# GURO-App

**GURO-App** is a robust, offline-first mobile application built using Expo and React Native. The application has **zero internet dependencies**, designed to operate in completely disconnected environments with high stability.

---

## Tech Stack & Architecture

### 1. Routing & Navigation
*   **Framework:** `@react-navigation/native` & `@react-navigation/native-stack`
*   **Performance:** Backed by native primitives via `react-native-screens` and `react-native-safe-area-context`.

### 2. State Management (Offline Persisted)
*   **Library:** `zustand`
*   **Persistence:** State is persisted to local flash storage using `@react-native-async-storage/async-storage` via the Zustand `persist` middleware, ensuring state is preserved across app terminations.

### 3. File System Storage
*   **Library:** `expo-file-system/legacy`
*   **Access:** Local sandboxed disk operations (write, read, delete, directory listing) are managed through a custom wrapper (`src/services/fileService.ts`).

### 4. Zero Network Constraint
*   Axios, TanStack Query, and other HTTP fetching client libraries are intentionally omitted to enforce absolute local-only operation.

---

## Project Structure

```text
GURO-App/
├── backend/            # Laravel backend server (PostgreSQL sync and SQLite fallback)
└── frontend/           # Frontend workspace
    ├── guro-mobile/    # React Native client app (expo-sqlite local storage)
    └── Guro-Web/       # React/Vite web dashboard for teacher analytics
```

---

## ⚙️ Development Scripts

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

## 🛠 `backend` Directory
The `backend` directory contains the PHP/Laravel API server managing telemetry sync logs, classroom configs, and user accounts. It supports both a local SQLite fallback database and a relational PostgreSQL structure, with Gemini API integration for curriculum generation.
