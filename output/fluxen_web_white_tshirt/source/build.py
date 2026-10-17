#!/usr/bin/env python3
"""Build the Fluxen_web white T-shirt embroidery set.

  python build.py --brand-font /path/to/Block2.ttf --out ../

Writes fluxen_web_white_front.dst / _back.dst, matching SVG artwork, stitch-
simulation PNGs (rendered from the decoded DST files) and validation.json.
The brand font is required on purpose: the logo is never set in a fallback.
"""
import argparse
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from fluxstitch import Font, Job, run_glyph_objects, realize_trail, trail_anchor, run_points  # noqa: E402
from satin import satin_glyph, satin_bar, column_stitches, column_polygon  # noqa: E402
from shapely.geometry import LineString  # noqa: E402
import dstcheck  # noqa: E402

DEFAULT_MONO = os.path.join(
    HERE, "..", "..", "..", "node_modules", "@fontsource", "geist-mono", "files",
    "geist-mono-latin-500-normal.woff")

THREADS = {
    "navy":  dict(name="Dark navy - HTML tags", hex="#1E2F6B"),
    "blue":  dict(name="Light blue - attribute names", hex="#3D7CC9"),
    "green": dict(name="Green - attribute values", hex="#3E8F4A"),
    "black": dict(name="Black - text content and brand", hex="#111111"),
}

LINES = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '  <head>',
    '    <meta charset="UTF-8">',
    '    <meta name="viewport" content="width=device-width,',
    '          initial-scale=1.0">',
    '    <title>Fluxen_web</title>',
    '  </head>',
    '  <body>',
    '    <div class="container">',
    '      <h1>Build Your Digital Future</h1>',
    '      <p>Web Studio · Websites · CRM · Web Apps</p>',
    '    </div>',
    '  </body>',
    '</html>',
]

# ---- layout (mm) -----------------------------------------------------------
CODE_EM = 7.7            # mono em -> 4.62 mm advance, ~5.5 mm caps, ~4.1 mm x-height
CODE_PITCH = 13.0        # baseline to baseline
FRONT_LOGO_W = 95.0      # ink width of "Fluxen_web" on the chest
FRONT_BAR = dict(w_ratio=0.19, h=1.8, gap_ratio=0.64)    # from the reference proportions
BACK_BRAND_W = 45.0      # ink width of bottom-left "Fluxen_web"
BACK_TAG_W = 70.0        # ink width of "Ideas. Code. Products."
BACK_BAR = dict(w=12.6, h=1.4, below_code=33.7)
BACK_BRAND_BELOW_CODE = 47.0     # last code baseline -> brand baseline
RUN_IF_STROKE_BELOW = 0.8        # mm: thinner brand strokes are run-stitched, not satin


def classify(lines):
    """Per-character syntax colour; state carries across the wrapped line."""
    out, state = [], "text"
    for ln in lines:
        cols = []
        for i, ch in enumerate(ln):
            if state == "value":
                cols.append("green")
                if ch == '"':
                    state = "attr"
            elif state == "text":
                if ch == "<":
                    state = "doctype" if ln[i:i + 2] == "<!" else "tagname"
                    cols.append("navy")
                else:
                    cols.append("black" if ch != " " else None)
            elif state == "doctype":
                cols.append("navy")
                if ch == ">":
                    state = "text"
            elif state == "tagname":
                if ch == ">":
                    cols.append("navy")
                    state = "text"
                elif ch == " ":
                    cols.append(None)
                    state = "attr"
                else:
                    cols.append("navy")
            elif state == "attr":
                if ch == '"':
                    cols.append("green")
                    state = "value"
                elif ch == ">":
                    cols.append("navy")
                    state = "text"
                elif ch == " ":
                    cols.append(None)
                else:
                    cols.append("blue")
        out.append(cols)
    return out


def ink_bbox(glyphs):
    xs = [x for g in glyphs for c in g["contours"] for x, _ in c]
    ys = [y for g in glyphs for c in g["contours"] for _, y in c]
    return min(xs), min(ys), max(xs), max(ys)


def set_text(font, text, ink_width, x_left=None, x_right=None, baseline=0.0):
    """Lay out text so its ink width is exactly `ink_width` mm."""
    probe, _ = font.layout(text, 100.0, 0, 0)
    x0, _, x1, _ = ink_bbox(probe)
    em = 100.0 * ink_width / (x1 - x0)
    gl, _ = font.layout(text, em, 0, baseline)
    bx0, _, bx1, _ = ink_bbox(gl)
    dx = (x_left - bx0) if x_left is not None else (x_right - bx1)
    for g in gl:
        g["contours"] = [[(x + dx, y) for x, y in c] for c in g["contours"]]
        g["x"] += dx
    return gl, em


