---
name: PatternNest
colors:
  surface: '#f4fafd'
  surface-dim: '#d4dbdd'
  surface-bright: '#f4fafd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef5f7'
  surface-container: '#e8eff1'
  surface-container-high: '#e2e9ec'
  surface-container-highest: '#dde4e6'
  on-surface: '#161d1f'
  on-surface-variant: '#584143'
  inverse-surface: '#2b3234'
  inverse-on-surface: '#ebf2f4'
  outline: '#8b7072'
  outline-variant: '#dfbfc1'
  surface-tint: '#ad2d47'
  primary: '#ad2d47'
  on-primary: '#ffffff'
  primary-container: '#ff6b81'
  on-primary-container: '#6e0021'
  inverse-primary: '#ffb2b9'
  secondary: '#75565f'
  on-secondary: '#ffffff'
  secondary-container: '#fed5df'
  on-secondary-container: '#795a63'
  tertiary: '#006970'
  on-tertiary: '#ffffff'
  tertiary-container: '#4fa9b2'
  on-tertiary-container: '#003a3f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdadc'
  primary-fixed-dim: '#ffb2b9'
  on-primary-fixed: '#400010'
  on-primary-fixed-variant: '#8c1231'
  secondary-fixed: '#ffd9e2'
  secondary-fixed-dim: '#e4bcc6'
  on-secondary-fixed: '#2b151c'
  on-secondary-fixed-variant: '#5b3f47'
  tertiary-fixed: '#99f1fa'
  tertiary-fixed-dim: '#7cd4dd'
  on-tertiary-fixed: '#002022'
  on-tertiary-fixed-variant: '#004f55'
  background: '#f4fafd'
  on-background: '#161d1f'
  surface-variant: '#dde4e6'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is crafted to evoke a sense of playful creativity balanced with professional utility. Targeting a demographic of hobbyists, digital creators, and educators, the visual language bridges the gap between a high-end SaaS tool and a cozy crafting corner. 

The aesthetic is heavily influenced by modern **Minimalism** with a **Tactile** twist. It utilizes expansive whitespace and a "Pinterest-inspired" layout to prioritize visual inspiration. The emotional goal is to make the complex process of AI pattern generation feel approachable, bright, and delightful. Every interaction should feel soft and forgiving, mimicking the physical satisfaction of placing beads on a pegboard.

## Colors

The palette is anchored by a vibrant yet soft primary red-pink, used for key actions and brand presence. The secondary pink provides a gentle background for containers and tags, while the soft teal accent is reserved for "success" states, AI-specific features, and highlights.

- **Primary (#FF6B81):** Vitality and creativity. Used for primary buttons and active states.
- **Secondary (#FFD6E0):** Softness and warmth. Used for subtle backgrounds and hover states.
- **Accent (#7ED6DF):** Freshness and clarity. Used for AI tooltips and progress indicators.
- **Background (#FFFDFB):** A warm off-white that reduces eye strain compared to pure white.
- **Text (#2D3436):** Deep charcoal for high legibility without the harshness of true black.

## Typography

This design system uses a dual-font strategy to balance personality with readability. 

**Quicksand** is used for all headings. Its rounded terminals mirror the circular nature of Perler beads, reinforcing the brand's core subject matter. Use **Bold (700)** weight for headlines to ensure they feel substantial and friendly.

**Inter** is used for all body copy, UI labels, and data. Its neutral, systematic nature ensures that pattern instructions and technical settings remain highly legible at smaller sizes.

Keep line heights generous (1.5x for body) to maintain the airy, minimalist feel.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with high-density padding within containers. 

### Masonry Grid
For pattern discovery and galleries, use a masonry layout with a fixed gutter of `24px`. This allows patterns of different aspect ratios to sit together harmoniously, mimicking an inspiration board.

### Responsive Rules
- **Desktop (1280px+):** 12-column grid, 48px side margins.
- **Tablet (768px - 1279px):** 8-column grid, 24px side margins.
- **Mobile (<767px):** 4-column grid, 16px side margins. 

Use the `lg` (40px) and `xl` (64px) spacing units to create vertical breathing room between major sections, emphasizing the minimalist aesthetic.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layers**. Avoid heavy black shadows. Instead, use soft, diffused shadows tinted with the primary color to keep the UI looking "bright."

- **Level 0 (Base):** The off-white background.
- **Level 1 (Cards/Surface):** Pure white (#FFFFFF) surfaces with a subtle 1px border in `secondary` color or a very soft shadow: `0px 4px 20px rgba(255, 107, 129, 0.08)`.
- **Level 2 (Floating/Modals):** More pronounced elevation with a shadow of `0px 12px 32px rgba(45, 52, 54, 0.12)`.

Glassmorphism is used sparingly for navigation bars and overlay panels (e.g., AI prompt settings) using a 12px backdrop blur and 80% opacity on white.

## Shapes

The shape language is defined by extreme roundedness to maintain the "cute" and "approachable" personality. 

- **Standard Elements:** Use `rounded-lg` (16px/1rem) for standard buttons and input fields.
- **Containers:** Use `rounded-xl` (24px/1.5rem) for pattern cards, modals, and main content areas.
- **Interactive Tags:** Use pill-shapes (full rounding) for status chips and category filters.

Avoid sharp corners entirely, as they conflict with the soft, bead-inspired narrative of the product.

## Components

### Buttons
- **Primary:** Background `#FF6B81`, text white, `rounded-lg`. On hover, scale slightly (1.02x) and darken color.
- **Secondary:** Background `#FFD6E0`, text `#FF6B81`, `rounded-lg`. No border.

### Pattern Cards
Cards should be white with a `rounded-xl` corner. They must feature a subtle shadow on hover to indicate interactivity. Images inside cards should have a `12px` corner radius to sit nestled within the card padding.

### Input Fields
Inputs should use a thick 2px border in the `secondary` color rather than a dark gray. On focus, the border transitions to `primary` with a soft glow effect.

### Chips & Filters
Small, pill-shaped elements using the `Accent` color (#7ED6DF) at 15% opacity with dark teal text for "AI-generated" labels, or `Secondary` color for general categories.

### The "Bead" Toggle
Custom radio buttons and checkboxes should mimic the look of a Perler bead—circular, slightly dimensional, and using the primary palette when selected.