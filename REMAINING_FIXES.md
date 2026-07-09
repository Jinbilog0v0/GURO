# GURO — Remaining Fixes Plan
**Date:** 2026-07-06  
**Scope:** P1–P2 findings from cross-role workflow audit  
**Status:** COMPLETE ✅

---

## Steps

### Step 1 — Auth token in API store calls `[P1]` ✅
**File:** `frontend/guro-mobile/src/store/useAppStore.ts`  
**Fix:** Added `Authorization: Bearer ${get().token}` to `fetchItemBankFromServer` and `syncProgressNow`. Both now send the stored Sanctum token on every classroom fetch and progress sync.

---

### Step 2 — Persist user preferences on cold start `[P1]` ✅
**File:** `frontend/guro-mobile/src/store/useAppStore.ts`  
**Fix:** Added `avatarEmoji`, `speechRate`, `soundEffectsEnabled`, `colorTheme` to the Zustand `partialize` whitelist. These four preferences now survive app restarts.

---

### Step 3 — Android hardware-back guard for all student tabs `[P2]` ✅
**File:** `frontend/guro-mobile/src/navigation/StudentTabNavigator.tsx`  
**Fix:** Added `BackHandler.addEventListener('hardwareBackPress', () => true)` in a `useEffect` at the navigator level. All four tabs (Home, Lessons, Progress, Me) are now protected — hardware back no longer exits to the Login screen.

---

### Step 4 — `loginToCloud` clobbers `studentId` `[P2]` ✅
**File:** `frontend/guro-mobile/src/store/useAppStore.ts`  
**Fix:** Changed `studentId` assignment to `data.studentId ?? data.user.name.replace(...)`. Cloud login now uses the server-issued `studentId` when present, preserving existing parent access codes.

---

### Step 5 — TeacherSettingsScreen remaining Alert.alert calls `[P2]` ✅
**File:** `frontend/guro-mobile/src/screens/TeacherSettingsScreen.tsx`  
**Fix:**  
- `showLogDetailsAlert` → converted to `toast.info(title — desc)` (non-destructive info).  
- Logout confirm dialog → retained as `Alert.alert` (destructive confirmation, correct pattern).

---

### Step 6 — DiagnosticAlerts web threshold `[P2]` ✅
**File:** `frontend/Guro-Web/src/components/teacher/DiagnosticAlerts.tsx`  
**Fix:** Raised threshold from `< 65%` to `< 80%` and updated the heading label. Now consistent with `MASTERY_THRESHOLD = 80` used throughout AssessmentScreen, ProgressScreen, and MasteryMatrix.

---

### Step 7 — `handleSwitchClassroom` skips server verification `[P2]` ✅
**File:** `frontend/guro-mobile/src/screens/TeacherSettingsScreen.tsx`  
**Fix:** Before switching, calls `/api/classroom/verify`. If unreachable → `toast.warning`. If locked (expiresAt in the past) → `toast.warning`. Only switches and sets `classroomStatus('active')` on a valid, live classroom.

---

### Step 8 — Badge unlock uses best-attempt, not average `[P2]` ✅
**File:** `frontend/guro-mobile/src/screens/ParentDashboard.tsx`  
**Fix:** Replaced `Array.some(pct >= 80)` with average accuracy across all attempts for the topic: `avg = sum / count >= 80`. Parents now see badges that reflect sustained mastery, not a single lucky attempt.

---

## Completion Checklist

| Step | Description | Status |
|------|-------------|--------|
| 1 | Auth token in store API calls | ✅ |
| 2 | Persist user preferences | ✅ |
| 3 | Android back guard all tabs | ✅ |
| 4 | loginToCloud studentId fix | ✅ |
| 5 | TeacherSettings Alert cleanup | ✅ |
| 6 | DiagnosticAlerts 65→80% | ✅ |
| 7 | handleSwitchClassroom verify | ✅ |
| 8 | Badge unlock average-based | ✅ |

---

## Test Results (post-fix)
- Mobile (Jest): **77 / 77 passed**
- Web (Vitest): **82 / 82 passed**
- Backend (Pest): **11 / 11 passed**
