---
name: Ecological Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#a43a3a'
  on-tertiary: '#ffffff'
  tertiary-container: '#fc7c78'
  on-tertiary-container: '#711419'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#842225'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  surface-alt: '#F8FAFC'
  pure-white: '#FFFFFF'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
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

## Brand & Style

The design system is rooted in the intersection of environmental sustainability and data-driven precision. It targets eco-conscious enterprises and individual climate advocates who require a professional, trustworthy, and optimistic interface to manage carbon footprints.

The visual style is **Corporate Modern with a Minimalist edge**. It leverages high-quality white space, a focused palette of botanical greens against deep slate, and precise geometric typography. The aesthetic avoids "grungy" eco-stereotypes in favor of a clean, high-tech laboratory feel that communicates reliability and modern environmental science.

## Colors

The palette is dominated by **Emerald Green (#10B981)**, symbolizing growth and ecological health. This is anchored by **Deep Slate (#0F172A)** for high-contrast text and structural elements, ensuring professional authority.

**Slate Gray (#64748B)** is used for secondary information and borders to maintain a soft but technical appearance. The background strategy utilizes **Surface Alt (#F8FAFC)** for subtle section nesting and **Pure White (#FFFFFF)** for primary content cards to create a sense of depth through slight tonal shifts.

## Typography

This design system utilizes **Plus Jakarta Sans** as its primary typeface. It is chosen for its modern, friendly, and geometric characteristics that bridge the gap between "approachable" and "professional."

Headlines use a tighter letter-spacing and heavier weights to create impact, while body text maintains generous line-heights for readability in data-heavy contexts. For specialized data displays or numerical carbon values, a fallback to system monospaced fonts may be used to emphasize technical accuracy.

## Layout & Spacing

The layout follows a **Fluid Grid** system with a maximum container width of 1280px for desktop. It utilizes a 12-column structure on desktop, 8-column on tablet, and a single-column flow on mobile.

Spacing is governed by a 4px base unit. Internal card padding is consistently set at `lg` (24px) to ensure content has breathing room. Section vertical rhythm follows a `3xl` (64px) margin to clearly delineate the narrative flow.

## Elevation & Depth

Depth is primarily established through **Tonal Layers** rather than heavy shadows. The background uses `#F8FAFC`, while interactive or focal containers use `#FFFFFF`.

When elevation is required (e.g., modals or floating buttons), use an **Ambient Shadow**: a very soft, diffused shadow with a subtle tint of the secondary color (`rgba(15, 23, 42, 0.08)`). For most cards and input fields, a **Low-contrast Outline** using a 1px border of `#E2E8F0` (a lighter tint of the neutral color) is preferred over shadows to maintain the minimalist, clean aesthetic.

## Shapes

The shape language is **Rounded**, reflecting the organic nature of the sustainability theme while maintaining architectural order.

Standard components like buttons and inputs use a 0.5rem (8px) radius. Larger containers and cards use `rounded-lg` (16px) to create a softer, more modern framing for content. This consistent rounding across the system softens the precision of the grid and makes the data feel more accessible.

## Components

- **Buttons:** Primary buttons use the Primary Emerald Green with white text and a subtle hover scale effect. Secondary buttons use a Slate outline with a transparent background. All buttons should have a minimum height of 44px for accessibility.
- **Input Fields:** Use a white background with a 1px border of Slate-200. On focus, the border shifts to Emerald Green with a 2px outer glow of the same color at 10% opacity.
- **Cards:** Cards should be white with a 1px border. Avoid heavy shadows; instead, use a subtle vertical offset on hover to indicate interactivity.
- **Chips/Badges:** Use low-saturation backgrounds derived from the primary color (e.g., a 10% opacity green) with high-saturation text for status indicators.
- **Progress Bars:** Representing carbon metrics, these should use the Primary Green for positive/neutral data and a named "Warning Orange" or "Error Red" only for critical carbon overages.
