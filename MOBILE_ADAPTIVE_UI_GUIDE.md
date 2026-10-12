# GURO Adaptive Mobile UI/UX Implementation Guide
## Platform-Specific Architecture for iOS (HIG) & Android (Material Design 3)

This document serves as the comprehensive implementation reference for developing and maintaining platform-adaptive UI/UX across GURO web applications (`Guro-Web`). It captures the design tokens, component behaviors, detection patterns, and styling rules established on the landing page.

---

## 1. Platform Detection Strategy

Adaptive styling is determined at runtime via the client user agent and touch capabilities:

```typescript
// src/pages/SystemOverviewPage.tsx or reusable hook usePlatform()
const [isIOS, setIsIOS] = useState(false);

useEffect(() => {
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent || '';
    const isApple = 
      /iPad|iPhone|iPod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isApple);
  }
}, []);
```

> **Rule:** Never hardcode styles for iOS or Android without fallback for desktop. Use responsive prefixes (`md:`, `lg:`) in combination with `isIOS` flags.

---

## 2. Design System & Surface Philosophy

| Design Dimension | 🍎 iOS (Human Interface Guidelines) | 🤖 Android (Material Design 3 / M3) |
| :--- | :--- | :--- |
| **Surface Style** | Frosted Glass / Translucent (`backdrop-blur-xl`, `backdrop-blur-2xl`) | Solid Opaque Surface (`bg-[var(--bg-card)]`), zero blur |
| **Borders & Rings** | Thin border + inner glow ring (`ring-1 ring-inset ring-white/10`) | Subtle neutral stroke (`border-[var(--border-color)]`), no ring |
| **Shadows & Elevation** | Diffused ambient drop shadow (`shadow-2xl shadow-black/25`) | Upward elevation with tonal separation (`shadow-[0_-4px_16px_rgba(0,0,0,0.10)]`) |
| **Active Tab Indicator** | Pure color tint (`#11428E` / `sky-400`), no container background | Tonal Pill Container (`px-3.5 py-1 rounded-full bg-[#11428E]/12`) + `scale-105` icon |
| **Touch Feedback** | Spring compression (`active:scale-90`) | Subtle compression + ripple highlight (`active:scale-95 active:bg-[var(--border-color)]/30`) |
| **Typography Weight** | Heavy active labels (`font-black`) | Medium-bold active labels (`font-bold`) |

---

## 3. Component Architecture & Patterns

### 3.1 Top Navigation Bar (Header)

The top header adapts its surface treatment depending on the operating system:

```tsx
<header
  className={`sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all duration-200 ${
    isIOS
      ? 'bg-[var(--bg-card)]/70 backdrop-blur-xl border-b border-[var(--border-color)]/60 shadow-[0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-inset ring-white/5'
      : 'bg-[var(--bg-card)] border-b border-[var(--border-color)] shadow-sm'
  }`}
>
  {/* Logo & Brand */}
  <div className="flex items-center gap-3">...</div>

  {/* Desktop Navigation Links (hidden on phone) */}
  <div className="hidden md:flex ...">...</div>

  {/* Mobile Menu Action Sheet Trigger */}
  <div className="flex md:hidden items-center gap-2">
    <button
      className={`p-2 rounded-xl transition-all cursor-pointer ${
        isIOS
          ? 'border border-[var(--border-color)] bg-[var(--bg-main)]/60 hover:bg-[var(--bg-card)] text-[var(--text-muted)] active:scale-90'
          : 'bg-[var(--bg-card)] hover:bg-[var(--border-color)]/40 text-[var(--text-main)] shadow-sm border border-[var(--border-color)] active:scale-95'
      }`}
    >
      <Menu className="size-5" />
    </button>
  </div>
</header>
```

---

### 3.2 Floating Bottom Navigation Bar

Instead of an edge-to-edge bar, both platforms utilize a **floating pill container** centered horizontally, with platform-specific surfacing:

