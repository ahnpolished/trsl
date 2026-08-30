# v5 Visual Design — From Functional to Intentional

## The Problem

The current design follows BRAND.md tokens correctly but composes them without craft. Every element has equal visual weight. Nothing breathes. Nothing feels considered. The textarea, the cards, the buttons — they all sit at the same visual plane, same contrast, same importance. It reads as "someone filled in the Tailwind defaults" because that's essentially what it is.

The tokens are fine. The composition is the problem.

## The Fix

Not new colors. Not new fonts. Not new components. The same tokens, used with intention.

---

## 1. Typography — The Biggest Win

**Current state:** Browser-default line-height (~1.2). No letter-spacing. Word is just an `<h1>` with `fontSize: 28`. Body text is 16px with no rhythm.

**Why it matters:** Typography is 80% of visual design on a text-first app. Tight line-height is the single fastest signal that "no one designed this."

### The System

```
Wordmark:     28px, weight 500, letter-spacing: -0.5px, line-height: 1
Tagline:      15px, weight 400, color: #888, letter-spacing: 0, line-height: 1.4
Body/input:   16px, weight 400, line-height: 1.5, letter-spacing: 0
Card text:    17px, weight 400, line-height: 1.6, letter-spacing: 0
Chips:        14px, weight 500, letter-spacing: 0.2px, line-height: 1
Buttons:      15px, weight 500, letter-spacing: 0.2px, line-height: 1
Meta/counter: 12px, weight 400, letter-spacing: 0.3px, color: #666
```

**Why these choices:**
- **Weight 500 on wordmark, not 600 or 700.** 600+ on a dark background feels aggressive, like it's shouting. 500 is confident without performing. The tightness of the tracking does the work, not the weight.
- **Letter-spacing: -0.5px on wordmark.** Tight tracking signals "this is a brand, not a heading." It's the difference between "trsl" looking like a logo and "trsl" looking like text. Test on device — if it feels too tight at small sizes, back off to -0.3px.
- **Line-height: 1.5 on body, 1.6 on cards.** This is the single biggest visual upgrade. Text that breathes feels considered. Text that's cramped feels like a form field.
- **Letter-spacing: 0.2-0.3px on small text (meta, chips, buttons).** Slightly wide tracking on small text makes it feel more legible and more considered. It's a subtle "someone thought about this" signal.

### Implementation

Global line-height on `<body>` in layout.tsx:
```tsx
<body style={{
  margin: 0,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  background: "#111",
  color: "#eee",
  minHeight: "100vh",
  lineHeight: 1.5,  // ← add this
  WebkitFontSmoothing: "antialiased",  // ← add this (smoother text on iOS)
  MozOsxFontSmoothing: "grayscale",
}}>
```

Wordmark:
```tsx
<h1 style={{
  fontSize: 28,
  fontWeight: 500,
  letterSpacing: "-0.5px",
  lineHeight: 1,
  marginBottom: 8,  // ← more space below (was 4px)
}}>
  trsl
</h1>
```

Tagline:
```tsx
<p style={{
  color: "#888",
  fontSize: 15,
  fontWeight: 400,
  lineHeight: 1.4,
  marginTop: 0,
  marginBottom: 32,  // ← more breathing room before input (was 20px)
}}>
  Say what you actually mean. We'll soften it.
</p>
```

---

## 2. Spacing — Restraint Is Not Timidity

**Current state:** Ad-hoc margins (4, 12, 16, 20, 24px). Everything is cramped. The page padding is 24px top/bottom, 16px sides.

**The rhythm:** 4pt base scale: 4, 8, 12, 16, 20, 24, 32, 40, 48.

### Key Spacings

```
Page padding (top):        32px  (was 24px — more headroom)
Page padding (sides):      20px  (was 16px — more breathing room on narrow phones)
Section gaps:              24px  (between major sections: input → chips → button, or results → share)
Element gaps (within):     12px  (between related elements: textarea → counter, card → card)
Wordmark → tagline:        8px
Tagline → textarea:        32px  (big gap — the tagline is a whisper, the textarea is the action)
Card internal padding:     16px  (keep as-is)
Button padding:            14px vertical (keep as-is)
```

**Why 32px between tagline and textarea:** This is the moment of transition from "reading" to "doing." The space signals that the tagline is separate from the input. It's not a label — it's a mood-setter. Give it room.

