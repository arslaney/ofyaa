---
name: Ofyaa Stüdyo — optional cards
description: Pastel Swapy workspace and publication calendar for ?layout=cards.
colors:
  card-ink: "#202424"
  card-yellow: "#fff29b"
  card-green: "#17614f"
  card-blue: "#cde4f8"
  card-pink: "#f2d5e4"
  card-lilac: "#d7c8f1"
  calendar-secondary-ink: "#343d38"
typography:
  headline:
    fontFamily: "Space Grotesk, Inter, system-ui, sans-serif"
    fontSize: "clamp(20px, 1.7vw, 27px)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  metric:
    fontFamily: "Space Grotesk, Inter, system-ui, sans-serif"
    fontSize: "clamp(38px, 4.4vw, 64px)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    lineHeight: 1.5
  action:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
rounded:
  card: "16px"
  toolbar: "8px"
spacing:
  grid-gap: "16px"
  toolbar-gap: "8px"
  card-padding: "25px 26px"
components:
  pastel-card:
    backgroundColor: "{colors.card-yellow}"
    textColor: "{colors.card-ink}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-padding}"
    height: "320px"
  card-action:
    textColor: "{colors.card-ink}"
    typography: "{typography.action}"
    padding: "10px 0 0"
  calendar-card:
    backgroundColor: "{colors.card-yellow}"
    textColor: "{colors.card-ink}"
    rounded: "{rounded.card}"
    padding: "26px"
---

# Design System: Ofyaa Stüdyo — optional cards

## Overview

**Creative North Star: "Swapy kart masası"**

The user's colorful Swapy reference supplies the visual world: flat pastel surfaces, emerald and yellow contrast, large figures, and variable card widths. This record applies only to the optional `?layout=cards` workspace and its calendar. The existing `studio/DESIGN.md` continues to describe the classic interface.

**Key Characteristics:**
- Solid pastel cards with strong dark text.
- Large readable metrics and bottom-aligned actions.
- Explicit editing mode with equivalent pointer and keyboard movement.

## Colors

### Primary

Emerald and yellow form the welcome card's high-contrast pair. Yellow also identifies the scripts card.

### Secondary

Blue and pink identify the two platform cards. Lilac identifies the team and participates in the calendar sequence.

### Neutral

Card ink carries text and outlines on light surfaces. Calendar secondary ink carries dates and platform details. The shell retains its incumbent warm paper and muted text.

**The Surface Color Rule.** Calendar colors repeat yellow, lilac, blue, pink by row order; they do not encode publication status. Status remains written text.

## Typography

**Display Font:** Space Grotesk, falling back to Inter and system sans-serif.
**Body Font:** Inter, falling back to system sans-serif.

Headlines and tabular metrics use the geometric display face; explanatory text and actions use the compact body face. The frontmatter records the recurring card roles. Metrics use tabular numerals. Platform metrics have a smaller fluid maximum (56px). Calendar headings use 24px/1.2 display text and time figures use 34px/1. Mobile card headlines grow to 28px and metrics to 64px; individual welcome and platform overrides remain local component choices.

## Layout

Workspace slots use a twelve-column grid with 16px gutters and fixed 320px height. From 1200px, the slot spans repeat 4/3/5, 5/4/3, then 4/4/4. Width belongs to the slot, so moving a card can change its width. Between 701px and 1199px, slots span six columns and the last spans twelve. At 700px and below, all span twelve and the toolbar stacks.

Cards use the frontmatter padding; mobile uses 26px on each side. Flex columns keep actions at the bottom. The calendar uses two equal columns, switching to one at 900px and below; its cards have a 260px minimum height, becoming 250px with 24px padding at 700px and below.

## Elevation & Depth

Solid color does most of the separation. Resting cards share a faint ambient shadow. Dragging raises the selected item with a larger diffuse shadow, higher stacking, and 90% opacity. Highlighted destination slots receive a dashed green outline. Exact shadows and responsive thresholds are in the adjacent JSON sidecar.

## Shapes

Cards and slots share rounded corners. Toolbar buttons use the smaller radius. Agent initials are circular; authored stroke SVGs supply arrows, drag dots and the new-episode plus. Fine current-color dividers separate card actions from content.

## Components

### Buttons

Toolbar buttons have a fine incumbent border, transparent fill, 44px minimum height and 10px/14px padding. The pressed edit control inverts shell ink and paper. Card actions are full width with a fine top divider, 42px minimum height and underlined hover. Workspace buttons expose a two-pixel current-color focus outline with three-pixel offset.

### Cards / Containers

Each workspace card has a fixed slot height, solid fill, rounded clipping and a vertical content stack. Palette assignments for budget, schedule, requests and next episode are intentionally local; their isolated fills are not promoted to shared palette tokens. Unknown metrics show an em dash; scope notes remain visible beneath platform figures.

### Reordering

Editing adds a drag handle and previous/next controls while hiding the normal action row. Handles accept arrow keys; controls disable at boundaries; movement announces through a live region and restores focus to the moved card. Only order persists in the current browser. Reduced-motion preference disables Swapy animation.

### Calendar

Date and large time share a baseline row. A display heading leads explicit platform status lines; the link sits at the bottom. Pastel fill changes by position, while status wording distinguishes a plan from publication evidence.

## Do's and Don'ts

### Do:
- **Do** preserve readable dark text on pastel cards and yellow text on the dark welcome/request cards.
- **Do** retain explicit status and measurement-scope notes alongside prominent numbers.
- **Do** retain keyboard movement, visible focus and reduced-motion behavior.

### Don't:
- **Don't** use calendar color as the sole publication-status signal.
- **Don't** extend this optional card world into classic screens without a new scoped decision.

Not canonized: the inherited uppercase shell wordmark subtitle is outside this card system and is not a reusable eyebrow style. The screenshot's former text plus has been replaced by the authored SVG in source; the glyph is not a system rule.

Evidence: `src/studio/cards.css`, `src/studio/main.tsx`, `components/ui/swapy-draggable-card.tsx`, inherited `studio/styles.css`, `studio/.impeccable/cards-direction.md`, and `studio/.impeccable/review/cards/` desktop/mobile captures. The source is authoritative where the older plus capture differs.