# ---- stitching helpers -----------------------------------------------------

def satin_glyph_segments(contours, pen, notes):
    """Satin columns of one glyph, chained with short in-shape travel runs."""
    cols, shape = satin_glyph(contours)
    notes.setdefault("stroke_widths", []).append(
        round(float(sum(c["width"] for c in cols) / max(1, len(cols))), 2))
    inside = shape.buffer(-0.15)
    segs, cur = [], None
    cols = list(cols)
    while cols:
        best = min(cols, key=lambda c: min(math.dist(pen, c["rails"][0]["c"]),
                                           math.dist(pen, c["rails"][-1]["c"])))
        cols.remove(best)
        rev = math.dist(pen, best["rails"][-1]["c"]) < math.dist(pen, best["rails"][0]["c"])
        pts = column_stitches(best, reverse=rev)
        if cur is not None and inside.contains(LineString([cur[-1], pts[0]])):
            cur += run_points([cur[-1], pts[0]], L=1.8)[1:-1] + pts   # travel inside the letter
        else:
            if cur:
                segs.append(cur)
            cur = list(pts)
        pen = cur[-1]
    if cur:
        segs.append(cur)
    return segs, pen


def brand_text_segments(glyphs, pen, notes, force_run=False):
    out = []
    for g in sorted(glyphs, key=lambda g: g["x"]):
        if not g["contours"]:
            continue
        if force_run:
            trails = run_glyph_objects(g)
            while trails:
                t = min(trails, key=lambda t: math.dist(trail_anchor(t), pen))
                trails.remove(t)
                pts = realize_trail(t, pen)
                out.append(pts)
                pen = pts[-1]
        else:
            segs, pen = satin_glyph_segments(g["contours"], pen, notes)
            out += segs
    return out, pen


def bar_segment(x0, y0, x1, y1, pen):
    col = satin_bar(x0, y0, x1, y1)
    rev = math.dist(pen, col["rails"][-1]["c"]) < math.dist(pen, col["rails"][0]["c"])
    pts = column_stitches(col, reverse=rev)
    return pts, pts[-1]


def stroke_width_mm(glyphs):
    from fluxstitch import rasterize
    from scipy import ndimage
    from skimage.morphology import skeletonize
    import numpy as np
    vals = []
    for g in glyphs:
        if not g["contours"]:
            continue
        m, _ = rasterize(g["contours"], 30)
        d = ndimage.distance_transform_edt(m) / 30
        vals += list(d[skeletonize(m)])
    return 2 * float(np.median(vals))


# ---- SVG -------------------------------------------------------------------

def svg_doc(layers, bbox, title, margin=5.0):
    x0, y0, x1, y1 = bbox
    x0 -= margin
    y0 -= margin
    w, h = x1 - x0 + margin, y1 - y0 + margin
    out = [f'<?xml version="1.0" encoding="UTF-8"?>',
           f'<svg xmlns="http://www.w3.org/2000/svg" '
           f'xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" '
           f'width="{w:.2f}mm" height="{h:.2f}mm" viewBox="{x0:.3f} {y0:.3f} {w:.3f} {h:.3f}">',
           f'  <title>{title}</title>',
           '  <desc>Embroidery artwork, 1 user unit = 1 mm, true size. Text converted to outlines. '
           'One layer per thread colour in stitch order.</desc>']
    for name, hexc, shapes in layers:
        out.append(f'  <g id="{name}" inkscape:groupmode="layer" inkscape:label="{name}" '
                   f'fill="{hexc}" fill-rule="nonzero" stroke="none">')
        for s in shapes:
            if s[0] == "contours":
                d = " ".join("M " + " L ".join(f"{x:.3f} {y:.3f}" for x, y in c) + " Z" for c in s[1])
                out.append(f'    <path d="{d}"/>')
            elif s[0] == "rect":
                a, b, c, e = s[1]
                out.append(f'    <rect x="{a:.3f}" y="{b:.3f}" width="{c - a:.3f}" height="{e - b:.3f}"/>')
        out.append("  </g>")
    out.append("</svg>")
    return "\n".join(out) + "\n"


# ---- validation --------------------------------------------------------------

