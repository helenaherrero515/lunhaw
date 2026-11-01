# Lunhaw (Monorepo)

> *"Discover your space. Explore your city. Go greener."*

**Lunhaw** is a public-spaces and green-mobility web application for Metro Manila (NCR), Philippines. It connects urban residents, students, and daily commuters with nearby parks, gardens, municipal libraries, and barangay reading centers while enabling cooler, shaded walking and transit routes.

---

## Non-Negotiable Core Principle: Radical Data Integrity
Lunhaw **never** invents, extrapolates, or hallucinates routes, fares, opening hours, or facility amenities. Every detail displayed across the interface carries one of three explicit labels:
1. **Verified:** Official source + last-verified date.
2. **Estimate:** Derived via transparent mathematical models with a methodology note.
3. **Not available yet:** Explicit omission rather than speculation.

---

## Monorepo Architecture

The repository is organized as a **Turborepo** + **pnpm** monorepo:

```text
lunhaw/
├── apps/
│   └── web/                   # Production Next.js 14 (App Router) web application
│       ├── public/            # Static assets (mascot.png)
│       ├── src/
│       │   ├── app/           # App router: layout.tsx, page.tsx, globals.css, providers.tsx
│       │   ├── components/    # Small, typed, reusable UI components (Header, Hero, Journey, etc.)
│       │   ├── content/       # Single source of truth for all copy (lunhaw-content.ts)
│       │   ├── lib/           # Auth service interface, Supabase client, Zustand store, utils
│       │   ├── scenes/        # React Three Fiber + drei 3D scenes (HeroScene, JourneyScene, etc.)
│       │   └── tests/         # Unit and component tests (Vitest + Testing Library)
│       ├── e2e/               # Playwright end-to-end smoke tests
│       ├── playwright.config.ts
│       └── vitest.config.ts
├── packages/
│   ├── config/
│   │   ├── eslint/            # Shared ESLint configuration
│   │   ├── tailwind/          # Shared Tailwind CSS presets and design tokens
│   │   └── typescript/        # Shared tsconfig bases (base, nextjs, react-library)
│   └── ui/                    # Shared UI primitives, clsx/twMerge utilities
├── docs/                      # Factory Markdown Documentation (FMD) suite
├── .github/workflows/         # GitHub Actions CI workflow
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router) + [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling & Tokens:** [Tailwind CSS](https://tailwindcss.com/) with CSS variables mapping to brand design tokens
- **UI Components:** [Radix UI Primitives](https://www.radix-ui.com/) (Dialog, Tabs, Slot) & [Lucide React](https://lucide.dev/)
- **3D Graphics:** [Three.js](https://threejs.org/) + [React Three Fiber](https://r3f.docs.pmnd.rs/) + [@react-three/drei](https://github.com/pmndrs/drei)
- **Animation & Scrolling:** [GSAP 3](https://gsap.com/) + [ScrollTrigger](https://gsap.com/scrolltrigger/) + [@studio-freight/lenis](https://github.com/darkroomengineering/lenis) smooth scroll
- **Form Management:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation
- **State Management:** [Zustand](https://zustand.docs.pmnd.rs/) (client state) + [TanStack Query v5](https://tanstack.com/query) (server state)
- **Authentication:** [Supabase Auth](https://supabase.com/) abstracted behind an `AuthService` interface with mock fallback for local development
- **Testing:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) + [Playwright](https://playwright.dev/) for E2E
- **Monorepo Tooling:** [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/)

---

## Design Tokens

- **Palette:**
  - Off-White canvas: `#F7F7F0` (`--bg`)
  - Deep text foreground: `#26332D` (`--fg`)
  - Forest Green primary: `#245C43` (`--primary`)
  - Button Green: `#3F8F2E` (`--button-green`)
  - Lime accent: `#98D746` (`--lime`)
  - Mint secondary surface: `#B7F9ED` (`--mint`)
  - Leaf green: `#6B9B72` (`--leaf`)
  - Footer background: `#26332D` (`--foot`)
- **Typography:**
  - Wordmark & display headers: `MedievalSharp` (via `next/font/google`)
  - Interface & body: `Kufam` (via `next/font/google`)
- **Shapes:**
  - Pill buttons: `border-radius: 9999px`
  - Rounded cards: `border-radius: 28px`
  - Lime underline highlight (`.hl`) under key phrases

---

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 10.0.0 (`npm install -g pnpm`)

### Installation
```bash
# Clone repository
git clone https://github.com/helenaherrero515/lunhaw.git
cd lunhaw

# Install dependencies
pnpm install
```

### Environment Variables
Copy the template or create `.env.local` inside `apps/web/`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
*(Note: If Supabase keys are omitted, the app automatically runs in Mock Auth mode with full functionality.)*

### Development Scripts
```bash
# Start development server on http://localhost:3000
pnpm dev

# Build all monorepo packages and apps
pnpm build

# Run Vitest unit & component tests
pnpm test

# Run Playwright end-to-end smoke tests
pnpm test:e2e

# Run ESLint across workspace
pnpm lint
```

---

## Key Features & Page Sections

1. **Header:** Sticky translucent pill navigation with mascot, wordmark, About anchor, and mobile dropdown hamburger.
2. **Hero:** Brand headline, leaf pill badge, interactive 3D Metro Manila diorama with an animated hopping grasshopper mascot, and floating context chips.
3. **Ticker Marquee:** Continuous ribbon with 3 core action phrases.
4. **About ("Why Lunhaw"):** Civic narrative and animated stat counters (17 cities, 3 data tiers, 100% calculation transparency).
5. **Pinned Scroll Journey:** 3-step interactive journey (Discover, Understand, Get there) synchronized with a 3D isometric walking path.
6. **Feature Cards:** 5 modular cards (Explore, Commute, Green Index, Libraries, Saved) with 3D cursor tilt effects.
7. **Green Index Simulator:** Interactive 3D street with tree slider (0 to 12 trees) and presets (Bare street, Some shade, Tree-lined) showing calculated microclimate temperature reduction.
8. **Transparency Grid:** 3 data-integrity cards defining `Verified`, `Estimate`, and `Not available yet`, alongside the mandatory facility schedule disclaimer (`INV-002`).
9. **Interactive Libraries:** 3D reading room with bouncing dropped books and a "Drop the books again" replay trigger.
10. **Final Call to Action:** High-contrast band with quick links to explore or enter area manually.
11. **Footer:** Comprehensive directory links, legal pages, newsletter signup with inline validation, and social links.
12. **Auth Dialog:** Radix accessible dialog (Sign up / Log in tabs, show/hide password, Zod inline validation, mobile bottom-sheet styling, and focus-trapping).

---

## Assumptions & Follow-ups

1. **Tech Stack & Hosting:** Configured for Vercel or containerized Docker deployment on Node.js 20+.
2. **Supabase Integration:** Includes production-ready client setup alongside a seamless `MockAuthService` fallback when credentials are not yet populated.
3. **Performance & 3D Optimization:** All Three.js / R3F scenes are dynamically imported with SSR disabled and lazy-loaded only when approaching viewport.
4. **Reduced Motion:** Fully complies with `prefers-reduced-motion` by disabling 3D animations and infinite marquee loops.
