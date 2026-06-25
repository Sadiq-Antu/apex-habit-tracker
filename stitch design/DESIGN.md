---
name: Cyan-Pulse Performance
colors:
  surface: '#121318'
  surface-dim: '#121318'
  surface-bright: '#38393f'
  surface-container-lowest: '#0d0e13'
  surface-container-low: '#1a1b21'
  surface-container: '#1e1f25'
  surface-container-high: '#292a2f'
  surface-container-highest: '#34343a'
  on-surface: '#e3e1e9'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e3e1e9'
  inverse-on-surface: '#2f3036'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#d1bcff'
  on-secondary: '#3c0090'
  secondary-container: '#7000ff'
  on-secondary-container: '#ddcdff'
  tertiary: '#e8f8ff'
  on-tertiary: '#0d3540'
  tertiary-container: '#badfed'
  on-tertiary-container: '#406470'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d1bcff'
  on-secondary-fixed: '#23005b'
  on-secondary-fixed-variant: '#5700c9'
  tertiary-fixed: '#c3e8f7'
  tertiary-fixed-dim: '#a7ccda'
  on-tertiary-fixed: '#001f28'
  on-tertiary-fixed-variant: '#274c57'
  background: '#121318'
  on-background: '#e3e1e9'
  surface-variant: '#34343a'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1440px
---

## Brand & Style
The brand personality is high-octane, technical, and hyper-efficient. It is designed for elite performance monitoring and developer environments where speed and precision are paramount. The aesthetic merges **Modern Minimalism** with **Cyber-Tech** accents, utilizing deep obsidian surfaces and high-energy luminescent light sources.

The goal is to evoke a sense of "digital flow"—a state where data and interface become intuitive extensions of the user's intent. The UI is dark by default to reduce eye strain during long sessions, punctuated by vibrant cyan interactive elements that draw focus to critical actions.

## Colors
This design system utilizes a "Deep Space" palette. The foundation is built on `#0A0B10` to provide a higher contrast ratio for luminous accents than standard blacks.

- **Primary (Electric Cyan):** Used for primary actions, active states, and critical data points. It carries a heavy glow weight.
- **Secondary (Neon Violet):** Used for secondary data streams, tertiary actions, and depth-based gradients.
- **Surface Tiers:** 
  - Base: `#0A0B10` (Background)
  - Surface: `#14171F` (Cards/Modals)
  - Overlay: `#1C212C` (Input fields/Hover states)
- **Status:**
  - Success: Same as Primary Cyan.
  - Alert: `#FF0055` (High-contrast magenta-red to cut through the blue theme).

## Typography
The typography strategy prioritizes technical legibility. **Space Grotesk** provides a futuristic, geometric feel for headlines. **Geist** handles the core interface body text with extreme clarity and a neutral, developer-centric tone. **JetBrains Mono** is reserved for metadata, status labels, and code snippets, reinforcing the high-tech narrative.

Use All-Caps for `label-mono` styles to create a "readout" aesthetic. For headlines, tighter letter spacing is preferred to maintain a compact, high-density feel.

## Layout & Spacing
The layout follows a **Fluid Grid** system based on a 4px baseline unit. 

- **Desktop:** 12-column grid with 24px gutters. Content is centered with a max-width of 1440px.
- **Mobile:** 4-column grid with 16px gutters and 16px side margins.
- **Density:** The design system leans toward high-density layouts. Use `12px` (3 units) for internal component padding and `24px` (6 units) for sectional spacing.

Components should favor horizontal alignment to simulate a dashboard or terminal interface.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Luminous Outer Glows** rather than traditional shadows. 

- **Level 0 (Base):** `#0A0B10`.
- **Level 1 (Raised):** `#14171F` with a 1px stroke of `#1C212C`.
- **Level 2 (Interactive):** Same as Level 1, but with a 0-0-15px glow using `rgba(0, 240, 255, 0.15)` when focused or active.
- **Glassmorphism:** Used sparingly for overlays (modals/dropdowns). Apply a `12px` backdrop blur with a background color of `rgba(20, 23, 31, 0.8)`.

## Shapes
The shape language is **Sharp (0)**. 90-degree angles are used throughout the design system to communicate a rigid, engineered, and structural feel. 

Exceptions are made only for small status indicators (circular pips) to differentiate them from interactive buttons and structural containers. All buttons, inputs, and cards must maintain a `0px` border radius.

## Components
- **Buttons:** Primary buttons use a solid Cyan (`#00F0FF`) background with black text. On hover, they trigger a heavy outer glow. Ghost buttons use a 1px Cyan stroke.
- **Inputs:** Dark backgrounds (`#14171F`) with a bottom-only 2px border. The border remains grey until focused, where it transitions to Cyan.
- **Cards:** No border-radius. Use a 1px subtle top border (`#1C212C`) to catch "light" and separate from the background.
- **Chips/Badges:** Use `JetBrains Mono` text. For active states, use a Cyan text color with a `0.1` opacity Cyan background.
- **Data Visualizations:** Use the Primary Cyan for the main data line and Secondary Violet for secondary comparisons. Background grids should be subtle (`#1C212C`) and dashed.
- **Progress Bars:** Thin 4px height. The "track" is the background color, and the "indicator" is a glowing Cyan gradient.