**Why 20px side padding instead of 16px:** On a 375px-wide phone (iPhone SE), 16px side padding leaves 343px of content width. 20px leaves 335px — barely different in width, but the extra breathing room on the sides makes the content feel less cramped. Test on device.

---

## 3. Color Usage — Hierarchy Through Surface, Not Decoration

**Current state:** `#111` page, `#1a1a1a` cards/inputs, `#333` borders, `#4f46e5` accent. Everything at the same luminance. No depth.

**The problem:** The contrast between `#1a1a1a` cards and `#111` page is only ~9 luminance units. On a real phone screen in a dim room, it's barely perceptible. The cards don't feel like they're *on* the page — they feel like they're *part of* the page.

### Surface Hierarchy

```
Page background:           #111111  (keep)
Cards (at rest):           #1a1a1a  (keep — but see below for refinement)
Cards (selected):          #1e1e1e  (subtle lift — selected card is slightly brighter)
Inputs (at rest):          #161616  (slightly darker than cards — inputs recede, cards present)
Borders (at rest):         #262626  (was #333 — quieter, less "form field")
Borders (focus/hover):     #4f46e5  (accent — focus state is the moment)
Text (primary):            #eeeeee  (keep)
Text (secondary):          #888888  (keep)
Text (tertiary/meta):      #666666  (keep)
Accent (actions):          #4f46e5  (keep)
Error:                     #f87171  (keep)
```

**Why `#161616` for inputs instead of `#1a1a1a`:** Inputs should feel like they're *set into* the page, not sitting on top of it. Slightly darker than cards creates depth: cards are elevated, inputs are recessed. It's subtle — most users won't consciously notice — but it makes the layout feel architectural, not flat.

**Why `#262626` borders instead of `#333`:** The current `#333` borders are too visible. They scream "this is a form field." `#262626` is just enough to define the rectangle without drawing attention. The border's job is to be invisible until focus, when it becomes the accent color.

### Color Application

**Textarea (at rest):**
```tsx
<textarea style={{
  background: "#161616",
  border: "1px solid #262626",
  borderRadius: 8,
  padding: 16,  // ← more generous padding (was 12px)
  fontSize: 16,
  lineHeight: 1.5,
  color: "#eee",
  transition: "border-color 200ms ease",
}} />
```

**Textarea (focus):**
```css
textarea:focus {
  border-color: #4f46e5;
  outline: none;
}
```

The focus transition from `#262626` → `#4f46e5` is the moment the user commits to writing. It should feel like the input is listening.

**Tone chips (unselected):**
```tsx
<button style={{
  border: "1px solid #333",  // ← quiet border, not accent (was #4f46e5)
  background: "transparent",
  color: "#888",  // ← dimmer text when unselected (was #eee)
  padding: "8px 14px",  // ← slightly more generous (was 6px 12px)
  fontSize: 14,
  fontWeight: 500,
  letterSpacing: "0.2px",
  borderRadius: 8,
  transition: "all 150ms ease",
}} />
```

**Tone chips (selected):**
```tsx
<button style={{
  border: "1px solid #4f46e5",
  background: "#4f46e5",
  color: "#fff",
  // same padding, fontSize, etc.
}} />
```

**Why unselected chips have `#333` border and `#888` text:** Hierarchy. The selected chip is the star. Unselected chips should recede. Currently, every chip has an accent border, which means they all compete for attention. The eye doesn't know where to go. Quiet unselected chips + loud selected chip = clear hierarchy.

**Variant cards (unselected):**
```tsx
<div style={{
  background: "#1a1a1a",
  border: "1px solid transparent",  // ← no visible border at rest
  borderRadius: 8,
  padding: 16,
  transition: "all 150ms ease",
}} />
```

**Variant cards (selected):**
```tsx
<div style={{
  background: "#1e1e1e",  // ← slightly brighter (was #1a1a1a)
  border: "2px solid #4f46e5",  // ← accent border
  // same padding, etc.
}} />
```

**Why transparent border on unselected cards:** The current `#333` border makes every card look like it has a frame. It's too visible. Transparent border at rest means the card is defined by its surface alone. On selection, the accent border appears — a clear signal. This also avoids the 1px→2px layout shift (use `outline` or `box-shadow` for selection if needed).

**Implementation note:** To avoid layout shift from 1px→2px border, use:
```tsx
// Unselected
style={{ border: "1px solid transparent", outline: "none" }}

// Selected
style={{ border: "1px solid transparent", outline: "2px solid #4f46e5" }}
```
Or use `box-shadow: inset 0 0 0 1px #4f46e5` for selected state. Test both on device.

