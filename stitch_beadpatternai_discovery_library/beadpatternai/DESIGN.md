---
name: BeadPatternAI
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
  tertiary: '#006b58'
  on-tertiary: '#ffffff'
  tertiary-container: '#4dac95'
  on-tertiary-container: '#003b30'
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
  tertiary-fixed: '#96f4da'
  tertiary-fixed-dim: '#79d7be'
  on-tertiary-fixed: '#002019'
  on-tertiary-fixed-variant: '#005142'
  background: '#f4fafd'
  on-background: '#161d1f'
  surface-variant: '#dde4e6'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
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
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
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
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system is built to evoke a sense of creative play and premium simplicity. It positions the product as a sophisticated design tool for hobbyists, blending the curated aesthetic of a high-end marketplace with the intuitive utility of modern design software. 

The visual direction follows a **Modern Creative** style:
- **Clean and Airy:** Prioritizes whitespace to prevent the vibrant bead patterns from overwhelming the user.
- **Approachable Premium:** Uses soft geometries and a warm-toned interface to feel inviting rather than clinical.
- **Tactile Softness:** Elements should feel "clickable" and physical, mirroring the tactile nature of real-world beads.

The UI should feel like a quiet gallery that celebrates the user's colorful creations. Avoid heavy borders or dense information clusters. Every interaction should feel fluid, soft, and intentional.

## Colors

The palette is centered around a warm, "creamy" foundation to differentiate the design system from standard "stark white" SaaS products. 

- **Primary (Rose):** Used for main actions, brand presence, and highlighting active states.
- **Secondary (Soft Pink):** Used for subtle backgrounds, hover states on light elements, and secondary categorization.
- **Accent (Mint):** Used sparingly for "New" badges, success states, or to highlight creative "AI" features.
- **Neutral (Dark Grey):** Used for high-readability text. Avoid pure black to maintain the soft aesthetic.
- **Background & Surface:** The `Warm White` background acts as the canvas, while `Pure White` surfaces (cards/modals) provide a slight lift.

## Typography

This design system uses a dual-font strategy to balance personality with utility. 

**Plus Jakarta Sans** is the voice of the brand. It is used for all headings and large display text. Its soft, rounded terminals echo the shape of perler beads and create an optimistic, modern tone. Headlines should utilize tight letter-spacing and heavy weights (Bold/ExtraBold).

**Inter** provides a functional, neutral counterpoint for body copy, labels, and inputs. It ensures that instructions and metadata remain legible even at small sizes. Use `400` weight for standard reading and `600` for emphasized labels.

## Layout & Spacing

The layout philosophy is **Discovery-First**, utilizing a fluid grid that maximizes the visibility of visual assets (bead patterns).

- **Grid System:** A 12-column fluid grid for desktop with 24px gutters. For pattern discovery pages, use a masonry or a CSS-grid "Auto-fit" approach to allow patterns of different aspect ratios to sit naturally together.
- **Margins:** Desktop views should feature generous 48px side margins to emphasize the "boutique" feel. Mobile scales down to 16px.
- **Section Spacing:** High-level sections should be separated by `stack-lg` (48px) to provide maximum breathing room.
- **Safe Areas:** Cards should have internal padding of 24px to ensure content never feels cramped.

## Elevation & Depth

Elevation in this design system is achieved through soft, multi-layered shadows rather than harsh borders.

- **Level 1 (Default Cards):** Use a very soft, diffused shadow: `0px 4px 20px rgba(45, 52, 54, 0.05)`. This creates a subtle lift off the warm background.
- **Level 2 (Hover/Active):** On hover, the shadow should expand and soften further: `0px 12px 32px rgba(45, 52, 54, 0.08)`, and the element should scale slightly (102%).
- **Level 3 (Modals/Overlays):** High elevation with a backdrop blur (12px) on the underlying content to maintain focus on the creative task.
- **Outlines:** Use the `Border` color (#F1F2F4) only for structural separation where shadows aren't appropriate, such as input fields or divider lines.

## Shapes

The shape language is defined by the **Rounded (16px)** standard. This radius is applied to all primary containers, patterns cards, and imagery.

- **Standard Elements:** Buttons and Input fields use a 12px radius to appear cohesive with the larger 16px card containers.
- **Micro Elements:** Small badges or tags use an 8px radius.
- **Selection States:** When a bead or pattern is selected, use a thick 3px stroke with the primary color, following the roundedness of the element.

## Components

- **Buttons:** 
  - *Primary:* Solid #FF6B81 with white text. 12px rounded corners. Large horizontal padding (32px).
  - *Secondary:* Solid #FFD6E0 with #FF6B81 text. No border.
- **Pattern Cards:** The centerpiece component. Must feature 16px corner radius, a subtle Level 1 shadow, and no external border. The image should be top-aligned with the card's radius.
- **Chips/Tags:** Used for "Difficulty" or "Bead Brand". 8px radius, #F1F2F4 background, and `label-sm` typography.
- **Input Fields:** Soft grey background (#F1F2F4) rather than a white background with a border. This keeps the interface looking "filled" and premium.
- **Bead Palette:** A custom component displaying circular bead colors. Active beads should have a "Primary" color ring around them to indicate selection.
- **Empty States:** Use large, soft illustrations and `headline-md` text to keep the experience friendly even when no results are found.