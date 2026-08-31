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

## Spacing
- Scale: `4 / 8 / 12 / 16 / 24 / 32 / 40` (px). No ad hoc values outside it.
- Within a group (a card's internal padding, a chip row, a field's label
  and its char-counter): tight, 8-12px.
- Between groups (composer → tone chips → context field → primary action →
  variant cards): sectional, 24-32px. Group tightly, separate generously —
  don't let every gap read as the same distance.

## Type
- System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  sans-serif`) — no webfont. Native feels faster and more "effortless," not
  slower to load; matches NewJeans-taste restraint over a branded typeface
  no one asked for.
- Body text: 15–17px. Headline (`trsl` wordmark): 22–28px depending on
  context (share page vs. home).
- Wordmark weight: 700, letter-spacing `-0.02em`, on every surface it
  appears — enough presence to not read as a placeholder, still lowercase,
  still no punctuation.

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
  selected: `2px solid #4f46e5` border **and** `#1c1a2e` background fill
  (accent mixed into the card base — a border alone under-signals the
  highest-stakes choice in the flow, since it becomes what gets sent).
  Entire card is tappable; only one selected at a time. Selection state
  swaps instantly, no transition — a quick input, not a reveal/unlock/
  confirmation moment.
- Inline edit (e.g., editing a selected translation variant before share):
  a secondary text-link (`Edit`, `#888`) bottom-right of the element,
  visible only when that element is the active/selected one. Tapping it
  swaps static text for a same-box `<textarea>` (identical padding/radius/
  border/font as the static version) pre-filled and focused — no modal, no
  separate screen. No confirm step; the live value is the value. Once
  edited, `Edit` is replaced by `Reset to AI draft`, which restores the
  original text and reverts to static display. Never icon-only — a text
  label costs nothing and needs no decoding, per Voice below.
- Hover: 8% brightness lift on solid-fill elements; `#262626` background on
  transparent/outline elements (`#1f1f1f` measured at ~1.06:1 contrast
  against `#1a1a1a` surfaces — functionally invisible; `#262626` is the
  corrected value, v5). Applies to every interactive element (buttons,
  chips, cards, links).
- Focus-visible: `2px solid #a5b4fc` ring, 2px offset, on every focusable
  control. Not optional per element — a floor, not a taste call. (v5:
  replaces an earlier `#4f46e5` ring that measured ~2.78:1 against
  `#1a1a1a`, below the 3:1 WCAG non-text-contrast minimum — this is the
  only ring rule, not a second rule stacked on the old one. Scoped to focus
  rings only; the selected-card `#4f46e5` border is a separate, unchanged
  rule.)
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