---

## 4. Components — Tactile, Not Flat

**Current state:** Buttons are flat rectangles. No press feedback. No sense that they're physical objects you can touch.

### Buttons

**Primary button (Translate, Share):**
```tsx
<button style={{
  width: "100%",
  padding: "14px 0",
  fontSize: 15,
  fontWeight: 500,  // ← was 600 — 500 is confident, not aggressive
  letterSpacing: "0.2px",
  borderRadius: 8,
  border: "none",
  background: "#4f46e5",
  color: "#fff",
  transition: "transform 80ms ease, opacity 150ms ease",
  cursor: "pointer",
}} />
```

**Press state (CSS):**
```css
button:active {
  transform: scale(0.98);
  opacity: 0.9;
}
```

**Why scale(0.98) + opacity 0.9:** This tiny press effect makes buttons feel physical. It's the difference between tapping a piece of paper and tapping a real button. 80ms is fast enough to feel instant, slow enough to register. The opacity drop signals "something is happening."

**Disabled state:**
```tsx
<button disabled style={{
  background: "#2a2a2a",  // ← darker than active (was #555)
  color: "#666",  // ← dimmer text
  cursor: "not-allowed",
  opacity: 0.6,
}} />
```

**Why `#2a2a2a` instead of `#555`:** `#555` is too bright for a disabled state — it looks like the button is still active but just grayed out. `#2a2a2a` is clearly inactive. The `opacity: 0.6` reinforces the "this is not available" signal.

### Secondary button (Regenerate, View original)

Same press effect, but:
```tsx
<button style={{
  border: "1px solid #4f46e5",
  background: "transparent",
  color: "#eee",
  // same padding, fontSize, fontWeight, etc.
}} />
```

### Textarea

**Placeholder:**
```css
textarea::placeholder {
  color: #666;  // ← dimmer than current (browser default is ~#999)
}
```

**Why dimmer placeholder:** A bright placeholder competes with actual content. `#666` is just visible enough to suggest "type here" without drawing attention. The placeholder should whisper, not shout.

### Context input

Same treatment as textarea: `#161616` background, `#262626` border at rest, `#4f46e5` border on focus. Placeholder color: `#888` (already set in globals.css — keep it).

---

## 5. Motion — Purposeful, Not Ornamental

**Current state:** Three named moments in globals.css (fade-up, reveal-in, pulse). They're defined but not consistently applied. The result reveal doesn't always use the animation. The share page unlock is there but could be more dramatic.

### The Three Moments (refined)

**1. Result reveal (translate → results appear)**

```css
.trsl-result-enter {
  animation: trsl-fade-up 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
  /* ↑ was 350ms ease-out — slower, more dramatic easing */
}
```

**Why 400ms instead of 350ms:** The result reveal is THE moment. It's the payoff. Give it time to breathe. 400ms feels like a reveal, 350ms feels like a flicker.

**Why `cubic-bezier(0.16, 1, 0.3, 1)`:** This is an "ease-out-expo" curve — it starts fast, then decelerates sharply. It feels like the content is *arriving*, not just fading in. Much more premium than linear `ease-out`.

**Stagger the cards:**
```tsx
{variants.map((variant, index) => (
  <div
    key={variant}
    className="trsl-result-enter"
    style={{ animationDelay: `${index * 80}ms` }}
  >
    {variant}
  </div>
))}
```

The first card appears at 0ms, second at 80ms, third at 160ms. This stagger creates a cascade effect — the results feel like they're *unfolding*, not just appearing.

**2. Unlock reveal (share page: locked → original)**

```css
.trsl-unlock-exit {
  opacity: 0;
  filter: blur(8px);  // ← was 4px — more dramatic blur
  transition: opacity 300ms ease, filter 300ms ease;
  /* ↑ was 220ms — slower, more cinematic */
}

.trsl-unlock-enter {
  animation: trsl-reveal-in 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
  /* ↑ was 400ms — slower, more dramatic */
}
```

**Why more blur and slower timing:** The unlock is the dramatic moment of the share page. It's the "aha" — the receiver sees the original message. This should feel cinematic, not utilitarian. More blur + slower timing = more drama.

**3. Confirmation pulse (share → "Copied!")**

Keep as-is: 150ms scale-pulse. It's already right — quick, satisfying, not overdone.

