---
name: Ecological Precision
description: Semantic Design System & UI/UX Intelligence Specification for RekaKarbon Frontend
colors:
  # Primary Brand Identity (12-step Botanical Gradient & Solid Midpoints)
  primary: '#033c2e'
  primary-dark: '#022c22'
  primary-light: '#034a38'
  primary-gradient: 'linear-gradient(to right, #022c22, #022f24, #023126, #023428, #02372a, #02392c, #033c2e, #033f30, #034232, #034434, #034736, #034a38)'
  primary-tint: 'rgba(3, 60, 46, 0.08)'

  # High-Tech Accents & Ecological Indicators
  tech-mint: '#00c48c'
  primary-container: '#10b981'
  on-primary-container: '#00422b'

  # Surfaces, Canvas & Elevation
  surface: '#ffffff'
  surface-alt: '#f8fafc'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'

  # Typography, Hierarchy & Neutral Borders
  on-surface: '#0f172a'
  on-surface-variant: '#64748b'
  text-primary: '#0f172a'
  text-secondary: '#64748b'
  border: '#e2e8f0'
  outline: '#cbd5e1'

  # Semantic Regulatory & Fiscal Alert Tokens
  status-success-bg: '#ecfdf5'
  status-success-fg: '#065f46'
  status-warning-bg: '#fffbeb'
  status-warning-fg: '#92400e'
  status-danger-bg: '#fff1f2'
  status-danger-fg: '#9f1239'
  status-danger-border: '#fecdd3'

  # Alert Semantics
  danger-red: '#ef4444'
  warning-orange: '#f59e0b'
  verified-mint: '#00c48c'

typography:
  font-family: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
  headline-xl:
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-md:
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.025em
  metric-stat:
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px

rounded:
  sm: 0.375rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px

spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  container-max: 1280px
  gutter: 24px
---

# Ecological Precision — Frontend Design System & AI Agent Specification

This specification synthesizes the **Semantic Design System** (following Google Stitch `design-md` conventions) with **UI/UX Design Intelligence** (following `ui-ux-pro-max` industry best practices).

All AI agents and frontend developers implementing screens in **RekaKarbon Client** (`client/`) MUST adhere strictly to these tokens, geometry, accessibility standards, and component patterns.

---

## 🌿 1. Visual Theme & Atmosphere

- **Aesthetic Philosophy**: **Ecological Precision** merges biophilic sustainability with scientific precision and Swiss modernism. The interface communicates high-integrity institutional verification (carbon accounting, dMRV spatial telemetry, blockchain ledger audit trails) without feeling sterile or archaic.
- **Mood & Atmosphere**: _Data-Dense, Trustworthy, Crisp, Optimistic, and Utilitarian_.
- **Surface Strategy**: Rather than relying on muddy, heavy drop shadows, elevation is achieved via **clean tonal layering**:
  - The page canvas rests on **Soft Alpine Slate (`#F8FAFC`)**.
  - Interactive cards and containers emerge in **Crisp Pure White (`#FFFFFF`)** bound by a razor-thin, low-contrast 1px border (`#E2E8F0`).
  - Active overlays, tooltips, and badges utilize **Whisper-Soft Ambient Diffusion** (`rgba(15, 23, 42, 0.06)`).

---

## 🎨 2. Color Palette & Functional Roles

Colors are mapped semantically to avoid raw hex code sprawl in component JSX/TSX.

