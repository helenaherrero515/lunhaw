# Design System / UX Spec — Lunhaw

> **Purpose:** Design principles, design tokens, component standards, typography, accessibility specifications, and UI voice guidelines for Lunhaw across Web and Mobile.
> Traces back to: [context.md](context.md), [prd.md](prd.md). Traces forward to: [api-spec.md](api-spec.md), [qa-test-plan.md](qa-test-plan.md).

## Design principles

1. **Civic Warmth & Calm:** Public spaces should feel open, inviting, and free of commercial clutter. Visuals use lush organic tones inspired by nature and community.
2. **Radical Data Honesty:** Never hide estimates or pretend an approximation is verified fact. The user's trust is sacred; badges clearly state when data is estimated or unavailable.
3. **Heat & Sunlight Legibility:** High contrast ratios designed for commuters reading screens under harsh outdoor sunlight in Metro Manila.
4. **Platform Neutrality:** Core components, iconographic semantics, and layouts adapt smoothly between desktop web, mobile web, and native mobile apps.

## Tokens

### 1. Color Palette

```
+-----------------------------------------------------------------+
|  Forest Green: #245C43  |  Lime: #98D746   |  Mint: #B7F9ED     |
|  Primary Brand Anchor   |  Vibrant Accent  |  Secondary Surface |
+-----------------------------------------------------------------+
|  Off-White: #F7F7F0     |  Deep Slate: #1E293B  | White: #FFFFFF|
|  Canvas Background      |  Primary Text Body    | Card Fills    |
+-----------------------------------------------------------------+
```

| Token Name | Hex Value | Semantic Usage |
|---|---|---|
| `--color-brand-forest` | `#245C43` | Primary brand anchor, header titles, primary action buttons, dark borders. |
| `--color-brand-lime` | `#98D746` | Brand accent, active toggles, highlighted map pins, progress meters. |
| `--color-brand-mint` | `#B7F9ED` | Secondary card backgrounds, subtle highlight boxes, hover states. |
| `--color-brand-offwhite` | `#F7F7F0` | Main application background canvas, neutral container fills. |
| `--color-text-main` | `#1E293B` | Primary reading copy, high contrast (meets WCAG AAA). |
| `--color-text-muted` | `#64748B` | Secondary notes, timestamps, calculation explanations. |

#### Data-Integrity Tri-State Tokens (`INV-001`)
| State Badge | Background Hex | Text Hex | Icon / Label |
|---|---|---|---|
| **Verified** | `#DCFCE7` (Light green) | `#166534` (Deep forest) | Checkmark: `"Verified (Source, Date)"` |
| **Estimate** | `#FEF3C7` (Soft amber) | `#92400E` (Deep amber) | Info circle: `"Estimate (Method Note)"` |
| **Not available yet** | `#F1F5F9` (Slate grey) | `#475569` (Dark slate) | Dash circle: `"Not available yet"` |

### 2. Typography

| Role | Font Family | Weights | Usage |
|---|---|---|---|
| **Wordmark & Display** | `MedievalSharp`, cursive / display serif | Regular (400) | Brand logo, splash headers, hero titles. Distinctive civic identity. |
| **UI & Body** | `Kufam`, sans-serif | Regular (400), Medium (500), SemiBold (600), Bold (700) | Navigation items, body copy, facility details, buttons, data tables. |

### 3. Spacing & Elevation
- **Spacing Units:** 4px baseline (`--space-1: 4px`, `--space-2: 8px`, `--space-4: 16px`, `--space-6: 24px`, `--space-8: 32px`).
- **Border Radius:** Soft modern curves (`--radius-sm: 6px`, `--radius-md: 12px`, `--radius-lg: 20px`, `--radius-full: 9999px`).
- **Shadows:** Subtle natural elevations (`--shadow-card: 0 2px 8px rgba(36, 92, 67, 0.08)`).

## Component inventory

1. **`FacilityCard`:** Displays name, category pill, distance, Green Index score, and key amenities (Wi-Fi, AC, Power).
2. **`VerificationBadge`:** Tri-state pill rendering `Verified`, `Estimate`, or `Not available yet` with hoverable source details.
3. **`FacilityDisclaimerBanner`:** Persistent warning banner advising users to confirm with the venue before traveling (`INV-002`).
4. **`GreenIndexPill`:** Leaf icon with numerical score (0–100) and color ramp (Mint &rarr; Lime &rarr; Forest Green).
5. **`RouteStepCard`:** Step-by-step commute direction card displaying walking segments, transit lines, transfer nodes, and shade indicators.
6. **`LGUSelectorModal`:** Manual City & Barangay picker for users without GPS.
7. **`GrasshopperMascotIllustration`:** Friendly mascot graphic appearing in empty states, error fallbacks, and onboarding.

## UI voice & copy rules (enforced, not optional)

### Banned Copy (Enforced by Invariants)
- **Never use:** `"Guaranteed open"`, `"100% verified schedule"`, or `"Always available"`.
  - *Breaches:* **`INV-001`** (Civic schedules are subject to local barangay closures).
  - *Required alternative:* `"Verified by [LGU Name] on [Date]"` or `"Schedule unconfirmed — call ahead"`.
- **Never omit:** The facility check disclaimer on any public reading center or library view.
  - *Breaches:* **`INV-002`**.
  - *Mandatory copy:* *"Please verify operating hours directly with the facility before traveling, as barangay schedules may change without notice."*
- **Never use:** `"Safe path"` or `"Safe zone"`.
  - *Breaches:* Safety overclaim.
  - *Required alternative:* `"Shaded green pathway"` or `"Pedestrian pathway"`.

## Accessibility standards (WCAG 2.1 AA)
- **Contrast:** All body text in `Kufam` over `#F7F7F0` or `#FFFFFF` exceeds a 4.5:1 contrast ratio.
- **Color Independence:** Verification badges and Green Index indicators always pair color with explicit text labels and semantic icons.
- **Touch Targets:** Minimum interactive target area is 44×44px on all touch devices.
- **Keyboard Navigation:** Full tab-order navigation and visible focus rings (`#245C43` 2px outline) across all search inputs and filter pills.

## Key screen specs

### 1. Explore & Map View
- Sticky header with Lunhaw wordmark in `MedievalSharp` and search bar.
- Horizontal scrollable category pills: `All`, `Parks & Gardens`, `Libraries & Reading Centers`, `Civic Plazas`.
- Split view (desktop) / bottom sheet (mobile): interactive map with green cluster pins and responsive list of `FacilityCard`s.

### 2. Facility Profile View
- Facility title, verified badge, and community address.
- Persistent `FacilityDisclaimerBanner` (`INV-002`).
- Operating hours grid showing current open/closed status.
- Amenity chips: `[Power Outlets: Available]`, `[Wi-Fi: Free]`, `[AC: Yes]`, `[Access: Valid ID Required]`.
- Action buttons: `"Save Place"`, `"Get Directions"`.