### Processing State

**Current:** Slow opacity pulse (900ms cycle). Fine, but could be more refined.

**Refined:**
```css
.trsl-processing {
  animation: trsl-processing-pulse 1200ms cubic-bezier(0.4, 0, 0.6, 1) infinite;
  /* ↑ was 900ms ease-in-out — slower, smoother */
}
```

**Why 1200ms instead of 900ms:** A slower pulse feels calmer. 900ms feels anxious — like the app is rushing. 1200ms feels like "take your breath, it's coming."

---

## 6. Visual Hierarchy — What Draws the Eye

**Current state:** Everything competes equally. The wordmark, the tagline, the textarea, the chips, the button, the results — they all have similar visual weight. The eye doesn't know where to go.

### The Hierarchy (per screen)

**Home screen (composer):**
1. **Textarea** — the primary action. Should be the most prominent element.
2. **Translate button** — the commitment. Should feel weighty.
3. **Tone chips** — the refinement. Should feel optional, secondary.
4. **Wordmark + tagline** — the brand. Should feel present but quiet.
5. **Context input** — the advanced option. Should feel tuckable, not prominent.

**How to achieve this:**
- Textarea: `#161616` background, `#262626` border (quiet but present), generous padding (16px), large font (16px), 1.5 line-height. The generous padding and line-height make it feel like a canvas, not a form field.
- Translate button: solid `#4f46e5`, full-width, 14px vertical padding. The solid fill + full width make it the visual anchor.
- Tone chips: quiet borders (`#333`), dimmer text (`#888`), placed *above* the textarea but visually receding. They're a refinement, not the main event.
- Wordmark: weight 500, tight tracking, `#eee` but not bold. Present but not shouting.
- Tagline: `#888`, 15px, more space above (32px gap to textarea). A whisper, not a label.
- Context input: same styling as textarea but placed *below* the tone chips, visually separated by the chip row. It's an afterthought, not a primary input.

**Share page (receiver):**
1. **Translated text** — the surface message. Should feel clean, minimal.
2. **Unlock button** — the action. Should feel inviting, not pushy.
3. **Original text (after unlock)** — the reveal. Should feel dramatic, special.

**How to achieve this:**
- Translated text: `#1a1a1a` card, 17px font, 1.6 line-height. Clean, minimal, readable.
- Unlock button: secondary style (transparent + accent border), full-width. The transparency makes it feel less aggressive than a solid button.
- Original text (revealed): same card styling, but the blur→sharp animation makes it feel like it's *resolving*. The drama is in the motion, not the styling.

---

## 7. Overall Aesthetic — What Makes This Feel Like a Real Product

**The direction:** Quiet confidence. The app doesn't need to prove anything. It's not trying to be cool or cute or clever. It's just... good. The kind of good where you don't notice the design, you just notice that it feels right.

**What makes it feel real:**
1. **Typography with rhythm.** Proper line-height, intentional letter-spacing, weight hierarchy. Text that breathes.
2. **Depth through surface, not shadow.** Cards are slightly brighter than the page. Inputs are slightly darker. It's architectural, not decorative.
3. **Tactile buttons.** The scale(0.98) press effect. The transition from quiet border to accent border on focus. Buttons that feel like they respond to your touch.
4. **Dramatic reveals.** The result cascade (staggered fade-up). The unlock blur→sharp. These moments should feel like the app is *presenting* something, not just showing it.
5. **Breathing room.** 32px page padding at top. 20px side padding. 32px between tagline and textarea. Space is luxury. Cramped is cheap.
6. **Quiet hierarchy.** Unselected chips recede. Selected chip is loud. Unselected cards have no border. Selected card has accent border. The eye knows where to go because the other elements are whispering.

**What this is NOT:**
- Not a Tailwind starter template (too generic)
- Not a dark-mode-afterthought (too flat)
- Not a design-system-by-committee (too many competing signals)
- Not trying to be cute or clever (no gradients, no emojis in UI, no playful illustrations)

**What this IS:**
- A text-first app where the typography does the work
- A dark UI that uses surface brightness to create depth
- A mobile-first layout that breathes
- A product that feels considered, not decorated

---

## 8. Implementation Checklist

### CSS (globals.css)