| Descriptive Name                          | Hex / CSS Class                                   | Functional Role                                                     | UX Guidelines & Contrast                                                             |
| :---------------------------------------- | :------------------------------------------------ | :------------------------------------------------------------------ | :----------------------------------------------------------------------------------- |
| **Deep Botanical Canopy (Primary Solid)** | `#033C2E`<br>`var(--color-primary)`               | Solid headings, active portal links, dark border accents            | High contrast (>7:1 on white). Never substitute with deprecated `#003E29`.           |
| **12-Step Forest Gradient**               | `#022C22` → `#034A38`<br>`.bg-primary-gradient`   | Primary CTA buttons, brand banners, key metric header titles        | Represents depth and living forest density. Paired with white text.                  |
| **Bio-Tech Mint (Accent)**                | `#00C48C`<br>`var(--color-tech-mint)`             | Verified badges, GIS sensor pulse markers, dMRV indicators          | Accent & visual indicator. When used as text, ensure dark background or bold stroke. |
| **Obsidian Slate (Text Primary)**         | `#0F172A`<br>`text-slate-900`                     | Primary page headers, metric figures, table content                 | Highest visual weight (>12:1 contrast ratio against white/surface).                  |
| **Muted Lichen (Text Secondary)**         | `#64748B`<br>`text-slate-500`                     | Explanatory subtext, timestamp notes, table headers                 | Meets WCAG AA (4.5:1 on white). Never use lighter than `#64748B` for body copy.      |
| **High-Carbon Scarlet (Danger/Deficit)**  | `#EF4444`<br>`text-[#EF4444]` / `bg-rose-50`      | Emission quota deficits, fiscal tax liabilities, irreversible burns | Critical alert state. Always pair with descriptive text + icon (never color alone).  |
| **Amber Caution (Warning/Pending)**       | `#F59E0B`<br>`text-[#F59E0B]` / `bg-amber-50`     | Low token supply, pending dMRV audits, reversible alerts            | Warns user of impending limits or required review.                                   |
| **Canopy Mint (Verified Status)**         | `#10B981`<br>`text-emerald-700` / `bg-emerald-50` | Net-zero compliance, validated smart contract notarization          | Indicates successful cryptographic verification.                                     |
| **Soft Alpine Canvas**                    | `#F8FAFC`<br>`bg-slate-50`                        | Global view canvas background                                       | Cool neutral backdrop reducing eye strain during analytical review.                  |
| **Pure White Container**                  | `#FFFFFF`<br>`bg-white`                           | Dashboard metric cards, data tables, modals, sidebars               | Primary foreground container surface.                                                |

---

## 📐 3. Geometry, Shapes & Depth

Technical Tailwind radius classes translated to tactile physical form:

- **Subtly Rounded Precision Cards (`rounded-xl` / `0.75rem` / `12px`)**: Applied to all primary KPI stat containers, data tables, and modal dialogs. Softens institutional geometry while preserving clean vertical alignment.
- **Pill-Shaped Status Badges (`rounded-full`)**: Used for verification tags, network status badges (`Live - Mainnet`), and filter chips.
- **Tactile Interactive Buttons (`rounded-xl` / `12px`)**: Primary and secondary buttons feature smooth corners with a minimum tap target of **44×44px** to satisfy mobile/tablet touch usability.
- **Crisp Focus Rings (`focus-visible:ring-2 focus-visible:ring-primary/20`)**: Keyboard accessibility is strictly enforced; focus rings are never removed with `outline-none` unless accompanied by a high-contrast replacement ring.

---

## 🔤 4. Typography & Visual Hierarchy

- **Typeface**: **`Plus Jakarta Sans`** (primary UI & headings) paired with **`Inter`** (data-dense tables & numerical fallbacks).
- **Scale & Rhythms**:
  - **Metric Hero**: `text-3xl` / `font-extrabold` (36px, tracking tight) for primary carbon tonnage and fiscal amounts.
  - **Section Titles**: `text-xl` or `text-2xl` / `font-bold` (20–24px) with `text-[#033C2E]`.
  - **Body Copy**: `text-sm` (14px) with `leading-relaxed` (line-height 1.5–1.6) in `text-slate-600`.
  - **Captions & Metadata**: `text-xs` (12px) / `font-semibold` with uppercase letter-spacing (`tracking-wider`) for labels and tags.
- **Rule of Numbers**: All currency (IDR), carbon tonnages (tCO₂e), areas (ha), and percentages MUST be formatted via centralized formatters in `src/lib/formatters.ts`. Never display raw unformatted floats.

---

## 🧩 5. Component Construction & UI Hierarchy (`shadcn/ui` First)

When translating feature requirements to components, agents must follow this strict composition hierarchy and CLI conventions:

### CLI & Installation Rule

- When adding new UI primitives from registry, always use:
  ```bash
  pnpm dlx shadcn@latest add <component>
  ```
- Always verify installed components in `@/components/ui/` before introducing new components.

### 1. Primitive Elements (`@/components/ui/`)

- **Buttons (`Button`)**:
  - Primary CTA: `className="bg-primary-gradient text-white hover:bg-primary-gradient-dark shadow-sm min-h-[44px]"`
  - Secondary: `variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 min-h-[44px]"`
  - High-Risk Action (Burn/Offset): `variant="destructive" className="bg-red-600 hover:bg-red-700 text-white min-h-[44px]"`
  - Loading State: Compose with `<Loader2 className="animate-spin size-4" />` and `disabled={isLoading}` (Button does not have an `isLoading` prop).
- **Cards (`Card`)**:
  - Must use full semantic Card composition: `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>`, `<CardFooter>`. Do not dump all markup directly into `<CardContent>`.