def validate(path, colors, png, scale):
    import pyembroidery as pe
    fields, recs = dstcheck.decode(path)
    st = dstcheck.stats(recs)
    pat = pe.read(path)
    pe_counts = dict(stitches=pat.count_stitch_commands(pe.STITCH),
                     jumps=pat.count_stitch_commands(pe.JUMP),
                     trims=pat.count_stitch_commands(pe.TRIM),
                     color_changes=pat.count_color_changes())
    dstcheck.render(recs, [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in colors],
                    png, scale=scale)
    header_ok = int(fields["ST"][0]) >= st["stitches"] and int(fields["CO"][0]) == st["color_changes"]
    return dict(file=os.path.basename(path), bytes=os.path.getsize(path), header=fields,
                decoded=st, pyembroidery=pe_counts, header_consistent=header_ok,
                stitch_records_match=(pe_counts["stitches"] == st["stitches"]))


# ---- main ------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--brand-font", help="Block 2 font file (default: the one file in ../fonts/)")
    ap.add_argument("--brand-wght", type=float, default=None, help="weight axis value if variable")
    ap.add_argument("--brand-label", default=None, help="human label for the brand font (e.g. substitution note)")
    ap.add_argument("--mono-font", default=DEFAULT_MONO)
    ap.add_argument("--out", default=os.path.join(HERE, ".."))
    a = ap.parse_args()
    if not a.brand_font:
        fdir = os.path.join(HERE, "..", "fonts")
        found = sorted(f for f in os.listdir(fdir) if f.lower().endswith((".ttf", ".otf", ".woff", ".woff2")))
        if len(found) != 1:
            sys.exit(f"Block 2 font not found: put exactly one Block 2 font file in {os.path.normpath(fdir)} "
                     f"(found {found}). The brand logo is never set in a substitute font.")
        a.brand_font = os.path.join(fdir, found[0])
    os.makedirs(a.out, exist_ok=True)

    brand = Font(a.brand_font, variations={"wght": a.brand_wght} if a.brand_wght else None)
    mono = Font(a.mono_font)
    for f, txt in ((brand, "Fluxen_webIdeas.CodeProducts"), (mono, "".join(LINES))):
        miss = f.has(txt)
        if miss:
            sys.exit(f"{f.path}: missing glyphs {miss!r}")
    report = dict(brand_font=dict(file=os.path.basename(a.brand_font), name=brand.name,
                                  wght=a.brand_wght, label=a.brand_label),
                  mono_font=dict(file=os.path.basename(a.mono_font), name=mono.name))

    # ------------------------------------------------------------ FRONT
    notes = {}
    logo, em = set_text(brand, "Fluxen_web", FRONT_LOGO_W, x_left=0.0, baseline=0.0)
    cap = brand.cap * em / brand.upm
    bar_w = FRONT_BAR["w_ratio"] * FRONT_LOGO_W
    bar_top = FRONT_BAR["gap_ratio"] * cap
    bar = (0.0, bar_top, bar_w, bar_top + FRONT_BAR["h"])
    sw = stroke_width_mm(logo)
    job = Job("FLUXEN_FRONT")
    job.color(THREADS["black"])
    segs, pen = brand_text_segments(logo, (0, 0), notes, force_run=sw < RUN_IF_STROKE_BELOW)
    for s in segs:
        job.add(s)
    pts, pen = bar_segment(*bar, pen)
    job.add(pts)
    job.build()
    front_dst = os.path.join(a.out, "fluxen_web_white_front.dst")
    job.write_dst(front_dst)
    bb = ink_bbox(logo)
    fb = (min(bb[0], bar[0]), bb[1], max(bb[2], bar[2]), max(bb[3], bar[3]))
    with open(os.path.join(a.out, "fluxen_web_front.svg"), "w") as fh:
        fh.write(svg_doc([("1_black", THREADS["black"]["hex"],
                           [("contours", c) for c in [g["contours"] for g in logo if g["contours"]]]
                           + [("rect", bar)])], fb, "Fluxen_web - white tee - front left chest"))
    report["front"] = dict(
        artwork_mm=dict(width=round(fb[2] - fb[0], 1), height=round(fb[3] - fb[1], 1)),
        logo_cap_height_mm=round(cap, 2), logo_stroke_mm=round(sw, 2),
        technique="satin" if sw >= RUN_IF_STROKE_BELOW else "bean run",
        bar_mm=[round(v, 2) for v in bar], build=job.stats,
        validation=validate(front_dst, [THREADS["black"]["hex"]],
                            os.path.join(a.out, "fluxen_web_front.png"), 30))

    # ------------------------------------------------------------ BACK
    cls = classify(LINES)
    items = []
    for li, (ln, cols) in enumerate(zip(LINES, cls)):
        gl, _ = mono.layout(ln, CODE_EM, 0.0, li * CODE_PITCH)
        for g, c in zip(gl, cols):
            if c and g["contours"]:
                items.append(dict(line=li, color=c, glyph=g))
    cb = ink_bbox([it["glyph"] for it in items])
    yb = (len(LINES) - 1) * CODE_PITCH
    base2 = yb + BACK_BRAND_BELOW_CODE
    b_logo, b_em = set_text(brand, "Fluxen_web", BACK_BRAND_W, x_left=cb[0], baseline=base2)
    tag, t_em = set_text(brand, "Ideas. Code. Products.", BACK_TAG_W, x_right=cb[2], baseline=base2)
    bcy = yb + BACK_BAR["below_code"]
    b_bar = (cb[0], bcy - BACK_BAR["h"] / 2, cb[0] + BACK_BAR["w"], bcy + BACK_BAR["h"] / 2)
    sw_logo, sw_tag = stroke_width_mm(b_logo), stroke_width_mm(tag)
    bnotes = {}

    def bottom(job, pen):
        pts, pen = bar_segment(*b_bar, pen)
        job.add(pts)
        for gl_, sw_ in ((b_logo, sw_logo), (tag, sw_tag)):
            segs, pen = brand_text_segments(gl_, pen, bnotes, force_run=sw_ < RUN_IF_STROKE_BELOW)
            for s in segs:
                job.add(s)
        return pen

    job = Job("FLUXEN_BACK")
    pen = (0.0, 0.0)
    for color in ("navy", "blue", "green", "black"):
        job.color(THREADS[color])
        sel = [it for it in items if it["color"] == color]
        for k, li in enumerate(sorted({it["line"] for it in sel})):
            row = sorted([it for it in sel if it["line"] == li], key=lambda it: it["glyph"]["x"],
                         reverse=(k % 2 == 1))
            for it in row:
                trails = run_glyph_objects(it["glyph"])
                while trails:
                    t = min(trails, key=lambda t: math.dist(trail_anchor(t), pen))
                    trails.remove(t)
                    pts = realize_trail(t, pen)
                    job.add(pts)
                    pen = pts[-1]
        if color == "black":
            pen = bottom(job, pen)
    job.build()
    back_dst = os.path.join(a.out, "fluxen_web_white_back.dst")
    job.write_dst(back_dst)
    allg = [it["glyph"] for it in items] + b_logo + tag
    bb = ink_bbox([g for g in allg if g["contours"]])
    layers = []
    for i, color in enumerate(("navy", "blue", "green", "black"), 1):
        shapes = [("contours", it["glyph"]["contours"]) for it in items if it["color"] == color]
        if color == "black":
            shapes += [("rect", b_bar)] + [("contours", g["contours"]) for g in b_logo + tag if g["contours"]]
        layers.append((f"{i}_{color}", THREADS[color]["hex"], shapes))
    with open(os.path.join(a.out, "fluxen_web_back.svg"), "w") as fh:
        fh.write(svg_doc(layers, bb, "Fluxen_web - white tee - back"))
    report["back"] = dict(
        artwork_mm=dict(width=round(bb[2] - bb[0], 1), height=round(bb[3] - bb[1], 1)),
        code=dict(em_mm=CODE_EM, advance_mm=round(CODE_EM * 0.6, 2),
                  cap_height_mm=round(mono.cap * CODE_EM / mono.upm, 2),
                  x_height_mm=round(mono.xh * CODE_EM / mono.upm, 2), line_pitch_mm=CODE_PITCH,
                  width_mm=round(cb[2] - cb[0], 1), technique="bean (triple) run on glyph centrelines"),
        brand=dict(cap_height_mm=round(brand.cap * b_em / brand.upm, 2), stroke_mm=round(sw_logo, 2),
                   technique="satin" if sw_logo >= RUN_IF_STROKE_BELOW else "bean run"),
        tagline=dict(cap_height_mm=round(brand.cap * t_em / brand.upm, 2), stroke_mm=round(sw_tag, 2),
                     technique="satin" if sw_tag >= RUN_IF_STROKE_BELOW else "bean run"),
        bar_mm=[round(v, 2) for v in b_bar], build=job.stats,
        validation=validate(back_dst, [THREADS[c]["hex"] for c in ("navy", "blue", "green", "black")],
                            os.path.join(a.out, "fluxen_web_back.png"), 12))
    report["threads"] = THREADS
    with open(os.path.join(a.out, "validation.json"), "w") as fh:
        json.dump(report, fh, indent=2, default=str)
    print(json.dumps({k: report[k]["validation"]["decoded"] for k in ("front", "back")}, indent=1))


if __name__ == "__main__":
    main()
