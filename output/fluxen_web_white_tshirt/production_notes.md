# Fluxen_web — White T-shirt embroidery — production notes

> **⚠ Font substitution (read first).** The required brand font **Block 2 was not supplied** and is not
> installed anywhere on the build machine. With the client's approval, all brand lettering
> (front logo, back "Fluxen_web", "Ideas. Code. Products.") is set in **Geist SemiBold (wght 600)** —
> the typeface the fluxen-web site already uses and the closest match to the reference logo.
> **This is a stand-in, not Block 2.** To swap it, put the Block 2 file in `fonts/` and re-run the
> build (see *Rebuild* below); every file here is regenerated automatically.

Reference: `Футболки Fluxen_web_ код и стиль.png` — **white T-shirt only** (front + back). Black shirts ignored.

## Files

| File | What it is | Status |
|---|---|---|
| `fluxen_web_white_front.dst` | Tajima DST, left-chest logo | Generated, validated (see below) |
| `fluxen_web_white_back.dst` | Tajima DST, back HTML code graphic | Generated, validated (see below) |
| `fluxen_web_front.svg` / `fluxen_web_back.svg` | True-size vector artwork (1 unit = 1 mm), text as outlines, one layer per thread in stitch order | Done |
| `fluxen_web_front.png` / `fluxen_web_back.png` | Stitch simulation rendered **from the decoded DST files** (not from the artwork) | Done |
| `validation.json` | Machine-readable dimensions, counts and parser results | Done |
| `source/` | Digitizing pipeline (`build.py`) + pinned `requirements.txt` | Done |

## Finished dimensions

| | Width | Height | Notes |
|---|---|---|---|
| **Front** (stitch bounds) | **95.4 mm** | **21.8 mm** | Logo ink width 95.0 mm, cap height 11.9 mm, underline bar 18.1 × 1.8 mm, 7.6 mm below baseline |
| **Back** (stitch bounds) | **247.2 mm** | **235.6 mm** | Code block 247 mm wide; bottom details 47 mm below last code line |

Back detail sizes: code characters 4.62 mm advance, 5.5 mm caps, 4.1 mm x-height, 13 mm line pitch ·
bottom "Fluxen_web" 45 mm wide (5.7 mm caps) · "Ideas. Code. Products." 70 mm wide (4.75 mm caps) ·
bar above "Fluxen_web" 12.6 × 1.4 mm.

## Placement (confirm on a sample shirt)

- **Front:** wearer's **left chest**. Top of the logo ≈ 7–8 cm below the front neckline seam; left edge ≈ 5–6 cm from the centre-front line, matching the reference. Hoop: 15 × 15 cm (or 13 × 18 cm).
- **Back:** centred on the centre-back line; top of the code block ≈ 7–8 cm below the back collar seam. Needs a hoop with ≥ 260 × 250 mm sewing field (e.g. 300 × 300 mm or 36 × 36 cm frame).
- DST origin = design centre (machine starts at the centre of each design).

## Threads and sequence (40 wt polyester or rayon)

Hex values are design targets — match to the nearest shade on the shop's thread chart.

**Front — 1 colour, 0 colour changes**

| # | Thread | Hex | Stitches |
|---|---|---|---|
| 1 | Black — logo + bar | `#111111` | 1,877 |

**Back — 4 colours, 3 colour changes**

| # | Thread | Hex | Elements | Stitches |
|---|---|---|---|---|
| 1 | Dark navy | `#1E2F6B` | HTML tags, `<!DOCTYPE html>`, `<` `>` `</…>` | 4,468 |
| 2 | Light blue | `#3D7CC9` | Attribute names `lang= charset= name= content= class=` | 1,423 |
| 3 | Green | `#3E8F4A` | Attribute values incl. quotes | 2,910 |
| 4 | Black | `#111111` | Text content (`Fluxen_web`, `Build Your Digital Future`, `Web Studio · …`) + bar, "Fluxen_web", "Ideas. Code. Products." | 5,080 |

## Stitch data (verified by decoding the written files)

| | Stitches | Colour changes | Trims | Jump moves¹ | Longest stitch | Shortest stitch |
|---|---|---|---|---|---|---|
| Front | **1,877** | 0 | 18 | 34 | 4.0 mm | 0.32 mm |
| Back | **13,881** | 3 | 175 | 539 | 2.5 mm | 0.28 mm² |

¹ As reported by pyembroidery after decoding (a trim is written as 3 consecutive jump records, the Tajima convention).
² 19 stitches of 0.28 mm on the back are 0.3 mm stitches quantised to the DST 0.1 mm grid.