- **Structured Tables (`Table`)**:
  - Must use full semantic tree: `<Table>`, `<TableHeader>`, `<TableRow>`, `<TableHead>`, `<TableBody>`, `<TableCell>`.
  - Never replace tabular data with unsemantic `<div className="grid">` elements.
- **Overlays (`Dialog`, `Sheet`, `Drawer`)**:
  - **Mandatory Accessibility Title**: `<DialogTitle>`, `<SheetTitle>`, or `<DrawerTitle>` is strictly required. If visually hidden, apply `className="sr-only"`.
  - **No Manual Z-Index**: Never manually assign `z-50` or `z-[999]` to overlays; primitives manage their own stacking context.
- **Callouts & Skeletons**:
  - Callouts MUST use `<Alert>` and `<AlertDescription>` (never custom-styled colored divs).
  - Loading placeholders MUST use `<Skeleton className="..." />` (never custom `animate-pulse` divs).
  - Dividers MUST use `<Separator />` (never raw `<hr>` or `<div className="border-t">`).
- **Styling Discipline**:
  - **Equal Dimensions**: Always use `size-*` instead of `w-* h-*` (e.g., `size-10`, `size-4`).
  - **Flex Gap**: Always use `flex flex-col gap-4` or `flex gap-2`. Never use legacy `space-y-*` or `space-x-*`.
  - **Class Utilities**: Use `cn()` from `@/lib/utils` for conditional classes; never manual template literal string concatenation.

### 2. Standard Layout Containers (`@/components/layout/`)

- **`PageHeader`**: Consistent title, contextual subtitle, and action button slots.
- **`KpiStatCard`**: Standardized metric presentation with icon, delta indicator, and comparative context.
- **`FilterToolbar`**: Unified search input, role filters, date range picks, and export button slots.
- **`PortalSidebar` & `PortalLayout`**: Multi-role authenticated application frame with role-tailored navigation items.

---

## ♿ 6. Accessibility & Usability Invariants (WCAG 2.1 AA)

1. **Color Independence**: Color MUST NEVER be the sole conveyor of state.
   - Deficit states must show red badge **plus** `AlertTriangle` icon **plus** text `Defisit: 2.330 tCO2e`.
   - Verified status must show mint background **plus** `ShieldCheck` icon **plus** text `Terverifikasi dMRV`.
2. **Accessible Click Targets**: All interactive targets (buttons, icon triggers, table action menus) must be at least **44×44px** in tappable area.
3. **Screen Reader Discipline**: All icon-only buttons (`<button><Eye className="w-4 h-4" /></button>`) MUST include `aria-label="Lihat Detail"` or `<span className="sr-only">Lihat Detail</span>`.
4. **Focus Trapping**: Modals, Dialogs, and Sliding Drawers must trap focus and close cleanly on `Escape` keypress.

---

## ⚡ 7. Micro-Interactions, Motion & Feedback

1. **Context-Aware Timing**:
   - Micro-interactions (hover, active tab, focus ring): **150ms–200ms** with `ease-out`.
   - Drawer slide & sheet transitions: **300ms** with smooth cubic bezier.
   - Exit transitions must be faster than entrance transitions (e.g. 150ms exit vs 200ms enter).
2. **Action Feedback**:
   - Every async mutation button (Beli Token, Bakar Token, Unggah Dokumen) MUST display a disabled spinner state (`<Loader2 className="w-4 h-4 animate-spin" />`) while execution is pending.
3. **Respect Reduced Motion**:
   - Use Tailwind's `motion-safe:` or ensure high-motion effects degrade gracefully when `prefers-reduced-motion` is active.

---

## 🛡️ 8. Error Prevention & High-Risk Protocols (Heuristic #5)

In institutional carbon accounting, accidental state mutations carry financial and legal penalties:

1. **Burning Chamber / Retirement Protocol**:
   - Real-time conversion formula: **`10 fractions = 1.0 tCO2e`**.
   - Irreversible Action: Burning tokens removes them from the circulating supply permanently.
   - UI Requirement: Red/Amber warning styling, secondary confirmation modal, and explicit summary of tonnes to be retired.
2. **Cap Control Market Purchasing**:
   - Emitters must be prevented or explicitly warned from submitting purchase orders exceeding their verified deficit (e.g. 2,330 tCO₂e) to avoid speculative market hoarding.
3. **dMRV Transparency Affordance**:
   - Every metric backed by satellite or drone verification must render a direct link or modal trigger: `Verifikasi Sumber Data dMRV`.
