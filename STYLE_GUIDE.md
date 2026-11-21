# Paint Commons style guide

How Paint Commons presents itself and how paintcommons.org looks and reads: positioning, voice and wording, colour, type, the logo and the wordmark. The values here are the ones in the code; if the code and this guide disagree, fix one so they match.

- **Where the values live:** colour and font tokens in [`dist/tokens.css`](dist/tokens.css), which every page links before its own styles; the icon in [`dist/icon.svg`](dist/icon.svg); the wordmark and lockups in [`dist/brand/`](dist/brand/), drawn by [`scripts/make-wordmark.mjs`](scripts/make-wordmark.mjs).
- **Character:** a public reference library. Paper, ink and hairlines, serif headings over plain sans text, and colour that comes from paint. Quiet and factual, never promotional.
- **Relation to Stipplewise:** Paint Commons is a separate public project with its own identity and voice. It follows the same method as the [Stipplewise design guide](https://github.com/Left47/stipplewise/blob/main/docs/DESIGN.md) (one token set, contrast checks, a wordmark drawn as outlines) but shares none of its colours, fonts, logo or tone. Don't borrow Stipplewise's red, ramps, Fraunces wordmark or hobby-table voice here, and don't put the Paint Commons mark inside Stipplewise's UI except where it credits the catalogue.

## Positioning

**Tagline:** The open miniature paint reference

Use it word for word wherever the site describes itself in a line: the header, the footer, the page title, the meta description, social cards and the GitHub organisation. Don't write variants ("An open reference for miniature paints", "Open paint reference"). In a sentence it takes "the" and no capital: "Paint Commons is the open miniature paint reference."

**What Paint Commons is:** an open, community-maintained catalogue of miniature paints. Each record gives a paint's brand, range, product code, name, paint type, barcodes and approximate colour, with the source of every value and a public history of changes. The catalogue is for painters, contributors and developers, and anyone may reuse it.

**Principles** (the four headings in the landing page's "About the catalogue" section):

1. **Open and reusable.** Catalogue data is CC0 1.0, except where a source's own licence is noted. Records are portable files with stable IDs.
2. **Sources cited.** Every colour and barcode names where it came from and how it was obtained. Observations, published values and estimates stay distinct.
3. **Corrections reviewed.** Anyone can suggest a correction. A maintainer reviews each one, and the change history is public.
4. **Personal data stays private.** Only information someone explicitly submits, and a maintainer approves, becomes public. Collections, wishlists, drafts and photos from any app never enter the catalogue.

**Commons, not affiliation.** Paint Commons follows the commons ethos of Wikipedia and Creative Commons, with no affiliation to either. Don't use their names, marks or layouts in a way that suggests endorsement. Comparisons belong in documentation, not in headlines.

**Stipplewise and other tools.** Stipplewise is one contributor and reader of the catalogue, alongside pull requests, the website's correction form and any other tool. The site mentions it factually, in the FAQ, the contribution diagram and the footer, and never as a sales pitch. Stipplewise's own materials may say "Powered by Paint Commons"; Paint Commons doesn't describe itself as part of Stipplewise.

**Claims.** Promise only what the catalogue does. Colours are approximate, equivalents are a source's claim, and coverage is partial. Never claim completeness, perfect matches or measured accuracy, and don't describe planned features as live.

## Voice and wording

Paint Commons speaks like a reference library or a well-kept catalogue: precise, neutral, unhurried and slightly formal. It describes what a record contains and where the information came from, then stops. The model is the descriptive voice of Wikipedia's main page, portal and contents pages ([wikipedia.org](https://www.wikipedia.org/), [Main Page](https://en.wikipedia.org/wiki/Main_Page), [Contents](https://en.wikipedia.org/wiki/Wikipedia:Contents)), not its article prose and not promotional writing.

**How it differs from Stipplewise:**

| | Paint Commons | Stipplewise |
| --- | --- | --- |
| Speaks as | A catalogue: third person, neutral | A friend at the painting table |
| Addresses | Readers and contributors; "you" only in instructions and FAQs | "You" and "your paints" throughout |
| Vocabulary | Cataloguing terms: record, entry, source, provenance, product code, range | Hobby words: bottle, rack, shelf, mini, scheme |
| Spelling | British, always | US by default, with a UK setting |
| Tone | Factual, bookish, impersonal | Warm, practical, personal |
| Headlines | Plain descriptive labels ("About the catalogue") | Two-line statement and italic payoff |

### Mechanics

- **Sentence case** for headings, navigation, buttons, controls and field labels. Keep proper names, manufacturer spellings, product codes and standard abbreviations as published.
- **No full stops** in headings or short labels. Complete sentences take normal punctuation.
- **Oxford comma** in lists of three or more. Write "and", not an ampersand, unless the ampersand belongs to a proper name.
- **British spelling** in site-authored text: catalogue, colour, grey, behaviour, licence (noun), organisation. Names, product titles and quotations stay as published, and so does the repository name `paintcommons/catalog`. This is separate from Stipplewise's US/UK setting.
- **Dates** as "19 November 2026". **Numbers** with thousands separators (8,481 paints).
- **Arrows:** → for a link within the site, ↗ for another site, ↓ for a download.
- **No** exclamation marks, emoji, rhetorical questions outside FAQs, slogans, or strings of sentence fragments.

### Content

- **State what a page contains or an action does.** "Browse paints by colour family, brand, or range", not "Discover your next favourite colour".
- **Describe, don't sell.** No hype words (ultimate, powerful, seamless, revolutionary), no urgency, no superlatives.
- **Name uncertainty plainly.** Swatches are "approximate"; equivalents are "declared" by a named source; calculated barcodes are "calculated, not confirmed by scan". Show "Not recorded" for missing facts, never a guess.
- **Keep kinds of information apart.** Calculated colour families and wall groupings are presentation; manufacturer-published families are facts. Label each for what it is.
- **Copy editing never changes catalogue data.** Product names and source descriptions stay exactly as published.
- **Name status accurately.** Describe the contribution workflow as it works today; say "planned" only for work that hasn't shipped.

### Words

| Use | Not |
| --- | --- |
| miniature paint, paint | pot, bottle, dropper (unless describing packaging) |
| catalogue, record, entry | database, listing, item |
| product code | SKU |
| range, brand (manufacturer when the company is meant) | line, label |
| paint type (acrylic, wash, speedpaint, metallic) | category |
| source, provenance | evidence (except for barcode evidence), proof |
| correction, suggestion | edit request, ticket |
| contributor, maintainer | user, admin, moderator |
| colour family, colour wall | hue bucket, palette (except the logo's pigments) |
| approximate swatch | true colour, exact match |

Avoid hobby shorthand and slang (stash, slap chop, contrast-as-a-verb, NMM) unless it's part of a product's published name. Expand terms on first use when a general reader might not know them.

## Colour

### Review (November 2026)

Before this guide, the site's colours were written out separately in the landing page and the catalogue stylesheet: two copies of the same six tokens and about 30 one-off hex values (nine near-identical pale fills, six border greys, three sage greens, two whites). Most were close variations of the same few colours. The audit also found:

| Problem | Before | Now |
| --- | --- | --- |
| Section numbers ("01") too faint | `#959b8f`, 2.7:1 on paper | `--muted`, 5.5:1 |
| Focus ring weak on pale fills | `#b88340`, 2.8:1 on fill | `--focus` (`#96682a`), 4.2:1 |
| Search and form borders nearly invisible | `#bbc1b4`, 1.7:1 | `--control` (`#808a76`), 3.1:1 or more |
| Error text unrelated to the palette | `#9a3324` | `--error`, the logo's oxide |
| Swatch-count ink on light swatches | `#20251b` | `--ink` value `#242820` |
| Button hover a one-off green-black | `#3e493c` | `--moss-deep` |

Every page now takes its colours from `tokens.css`. The only literal colours left in page styles are translucent overlays of ink, paper or white (inner swatch frames, dialog backdrop, labels over swatches) and the `theme-color` meta tag, which must be a plain hex.

### Neutrals

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#f8f7f3` | Page background and `theme-color`. Warm, never pure white |
| `--surface` | `#fffefb` | Cards, record sheets, inputs, source boxes |
| `--fill` | `#eeeee7` | Quiet panels: contribution note, evidence box, empty states, the record sheet's offset shadow |
| `--ink` | `#242820` | Text, headings, the wordmark, primary buttons. 14:1 on paper |
| `--text-2` | `#50564d` | Long body copy on the landing page. 7.1:1 |
| `--muted` | `#62665f` | Secondary text: labels, counts, captions, footers. 5.5:1 on paper, 5.0:1 on fill |
| `--line` | `#d8dad2` | Hairlines and dividers |
| `--line-2` | `#b9c1b2` | Stronger decorative borders: the record sheet, dialog, diagram boxes, tags |
| `--control` | `#808a76` | Borders that mark a control (search box, form fields, card hover). 3:1 or more on paper, surface and fill |

The greys lean slightly green so they sit with the moss in the logo.

### Logo pigments

The icon's five swatches are the brand colours. They're named after pigments, in this order, left to right:

| Pigment | Token | Value |
| --- | --- | --- |
| Oxide | `--oxide` | `#8d4036` |
| Ochre | `--ochre` | `#bc9550` |
| Moss | `--moss` | `#61745b` |
| Slate | `--slate` | `#517588` |
| Mauve | `--mauve` | `#9a899b` |
| Frame | `--frame` | `#737d69` (the swatch card's outline and tick marks) |

Use the pigments as they are only for illustration: the icon, the example record's swatch row, and decorative rules such as the contribution note's top border. They're too light for text on paper (ochre is 2.6:1, mauve 3.1:1).

### Deep pigments and roles

For text and UI, each pigment has a deep version, at least 4.5:1 on paper and surface. Components use the role names, so a role can move to another pigment without editing every rule.

| Role | Token | Deep pigment | Value | Use |
| --- | --- | --- | --- | --- |
| Accent | `--accent` | Moss deep | `#49684f` | Eyebrows, the italic hero line, tags, step numbers, +/− markers, paint type, the correction submit button |
| Link | `--link` | Slate deep | `#305d8a` | Links, text buttons, the current nav item |
| Focus | `--focus` | Ochre deep | `#96682a` | `:focus-visible` outlines (3px) |
| Error | `--error` | Oxide | `#8d4036` | Error messages |
| Reserved | `--mauve-deep` | Mauve deep | `#6f5b72` | Not used yet; the text-safe mauve if one is needed |

Moss also has a tint and a line for the "published" diagram box and the selected view switch: `--moss-tint` `#e8eee4` and `--moss-line` `#96a98b`.

Buttons are ink with paper text (14:1) and turn moss deep on hover. Keep one solid button per view.

### Paint colours

Paint swatches come from catalogue data and the shared rules in `dist/catalogue/color/` (also used by Stipplewise). They're never part of the UI palette and never recoloured to fit it. Labels over a swatch pick ink or white by contrast (`countLabelAppearance` in `dist/catalogue/swatch.mjs`). A paint with no published colour shows the striped `.no-swatch` pattern in `--fill` and `--line`, labelled "Not recorded" or similar.

### Contrast

Text is at least 4.5:1 against its background (3:1 for text 24px and larger, control borders, focus rings and icons). Check new colours on `--paper`, `--surface` and `--fill` before they ship. The site has no dark theme yet; if one is added, give every token a dark value in `tokens.css` under `prefers-color-scheme: dark` and re-check every pair.

## Type

### Review

The site uses Georgia for headings and Arial for text, as Wikipedia's reference pages do. The names were written out in about 40 rules, the monospace was the bare `monospace` keyword (Courier on some systems), and the name in the header was live Georgia small caps, which falls back to a different serif on Android and Linux. Some labels were 8–9px. Now:

- The stacks are tokens: `--serif`, `--sans` and `--mono` in `tokens.css`.
- The name is a drawn wordmark (see [Wordmark](#wordmark)).
- Landing-page labels are at least 10px. The catalogue wall's tile captions (8–10px) are a deliberate exception, because they scale with the swatch-size slider and the full details are one tap away.

### Faces

| Token | Stack | Use |
| --- | --- | --- |
| `--serif` | `Georgia, "Times New Roman", Times, serif` | Headings, paint names, record titles, diagram labels. Regular weight; the hero's second line in italic |
| `--sans` | `Arial, "Helvetica Neue", Helvetica, sans-serif` | Body text, navigation, labels, controls, footers |
| `--mono` | `ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | Product codes, HEX values, step numbers, the record sheet's labels |

Never set the name "Paint Commons" as a heading in a typeface; use the wordmark image in headers and footers. In running text it's ordinary text.

### Scale

**Landing page:** hero `h1` serif 42–60px (`clamp`), line height 1.08, −1.5px tracking · section `h2` serif 34px (30px on phones) · `h3` serif 19–20px · intro sans 18px / 1.65 · body sans 16px / 1.65 · secondary copy 13–14px.

**Catalogue:** page `h1` serif 46px (39px on phones) · section titles serif 22px · paint names serif 20px · record title serif 34px (29px on phones) · body sans 15px / 1.65 · labels sans 11px bold · codes mono 10–11px.

Headings use sentence case and normal weight (Georgia's regular is the house style; don't bold headings).

## Logo

The mark is a paint swatch card: five upright swatches (oxide, ochre, moss, slate, mauve) in a thin frame with tick marks top and bottom, on a paper rounded square (radius 4 on 48). It's [`dist/icon.svg`](dist/icon.svg), with [`dist/icon-1024.png`](dist/icon-1024.png) for GitHub and other avatars.

- Keep the swatches' order and colours, the frame and the ticks. Don't recolour, reorder, add a swatch, or put the mark on a coloured ground.
- The paper square is part of the mark. On ink or photographs, keep it; it gives the mark its own light ground.
- Minimum size 16px (favicon). Below about 24px the ticks fade, which is fine.
- If a pigment changes, change it in `icon.svg`, `tokens.css` and this guide together, redraw the PNG and re-run the wordmark script so the lockups match.

## Wordmark

**PAINT COMMONS** in Cormorant SemiBold (600), all capitals at one height, with the font's own spacing and kerning (no added tracking). It's drawn as outlines, so it looks the same on every device and in images, whatever fonts are installed (chosen by Jim, Nov 21, 2026).

| File | Use |
| --- | --- |
| `dist/brand/wordmark.svg` | The word in ink, for paper and light grounds. Used in every header and footer |
| `dist/brand/wordmark-light.svg` | The word in paper, for ink or dark grounds |
| `dist/brand/lockup.svg`, `lockup-light.svg` | The icon beside the word, the icon 1.6 times the capital height, for social images, slides and other sites |

- **Sizes:** 18px tall in every page header (17px on phones), 12px in footers. Below 11px use the icon alone.
- **Header lockup:** the icon at 56px, then 16px of space, then the wordmark with the tagline ("The open miniature paint reference", sans 11px, +1.5px, muted) 7px beneath it. The two lines share a left edge, and together they span the height of the icon's frame, centred on the icon. Navigation is ink, 14px, centred on the same line.
- **Clear space:** at least the height of the capitals on every side.
- **Don't:** retype the name in Cormorant or another font, stretch it, add tracking, mix in lowercase, or change its colour from ink or paper.
- **Redraw:** `npm install --no-save harfbuzzjs && node scripts/make-wordmark.mjs`. The settings are at the top of the script. The image width in the HTML follows from its height (the word is 11.58 times as wide as it is tall); update the `width` and `height` attributes if the drawing changes.
- **Font:** Cormorant © the Cormorant Project Authors, SIL Open Font License 1.1. The font file and its licence are in `assets/fonts/cormorant/`; the website itself never loads the font.

## Layout and components

- **Width:** content up to 1120px (landing) or 1320px (catalogue), with 48px side padding, 28–32px on tablets and 20px on phones.
- **One left edge:** every heading, paragraph, diagram and footer item starts at the content edge, and full-width elements share the right edge. No offset label columns.
- **Spacing scale:** 8, 12, 16, 24, 32, 40, 48 and 64px. Sections are 64px apart (48px on phones); a heading is 16px above its lead paragraph and 40px above the content that follows.
- **Vertical alignment:** an image beside text is centred on the text block (the header icon on the wordmark and tagline, the hero record on the hero text). Text beside a wordmark shares its centre line.
- **Landing page story:** hero (what Paint Commons is, browse and download), "About the catalogue" (one sentence and the four principles), "Contribute to the catalogue" (the review flow, the two ways to contribute, and a short FAQ). Add a section only when it tells the reader something new; don't repeat the tagline or principles in other words.
- **Few lines:** one 1px `--line` rule between sections, plus rules between FAQ entries and record fields. Don't add rules for decoration. Corners are square throughout; the only rounded shape is the logo.
- **Record sheet** (landing hero): `--surface` with a `--line-2` border and an 8px offset `--fill` shadow.
- **Cards and lists** (catalogue): `--surface`, 1px `--line` border, `--control` on hover with a 2px lift (off under reduced motion).
- **Buttons:** solid ink with paper text, 14px; secondary actions are text links in `--link` with an arrow (→ inside the site, ↗ for other sites).
- **Inputs:** `--surface` with a `--control` border, square corners, 16px text on phones so iOS doesn't zoom.
- **Focus:** every interactive element shows a 3px `--focus` outline on `:focus-visible`.
- **Motion:** smooth scrolling and card lifts only, both off under `prefers-reduced-motion`.

## Changing the design

1. Change the token in `dist/tokens.css`, then use the role name in components rather than a new hex.
2. Check contrast on paper, surface and fill.
3. Update this guide in the same commit.
4. For a pigment or wordmark change, also update `icon.svg` and the PNG, re-run `scripts/make-wordmark.mjs`, and check every page header at phone and desktop widths.
