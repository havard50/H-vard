# Håvard Pedersen Platform Scope and Client Task List

## Project Goal
Transform the current static artist site into a modern **living artist platform** while preserving the complete music and media history.

Target experience:
- emotional
- cinematic
- active
- personal
- historical
- modern but authentic
- continuously alive

Core promise:
**Newest activity first, full legacy always accessible.**

---

## Non-Negotiables (Must Keep)
Do not remove legacy content. Preserve and surface:
- old albums
- old videos
- old projects and bands
- interviews and press
- concerts history
- old photos and posters
- archive pages and historical context

This should be presented as an **Artist Journey Archive**, not as random old files.

---

## Brand Direction (Primary Identity)
Main brand focus across hero, releases, and live messaging:

**Håvard Pedersen and The Blues Is Alright Band**

Apply this to:
- hero title/subtitle
- latest release block
- video/live cards
- tour and booking call-to-actions

---

## Product Direction
Build a dual-layer platform:

1) **Living Feed Layer (newest first)**
- new songs
- concert announcements
- video clips (YouTube/TikTok/Shorts/Reels)
- photos
- news posts
- backstage updates

2) **Archive Layer (legacy preserved)**
- discography timeline
- historical press/interviews
- old projects/bands
- concert history
- media archive gallery

---

## Phase Plan

## Phase 1 - Stabilize Current Site (Immediate)
Objective: eliminate technical issues before adding more features.

Tasks:
- Fix broken image and media paths
- Restore/verify legacy file links (images, mp3, historical assets)
- Remove dead/obsolete HTML fragments and invalid markup
- Clean and normalize asset/file structure
- Improve mobile responsiveness and spacing consistency
- Validate all navigation and anchor links
- Verify embed loading behavior and fallback links
- Create a full backup snapshot of legacy site assets/content

Deliverables:
- Stable production build
- Broken-link report resolved
- Organized media and legacy inventory

Acceptance criteria:
- No broken internal media links on key pages
- No empty media cards
- Mobile layout passes manual checks on common viewports
- Legacy items remain reachable from the new site architecture

---

## Phase 2 - Living Timeline Homepage
Objective: shift from static sections to an activity-driven homepage.

Tasks:
- Introduce homepage timeline/feed module (newest -> oldest)
- Add content types: release update, concert, video, photo, news, archive spotlight
- Add pinned "Latest" block (current song/video/show)
- Add "Upcoming shows" mini-feed
- Add "From the archive" recurring cards
- Add social/video rails (YouTube, TikTok, Instagram)

Deliverables:
- Timeline-style homepage
- Structured feed card system
- Archive spotlight integration

Acceptance criteria:
- New content appears chronologically without manual page rebuilding
- Visitor can discover both latest updates and legacy content in one flow

---

## Phase 3 - Content Management System
Objective: client can update site without editing raw HTML.

Required admin capabilities:
- add/edit concerts
- add/edit news
- upload photos
- add video links/embeds
- add releases and related links
- manage products/store items (phase-ready)

Recommended stack options (choose one):
- **Notion CMS** (fastest to launch, low complexity)
- **Sanity + hosted frontend** (best long-term structured content)
- **Supabase + simple admin dashboard** (custom and scalable)
- **WordPress headless** (editor-friendly, heavier maintenance)

Suggested decision:
- Start with **Notion CMS** for speed
- Migrate to **Sanity** later if advanced schema/workflows are needed

Deliverables:
- connected CMS
- admin content models
- publish workflow documentation

Acceptance criteria:
- Client can publish/update timeline items and concerts without code changes
- Updates appear on site within a defined publish flow

---

## Phase 4 - Store and Commerce
Objective: monetize products and simplify ordering.

Planned store categories:
- merch
- vinyl/CD
- tickets
- seafood products
- digital products

Implementation options:
- Shopify buy buttons/storefront
- Stripe payment links + lightweight product pages
- Snipcart
- Gumroad (for digital products)
- WooCommerce headless (if full catalog complexity is needed)

Deliverables:
- product listing pages
- checkout flow
- order/contact support flow

Acceptance criteria:
- Products can be added/edited from admin workflow
- Checkout and order confirmations work end-to-end

---

## Legacy Content Migration and Preservation Plan

Legacy examples provided:
- FrontPage extension metadata files (`_vti_*`, web posting files)
- historical assets such as:
  - `TvNord.png-for-web-normal.png`
  - `PlaylistNFSG.jpg`
  - `HermitageFM_interviewJune8.mp3`

Plan:
- Inventory all legacy files and classify as: keep/live, archive-only, obsolete
- Move obsolete system files (FrontPage metadata) out of public UX, but preserve in backup
- Surface meaningful legacy media through Archive cards and timeline entries
- Add clear source labeling: "Archive", year/date, context

---

## Information Architecture (Final)
- Home (Living feed timeline)
- Music (latest + catalog + releases)
- Video (official videos + shorts/reels/tiktok)
- Photos (live/studio/archive)
- Live (upcoming + past highlights)
- Press and Archive (interviews, legacy coverage, old projects)
- Contact and Booking
- Store (phase rollout)

---

## Risks and Controls
- **Risk:** Scope creep from "small redesign" to full platform
  - **Control:** phase-based delivery with sign-off checkpoints
- **Risk:** Legacy link rot and missing files
  - **Control:** legacy inventory and redirect/link verification
- **Risk:** Manual updates bottleneck
  - **Control:** CMS in Phase 3 as mandatory milestone
- **Risk:** Visual inconsistency as content grows
  - **Control:** reusable card templates and content schema

---

## Definition of Done (Project-Level)
Project is complete when:
- Site functions as a living timeline with newest updates first
- Full artist history remains visible and organized
- Client can publish core content without code edits
- Social/video integrations are active and current
- Technical stability issues are resolved
- Commerce foundation is live (or clearly phased with approved timeline)

---

## Immediate Next Actions (This Week)
1. Approve this scope and phase order
2. Lock CMS choice (recommend Notion CMS first for speed)
3. Run legacy asset inventory and broken-link audit
4. Build timeline data model and first feed cards
5. Ship Phase 1 stabilization fixes before adding new modules