- [ ] Add global `line-height: 1.5` to `<body>` in layout.tsx
- [ ] Add `-webkit-font-smoothing: antialiased` to `<body>`
- [ ] Add `textarea:focus` style: `border-color: #4f46e5; outline: none;`
- [ ] Add `input:focus` style: `border-color: #4f46e5; outline: none;`
- [ ] Add `button:active` style: `transform: scale(0.98); opacity: 0.9;`
- [ ] Add `textarea::placeholder` style: `color: #666;`
- [ ] Refine `.trsl-result-enter` timing: 400ms, `cubic-bezier(0.16, 1, 0.3, 1)`
- [ ] Refine `.trsl-unlock-exit` blur: 8px, 300ms
- [ ] Refine `.trsl-unlock-enter` timing: 500ms, `cubic-bezier(0.16, 1, 0.3, 1)`
- [ ] Refine `.trsl-processing` timing: 1200ms
- [ ] Add transition to textarea: `transition: border-color 200ms ease;`
- [ ] Add transition to buttons: `transition: transform 80ms ease, opacity 150ms ease;`
- [ ] Add transition to tone chips: `transition: all 150ms ease;`
- [ ] Add transition to variant cards: `transition: all 150ms ease;`

### React components (page.tsx, ShareView.tsx)

- [ ] Update wordmark: `fontWeight: 500, letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 8`
- [ ] Update tagline: `fontSize: 15, color: "#888", marginBottom: 32`
- [ ] Update page padding: `padding: "32px 20px"` (was 24px 16px)
- [ ] Update textarea: `background: "#161616", border: "1px solid #262626", padding: 16, lineHeight: 1.5`
- [ ] Update context input: `background: "#161616", border: "1px solid #262626"`
- [ ] Update tone chips (unselected): `border: "1px solid #333", color: "#888", padding: "8px 14px", fontWeight: 500, letterSpacing: "0.2px"`
- [ ] Update tone chips (selected): keep accent fill, add same padding/weight/tracking
- [ ] Update primary buttons: `fontWeight: 500, letterSpacing: "0.2px"`
- [ ] Update secondary buttons: `fontWeight: 500, letterSpacing: "0.2px"`
- [ ] Update variant cards (unselected): `border: "1px solid transparent"` or use outline/box-shadow for selection
- [ ] Update variant cards (selected): `background: "#1e1e1e", border/outline: "#4f46e5"`
- [ ] Add staggered animation delays to variant cards: `animationDelay: ${index * 80}ms`
- [ ] Update share page wordmark: same treatment as home (weight 500, tight tracking)
- [ ] Update meta/counter text: `fontSize: 12, letterSpacing: "0.3px", color: "#666"`

### Spacing adjustments

- [ ] Wordmark → tagline: 8px (was 4px)
- [ ] Tagline → textarea: 32px (was 20px)
- [ ] Section gaps: 24px (keep as-is where already 24px)
- [ ] Element gaps within sections: 12px (keep as-is)
- [ ] Page top padding: 32px (was 24px)
- [ ] Page side padding: 20px (was 16px)

---

## 9. What I Skipped (and When to Add It)

**Skipped:**
- Light theme (BRAND.md says dark-only, revisit if data says otherwise)
- Custom webfont (system stack is fine, matches NewJeans restraint)
- Gradients or decorative elements (not needed — the typography and spacing do the work)
- Complex animation system (three moments is enough, don't multiply)
- Responsive breakpoints (mobile-first = mobile-only until data says otherwise)

**Add when:**
- Light theme: if >20% of users request it or analytics show daytime usage spike
- Custom webfont: if brand recognition becomes a priority and the system stack feels too generic
- Gradients/decoration: if the app expands beyond text input/output and needs more visual interest
- Complex animations: if the app adds more interactive flows that need choreography
- Responsive breakpoints: if desktop usage exceeds 30% and users complain about wasted space

---

## 10. The Test

Open the app on a real phone. Not a simulator, not a Figma frame. A real phone, in a dim room, held in one hand.

**Does it feel like:**
- Text that breathes? (line-height, spacing)
- Buttons that respond? (press effect, focus states)
- A product that's confident? (quiet hierarchy, no decoration)
- A moment when the results appear? (staggered fade-up)
- A reveal when you unlock? (dramatic blur→sharp)

**Does it NOT feel like:**
- A form you're filling out? (textarea styling)
- A list you're scanning? (card hierarchy)
- A generic dark-mode app? (surface depth, typographic craft)
- A college student's homework assignment? (everything above)

If yes to the first four, no to the last four — ship it.
