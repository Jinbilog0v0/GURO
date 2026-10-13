# GURO Mobile Build & Production Setup Guide for Antigravity (AGY)

This guide contains the exact steps and instructions for Antigravity (AGY) to configure and build the **GURO Mobile App** (`Guro-Mobile`) on this laptop, pointing to the live production cloud backend.

---

## 🌐 Production Cloud Architecture

- **Live Production URL:** `https://neoguro.app`
- **Backend API Base:** `https://neoguro.app/api`
- **Cloud Database:** PostgreSQL 16 on Azure VM (`20.205.100.21`)
- **Web Admin Portal:** `https://neoguro.app`

---

## 📋 Prompt for Antigravity (AGY) on the Other Laptop

Copy and paste the prompt below into AGY on your other laptop:

```text
Please configure and prepare the GURO mobile app (frontend/Guro-Mobile) for production build:
1. Pull the latest master branch changes from GitHub.
2. In frontend/Guro-Mobile/eas.json, update both 'preview' and 'production' build profiles so that EXPO_PUBLIC_API_URL is set to "https://neoguro.app".
3. In frontend/Guro-Mobile/.env, ensure EXPO_PUBLIC_API_URL=https://neoguro.app.
4. Verify EAS CLI authentication and run the standalone preview APK build: eas build -p android --profile preview.
```

---

## 🛠️ Step-by-Step Technical Details

### 1. Update `frontend/Guro-Mobile/eas.json`
Ensure lines under `preview` and `production` have `https://neoguro.app`:

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://neoguro.app"
      }
    },
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://neoguro.app"
      }
    }
  }
}
```

---

### 2. Update `frontend/Guro-Mobile/.env`
Create or update `frontend/Guro-Mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://neoguro.app
```

---

### 3. Trigger the EAS Cloud Build

Run the following commands in the terminal:

```bash
cd frontend/Guro-Mobile

# Verify who you are logged in as on Expo
npx eas-cli whoami

# Trigger the APK build
npx eas-cli build -p android --profile preview
```

---

## 🧪 Testing Live Credentials on the APK

Once the APK is installed on your physical device, test login with any seeded account:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Teacher** | `teacher@guro.dev` | `Password123` | Approved teacher account |
| **Student** | `student@guro.dev` | `Password123` | Learner profile (`SAMPLE-STUDENT`) |
| **Parent** | `parent@guro.dev` | `Password123` | Linked parent account (`USR-PARENT`) |
| **Admin** | `nealjeanclaro@guro.dev` | `JinBilog0v0` | Full IT Console & AI token controls |

---

## 🔄 Ongoing Deployment Workflow

If you make frontend web or backend changes on the other laptop:
1. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "feat: updates"
   git push origin master
   ```
2. The other machine running `./deploy.sh` will automatically pull, build, and deploy changes to `https://neoguro.app` cleanly via `rsync`.
