# Landing Page Redesign Design

**Date:** 2026-03-08

## Overview

Redesign the Joinery landing page at app.jnry.io to establish a distinctive visual identity, fix content issues, and simplify the page structure. The current page uses a generic purple gradient SaaS template aesthetic that doesn't reflect the product's identity.

## Visual Identity: "Modern Craft"

Clean and contemporary with craft-inspired accents. The craftsmanship is in the precision, not the ornamentation.

### Color Palette

- **Base/dark:** Dark charcoal (`#1a1a2e` range) — nav, hero background, footer
- **Surface:** Warm off-white/cream (`#f5f0eb`) — content sections
- **Primary accent:** Warm copper/gold (`#c8956c` range) — CTAs, highlights, emphasis
- **Secondary accent:** Muted teal/sage (`#5a7a6e`) — secondary buttons, links
- **Text:** Near-white on dark, dark charcoal on light

### Typography

- **Display/headings:** Distinctive serif or slab-serif (Playfair Display, DM Serif Display, or Fraunces)
- **Body/UI:** Clean geometric sans-serif (DM Sans, Outfit, or General Sans)

### Texture & Atmosphere

- Subtle grain/noise overlay on dark sections
- Faint grid or line pattern behind the workflow diagram section
- Cards with warm shadows instead of flat borders

## Page Structure (top to bottom)

### 1. Nav Bar
- Logo + "Joinery" on left
- "Sign In" button on right (replaces "Login")

### 2. Hero
- Tightened height — no more full-viewport hero
- Headline + one-liner subtitle
- Primary CTA: "Get Started" → `/auth/login`
- Secondary CTA: "View on GitHub" → repo link
- Remove the floating "Your Team's Data Hub" card

### 3. Workflow Diagram (animated)

Three steps connected by animated lines:

| Step | Icon | Label | Subtext |
|------|------|-------|---------|
| 1 | Git branch/repo symbol | "Connect" — Link your Git repositories | GitHub, GitLab, Azure DevOps |
| 2 | Refresh/cycle arrows | "Sync" — SQL queries are detected automatically | File changes tracked, versions preserved |
| 3 | People/team symbol | "Find what you need" — Your team searches, browses, and shares | Granular permissions per org and team |

**Animation behavior:**
- Steps appear one by one as section scrolls into view (staggered fade + slide up)
- Connecting lines draw themselves between steps (left→right desktop, top→bottom mobile)
- ~300ms per step, ~200ms delay between each
- CSS animations + Intersection Observer, no heavy libraries
- Pure HTML/CSS/JS in the Angular component

### 4. Trust Section (simplified)

Two cards only — things that are actually true:

- **Secure Authentication** — Enterprise-grade OAuth with GitHub, Microsoft Entra ID, AWS IAM. No passwords stored.
- **Open Source** — MIT licensed, full transparency. "View on GitHub" link.

**Removed:**
- "Data Privacy First" card (claims not implemented: end-to-end encryption, zero-knowledge architecture)

### 5. Footer (cleaned up)

- Fix copyright: "© 2024" → "© 2026"
- Update contact email from support@joinery.dev to jnry.io domain
- Remove broken links (Privacy Policy → `#`, How It Works → `#`) or link to real pages
- Keep: Documentation, Support, Roadmap, GitHub, Discussions, Contribute links

## Content Removed

- "Your Team's Data Hub" floating card in hero
- "Sign in with GitHub" as standalone hero CTA
- "Data Privacy First" card with false security claims
- "How Joinery Works" static feature cards (replaced by workflow diagram)
- "End-to-end encryption" / "Zero-knowledge architecture" / "No data mining" claims

## Responsive Behavior

- Workflow diagram: horizontal (desktop) → vertical stack (mobile)
- Hero: reduce padding on mobile, stack CTAs vertically
- Trust cards: 2-column (desktop) → single column (mobile)
- Nav: same as current (hamburger on mobile)

## Technical Notes

- All changes are in the landing page component (`web/src/app/landing/`)
- Google Fonts for typography (loaded in index.html or styles.scss)
- CSS custom properties (variables) for the color palette, defined globally in styles.scss
- Intersection Observer API for scroll-triggered animations
- No new dependencies required