```tsx
<nav
  aria-label="Mobile bottom navigation"
  data-testid="mobile-bottom-navigation"
  className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center"
  style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}
>
  <div
    className={`flex items-center justify-around px-2 pt-2 pb-1.5 mx-4 w-full max-w-sm rounded-2xl border transition-all duration-200 ${
      isIOS
        ? 'bg-[var(--bg-card)]/75 backdrop-blur-2xl border-[var(--border-color)]/50 shadow-2xl shadow-black/25 ring-1 ring-inset ring-white/10'
        : 'bg-white dark:bg-[#0d1322] border-[var(--border-color)] shadow-[0_8px_30px_rgba(0,0,0,0.30)]'
    }`}
  >
    {NAV_SECTIONS.map((sec) => {
      const isActive = activeNavSection === sec.id;
      const Icon = sec.icon;
      return (
        <button
          key={sec.id}
          onClick={() => handleNavClick(sec.id)}
          className={`flex flex-col items-center justify-center flex-1 py-0.5 rounded-xl transition-all duration-150 cursor-pointer ${
            isIOS
              ? 'active:scale-90'
              : 'active:scale-95 active:bg-[var(--border-color)]/30'
          }`}
        >
          {/* Active Tab Icon Container */}
          <div
            className={`flex items-center justify-center transition-all duration-200 ${
              isIOS
                ? isActive
                  ? 'text-[#11428E] dark:text-sky-400'
                  : 'text-[var(--text-muted)]'
                : isActive
                  ? 'px-3.5 py-1 rounded-full bg-[#11428E]/12 text-[#11428E] dark:text-sky-300'
                  : 'px-3.5 py-1 rounded-full text-[var(--text-muted)]'
            }`}
          >
            <Icon className={`size-4.5 ${isActive && !isIOS ? 'scale-105' : ''}`} />
          </div>

          {/* Tab Label */}
          <span
            className={`text-[10px] tracking-tight mt-0.5 transition-colors ${
              isActive
                ? isIOS
                  ? 'font-black text-[#11428E] dark:text-sky-400'
                  : 'font-bold text-[#11428E] dark:text-sky-400'
                : 'font-semibold text-[var(--text-muted)]'
            }`}
          >
            {sec.shortLabel || sec.label}
          </span>
        </button>
      );
    })}
  </div>
</nav>
```

#### Safe Area Insets (Critical for iOS)
- Always use `env(safe-area-inset-bottom, 0.75rem)` in the parent `<nav>` container.
- Ensures the floating pill clears the iPhone home indicator line while maintaining uniform bottom margins on Android.
- Page footers must include `pb-28 md:pb-8` to ensure that content scrolled to the bottom is not blocked by the floating navigation bar.

---

### 3.3 Quick Actions Mobile Sheet (Top-Right Drawer)

When the hamburger icon is tapped on mobile, quick actions (Theme Toggle, Download APK, Sign In) open in an adaptive floating card:

- **Backdrop:** `fixed inset-0 z-40 bg-black/40 backdrop-blur-xs`
- **iOS Card:** `bg-[var(--bg-card)]/90 backdrop-blur-2xl border-[var(--border-color)]/80 ring-1 ring-white/10`
- **Android Card:** `bg-[var(--bg-card)] border-[var(--border-color)] shadow-[0_12px_32px_rgba(0,0,0,0.18)]`

---

## 4. Single-Screen Viewport Fitting & Vertical Rhythm

### 4.1 Section Height Calculation
To guarantee that the hero banner fits on a single mobile viewport without vertical scrolling:

```tsx
<section
  id="overview"
  className="relative px-4 sm:px-8 py-2 md:py-16 min-h-[calc(100dvh-7.5rem)] md:min-h-[calc(100vh-3.5rem)] max-w-6xl mx-auto w-full flex flex-col items-center justify-between md:justify-center text-center overflow-x-clip"
>
```
- `min-h-[calc(100dvh-7.5rem)]`: Ensures the section fills 100% of the mobile viewport on phones (e.g. iPhone 16) while gracefully expanding on shorter windows/DevTools instead of vertically clipping content.
- `overflow-x-clip`: Prevents horizontal overflow from ambient glow effects without clipping vertical elements.