Estimated sewing time at 650 spm: front ≈ 4 min, back ≈ 22 min + trims/colour changes (≈ 35–40 min total).

## Digitizing method

- **Code text (back):** Geist Mono Medium, the site's code font. Each glyph's centre line is extracted (skeleton of the outline) and sewn as a **bean / triple running stitch** (1.3 mm steps, shorter on curves) — the right technique for ~5 mm caps with a thin monospace stroke; satin would close the counters. Dots (`. · : i j !`) are small tack knots.
- **Brand lettering + bars:** **satin columns** following each stroke's medial axis, split at sharp corners, trimmed at junctions so strokes don't double up.
  - Density: 0.40 mm (zig-zag spacing per side).
  - Underlay: centre-run (2 mm stitches); columns ≥ 1.8 mm also get a zig-zag underlay inset 0.45 mm.
  - Pull compensation: +0.08 mm + 5 % of column width per side, max 0.18 mm (≈ 0.18 mm on the 1.9 mm front strokes, ≈ 0.13 mm on the 0.9 mm back strokes).
  - Back "Fluxen_web" stroke 0.93 mm, tagline 0.8 mm → still satin (minimum column width 0.9 mm).
- **Tie-in / tie-off** (0.6 mm lock stitches) at the start and end of every segment. Hops ≤ 3 mm between letters of a word are plain jumps; longer hops are trimmed.
- Stitching order: one pass per colour, lines serpentined to keep travel short.

## Recommended stabilizer and setup (white cotton jersey)

- **Backing:** medium **cut-away**, *white no-show polymesh* (fusible), 1 layer front; for the back (14k stitches, 25 cm field) 1 layer no-show mesh **plus** a layer of light tear-away, or a 2.5 oz cut-away. Do not use tear-away alone on jersey.
- **Topping:** water-soluble film on the back design — keeps the 4 mm code lettering on top of the knit loops.
- Needle **75/11 ballpoint**; speed 600–700 spm for the back code; hoop without stretching the knit (or float on adhesive backing).
- Trim backing to ~1 cm around the design after sewing; press from the reverse.

## Simplified / changed for embroidery

1. **Brand font is Geist SemiBold, not Block 2** (see top).
2. Code font: **Geist Mono Medium** (allowed by the brief for the HTML block).
3. Code text is a **running/bean stitch outline of the letter centre line**, not filled letters — the reference's thin code weight cannot be satin-stitched at 5 mm.
4. Indentation normalised to 2 spaces; the `viewport` line wraps after `width=device-width,` as in the reference (continuation aligned under `name=`).
5. Syntax colours made consistent: in the reference mockup `"width=device-width,` is blue while the rest of the same value is green; here **the whole value is green**.
6. Bottom bar thickness raised to 1.4 mm (reference ≈ 0.8 mm) so it can be a stable satin.
7. Small satin joins (e.g. `n`, `u`, `b`, `w`) use automatic patch columns; a digitizer may want to hand-tidy these corners in Wilcom/Hatch/Ink/Stitch before a large run.

## Validation status

| Check | Front | Back |
|---|---|---|
| Valid 512-byte DST header + END record | ✅ | ✅ |
| Decoded with independent decoder (`source/dstcheck.py`) | ✅ 1,877 st | ✅ 13,881 st |
| Read with pyembroidery 1.5.1, counts agree | ✅ | ✅ |
| Header CO matches colour changes | ✅ 0 | ✅ 3 |
| Bounds match header (+X/−X/+Y/−Y) | ✅ ±47.7 / ±10.9 mm | ✅ ±123.6 / ±117.8 mm |
| No stitch > 7 mm, none < 0.28 mm | ✅ | ✅ |
| Orientation (DST +Y up) checked by rendering decoded data upright | ✅ | ✅ |
| Opened in commercial embroidery software (Wilcom / Hatch / Tajima DG/ML) | ❌ not available here | ❌ |
| Physical test sew-out | ❌ **required before production** | ❌ |

## Rebuild

```bash
cd output/fluxen_web_white_tshirt/source
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
# with Block 2 (put exactly one .ttf/.otf in ../fonts/):
.venv/bin/python build.py
# current stand-in build:
.venv/bin/python build.py --brand-font ../../../node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2 --brand-wght 600 --brand-label "SUBSTITUTE: Geist SemiBold"
```
After a Block 2 rebuild, update the substitution notice and numbers in this file from `validation.json`.
