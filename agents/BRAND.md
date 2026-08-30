# trsl brand

Owned by **product-designer** — updated when a version's visual direction
changes something here, not on every iteration. Engineer implements against
this; it's not optional flavor text, it's the same kind of contract FINAL.md
is for scope.

Seeded from what's actually shipped in v1/v2 (this file formalizes it, not
invents it from scratch) — refine, don't discard, unless a real design pass
says otherwise.

## Palette
- Background: `#111111` (page), `#1a1a1a` (cards/inputs)
- Text: `#eeeeee` (primary), `#888888` (secondary/meta), `#666666` (tertiary)
- Accent (brand indigo): `#4f46e5` (borders/actions), `#a5b4fc` (accent text
  on dark)
- Error: `#f87171`
- Dark-only for now — no light theme. Revisit if data ever says otherwise,
  don't add one speculatively.

## Type
- System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  sans-serif`) — no webfont. Native feels faster and more "effortless," not
  slower to load; matches NewJeans-taste restraint over a branded typeface
  no one asked for.
- Body text: 15–17px. Headline (`trsl` wordmark): 22–28px depending on
  context (share page vs. home).

## Motion
Three-moment budget, not a general animation system — see `agents/TASTE.md`'s
NewJeans reference: quiet by default, a couple of moments that feel
genuinely delightful. Current vocabulary (extend, don't multiply):
- **Reveal**: blur→sharp + fade-up (`trsl-fade-up`, ~350ms ease-out) — used
  for new content appearing (translate result).
- **Unlock/transition**: blur cross-fade (`trsl-reveal-in`/`trsl-unlock-exit`,
  ~220–400ms) — used when one piece of content replaces another in place.
- **Confirmation**: scale-pulse (`trsl-pulse`, 150ms) — used for a single
  micro-acknowledgment (copy confirmation), not for anything that repeats.
- Processing/loading states get a slow opacity pulse, not a spinner —
  spinners read as generic-SaaS, not this brand.

## Layout
- Single column, max-width 480px, centered. Mobile-first in the literal
  sense — the desktop view is the mobile view, not a separate breakpoint,
  until real usage data says a wider layout earns its complexity.
- Cards: 8px border-radius, 16px padding, `#1a1a1a` background, no shadow
  (shadows on a near-black background read muddy, not premium).
- Selectable cards (e.g., translation variants): same card base as above,
  with a border that signals selection. Default: `1px solid #333` border;
  selected: `2px solid #4f46e5`. Entire card is tappable; only one selected
  at a time. Selection state swaps instantly, no transition — a quick input,
  not a reveal/unlock/confirmation moment.
- Buttons: full-width, 8px radius, either solid accent (primary action) or
  transparent-with-accent-border (secondary/unlock) — never more than one
  solid-fill button visible at a time.
- Chips (compact single-tap selectors, e.g. tone presets): same
  solid/outline vocabulary as buttons, at reduced scale — `6px 12px`
  padding, 14px font, 8px radius, no shadow. Selected = solid accent fill
  (primary-button treatment); unselected = transparent with accent border
  (secondary-button treatment). Selection toggles instantly, no
  transition — chips are a quick input, not a reveal/unlock/confirmation
  moment, so they sit outside the three-moment motion budget.

## Voice
- Lowercase wordmark, no punctuation flourish: "trsl", not "Trsl." or "TRSL".
- Copy is plain and warm, never cute/jokey about what this app actually
  does (translating a raw message) — the restraint is the whole point, per
  NewJeans taste: "nothing performative."
- Price is disclosed before any action that leads to payment; the label
  tells the user the cost up front, in plain copy.