### 4.2 Content Breathing Room
```tsx
<div className="flex-1 w-full min-h-0 flex flex-col items-center justify-center gap-4 sm:gap-6 py-4 sm:py-0">
  {/* 1. Badge */}
  {/* 2. Headline */}
  {/* 3. Scope Chips (Wrapped in mt-2 mb-2 for distinct grouping) */}
  {/* 4. Subtitle paragraph */}
  {/* 5. Action Buttons (Explore Showcase & Download APK) */}
</div>
```
- **Chips Wrapper:** Add `mt-2 mb-2` around the subject and grade chips to visually separate them from both the headline above and the descriptive paragraph below.

---

## 5. Continuous Moving Marquee Ticker

The metrics ticker runs continuously without blocking vertical space:

### 5.1 CSS Keyframes (`src/index.css`)
```css
/* Standard marquee (scrolls left) */
@keyframes hero-marquee {
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-50%, 0, 0); }
}

/* Reverse marquee (scrolls right) */
@keyframes hero-marquee-reverse {
  0% { transform: translate3d(-50%, 0, 0); }
  100% { transform: translate3d(0, 0, 0); }
}

/* Mobile Track (24s) */
.hero-marquee-track {
  display: flex;
  width: max-content;
  animation: hero-marquee 24s linear infinite;
  will-change: transform;
}

/* Desktop Track (36s left / 40s right) */
.hero-marquee-track-desktop-reverse {
  display: flex;
  width: max-content;
  animation: hero-marquee-reverse 40s linear infinite;
  will-change: transform;
}

/* Hover/Touch Pause */
.hero-marquee-track:hover,
.hero-marquee-track:active,
.hero-marquee-track-desktop-reverse:hover,
.hero-marquee-track-desktop-reverse:active {
  animation-play-state: paused;
}
```

### 5.2 Implementation Checklist
- **Mobile Clearance:** Marquee must have `mb-3` to avoid touching or overlapping the floating bottom nav.
- **Fade Masks:**
  - Mobile: `maskImage: linear-gradient(to right, transparent 0%, black 14px, black calc(100% - 14px), transparent 100%)`
  - Desktop: `maskImage: linear-gradient(to right, transparent 0%, black 80px, black calc(100% - 80px), transparent 100%)`
- **Data Duplication:**
  - Mobile: `[...HERO_METRICS, ...HERO_METRICS]` (2x)
  - Desktop: `[...HERO_METRICS, ...HERO_METRICS, ...HERO_METRICS]` (3x) for seamless ultrawide looping.

---

## 6. How to Apply to Other Pages (e.g., Student, Teacher, Parent)

When creating new mobile spaces or dashboards:

1. **Import `isIOS` detection** into your view or shared layout wrapper.
2. **Use Frosted Glass for iOS Dialogs / Modals:**
   `bg-[var(--bg-card)]/80 backdrop-blur-2xl ring-1 ring-white/10`
3. **Use Solid Elevation for Android Dialogs / Modals:**
   `bg-[var(--bg-card)] shadow-[0_8px_28px_rgba(0,0,0,0.2)] border border-[var(--border-color)]`
4. **Bottom Actions / FABs:**
   Always append `pb-[max(1rem,env(safe-area-inset-bottom,1rem))]` to bottom-pinned actions.
5. **Interactive Controls:**
   - On iOS: `active:scale-95` or `active:scale-90`.
   - On Android: `active:scale-98 active:bg-white/5` (tonal feedback).

---

## 7. Mobile App Showcase Edge-to-Edge Pattern

When displaying interactive phone mockups or simulations on actual mobile devices:

- **Full Viewport Sizing:** The workspace container uses `h-[calc(100dvh-3.5rem)]` and `p-0` on mobile, eliminating all outer margins.
- **Edge-to-Edge Device Frame:** On mobile screens (`< md`), the phone chassis container sheds its bezel (`rounded-none md:rounded-[50px] p-0 md:p-3.5 border-0 md:border-4`). The inner screen expands to fill 100% of the display, delivering an authentic native app experience.
- **Desktop Bezel Preservation:** On screens `md:` and wider, the physical smartphone frame remains intact with Dynamic Island, speaker slit, and outer chassis shadow.
- **Compact Quick-Action Dropdown:** Mobile menu actions are housed in a floating top-right dropdown occupying only 40%–50% of the screen width (`w-[50%] min-w-[170px] max-w-[210px] fixed top-14 right-3`), keeping the interface lightweight.

