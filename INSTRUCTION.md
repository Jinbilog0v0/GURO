# GURO Developer Setup Guide

This guide provides step-by-step instructions for setting up the **GURO** project locally. The application consists of three main components:
1. 📱 **Guro-Mobile**: An offline-first React Native mobile client.
2. 💻 **Guro-Web**: A React/Vite teacher administration dashboard.
3. 🐘 **Backend-Laravel**: A Laravel API server handling authentication, generation (Gemini integration), and telemetry synchronization.

---

## 🛠 Prerequisites

Before starting, ensure you have the following installed on your machine:
* **Node.js** (v18+ recommended) & **npm**
* **PHP** (v8.2+ recommended) & **Composer**
* **PostgreSQL** (v16+ recommended)

---

## 🚀 Step-by-Step Setup

### Step 1: Clone the Repository
Clone the repository and navigate into the project root directory:
```bash
git clone <repository-url>
cd GURO-App
```

---

### Step 2: Database Setup (PostgreSQL)

The project is configured to run a self-contained local PostgreSQL cluster inside the project directory under `pgdata/` to avoid polluting your system-wide installation.

#### Option A: Running the local PostgreSQL cluster (`pgdata/`)
If you want to use the local PostgreSQL cluster setup:
1. **Initialize the data cluster** (only needed once):
   ```bash
   initdb -D pgdata
   ```
2. **Start the database server**:
   ```bash
   pg_ctl -D pgdata -l logfile start
   ```
   *(Note: Alternatively, you can run `postgres -D pgdata` directly).*
3. **Create the database and user** (on port `5433` to prevent conflicts with default PostgreSQL installations):
   ```bash
   createuser -s -p 5433 -h localhost guro_user
   createdb -p 5433 -h localhost -O guro_user guro_db
   ```
4. **Set a password for the database user**:
   Connect using `psql -p 5433 -h localhost -d guro_db` and run:
   ```sql
   ALTER USER guro_user WITH PASSWORD 'secure_password';
   ```

#### Option B: Using standard PostgreSQL or SQLite
If you prefer not to use `pgdata/`, you can use your system's global PostgreSQL instance or switch the connection to **SQLite** by changing the database connection settings in the backend `.env` file (see Step 3).

---

### Step 3: Laravel Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend-laravel
   ```
2. Install Composer dependencies:
   ```bash
   composer install
   ```
3. Create the environment file from the template:
   ```bash
   cp .env.example .env
   ```
4. Generate the application encryption key:
   ```bash
   php artisan key:generate
   ```
5. Open the `.env` file and configure your database settings.
   * **For PostgreSQL (`pgdata` cluster):**
     ```ini
     DB_CONNECTION=pgsql
     DB_HOST=127.0.0.1
     DB_PORT=5433
     DB_DATABASE=guro_db
     DB_USERNAME=guro_user
     DB_PASSWORD=secure_password
     ```
   * **For SQLite (Easiest local fallback):**
     Create an empty file `database/database.sqlite` and update `.env`:
     ```ini
     DB_CONNECTION=sqlite
     ```
6. Add your Gemini API Key in `.env`:
   ```ini
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
7. Run the database migrations:
   ```bash
   php artisan migrate
   ```
8. Start the Laravel development server:
   ```bash
   php artisan serve
   ```
   The backend API will run at `http://localhost:8000`.

---

### Step 4: Web Console Setup (Guro-Web)

1. Navigate to the web frontend directory:
   ```bash
   cd ../frontend/Guro-Web
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The web portal runs at `http://localhost:5173`. Any API requests prefixing `/api` will be proxied automatically to `http://localhost:8000`.

---

### Step 5: Mobile App Setup (Guro-Mobile)

1. Navigate to the mobile frontend directory:
   ```bash
   cd ../guro-mobile
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```

---

## 🧪 Testing & Code Quality

You can verify that your setup is fully functional by running the test suites:

* **Backend tests (Pest):**
  ```bash
  cd backend-laravel
  ./vendor/bin/pest
  ```
* **Web tests & linting (Jest/ESLint):**
  ```bash
  cd frontend/Guro-Web
  npm run test
  npm run lint
  ```
* **Mobile tests (Jest):**
  ```bash
  cd frontend/guro-mobile
  npm run test
  ```
