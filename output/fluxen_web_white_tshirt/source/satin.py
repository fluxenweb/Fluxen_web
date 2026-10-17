"""Medial-axis satin digitizing for brand lettering + rectangular satin bars."""
import math
import numpy as np
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import unary_union
from shapely.prepared import prep
from fluxstitch import (rasterize, skeleton_graph, contours_to_shape, degree, plen,
                        smooth, simplify, run_points)

SATIN_SPACING = 0.40     # mm between satin penetrations along the column (per side)
PULL = 0.18              # mm pull compensation added on each side (knit cotton)
UNDERLAY_LEN = 2.0       # mm stitch length for centre-run underlay
MIN_WIDTH = 0.9          # mm: narrower columns are widened to this
ZIGZAG_UNDERLAY_FROM = 1.8   # mm column width from which a zig-zag underlay is added


def _ang(v):
    return math.atan2(v[1], v[0])


def _dang(a, b):
    return abs((a - b + math.pi) % (2 * math.pi) - math.pi)


def _dir_from(pts, n_mm):
    """Direction leaving pts[0] measured over ~n_mm."""
    acc, p0 = 0, pts[0]
    for q in pts[1:]:
        acc = math.dist(p0, q)
        if acc >= n_mm:
            return _ang((q[0] - p0[0], q[1] - p0[1]))
    q = pts[-1]
    return _ang((q[0] - p0[0], q[1] - p0[1]))


def build_strokes(nodes, edges, width):
    """Join skeleton branches through junctions where they continue straight."""
    edges = [dict(e) for e in edges]
    used = [False] * len(edges)
    inc = {}
    for i, e in enumerate(edges):
        inc.setdefault(e["a"], []).append(i)
        inc.setdefault(e["b"], []).append(i)

    def oriented(i, start_node):
        e = edges[i]
        return (e["pts"], e["b"]) if e["a"] == start_node else (e["pts"][::-1], e["a"])

    order = sorted(range(len(edges)), key=lambda i: -plen(edges[i]["pts"]))
    strokes = []
    for i in order:
        if used[i]:
            continue
        used[i] = True
        e = edges[i]
        path = list(e["pts"])
        ends = [e["a"], e["b"]]
        for side in (1, 0):        # extend forward from b, then backward from a
            while True:
                node = ends[side]
                if side == 1:
                    tail = path[::-1]
                else:
                    tail = path
                incoming = _dir_from(tail, width) + math.pi
                best, bestd = None, math.radians(40)
                for j in inc.get(node, []):
                    if used[j]:
                        continue
                    pts, other = oriented(j, node)
                    dd = _dang(_dir_from(pts, width), incoming)
                    if dd < bestd:
                        best, bestd = (j, pts, other), dd
                if not best:
                    break
                j, pts, other = best
                used[j] = True
                if side == 1:
                    path = path + pts[1:]
                else:
                    path = pts[::-1][:-1] + path
                ends[side] = other
                if other == ends[1 - side]:
                    break
        strokes.append(dict(pts=path, a=ends[0], b=ends[1]))
    return strokes


def split_corners(stroke, width, max_turn=62):
    """Split a stroke where its direction turns sharply within ~one stroke width."""
    pts = stroke["pts"]
    if plen(pts) < 2 * width:
        return [stroke]
    dense = resample(pts, 0.1)
    w = max(2, int(width * 0.6 / 0.1))
    cuts = []
    i = w
    while i < len(dense) - w:
        a = _ang((dense[i][0] - dense[i - w][0], dense[i][1] - dense[i - w][1]))
        b = _ang((dense[i + w][0] - dense[i][0], dense[i + w][1] - dense[i][1]))
        if math.degrees(_dang(a, b)) > max_turn:
            # local maximum of turn
            best, bi = 0, i
            for k in range(i, min(len(dense) - w, i + 2 * w)):
                a2 = _ang((dense[k][0] - dense[k - w][0], dense[k][1] - dense[k - w][1]))
                b2 = _ang((dense[k + w][0] - dense[k][0], dense[k + w][1] - dense[k][1]))
                t = _dang(a2, b2)
                if t > best:
                    best, bi = t, k
            cuts.append(bi)
            i = bi + 2 * w
        else:
            i += 1
    if not cuts:
        return [stroke]
    out, last = [], 0
    for c in cuts + [len(dense) - 1]:
        cut = int(0.45 * width / 0.1)
        seg = dense[last + (cut if last > 0 else 0): c + 1 - (cut if c < len(dense) - 1 else 0)]
        if len(seg) > 3:
            out.append(dict(pts=seg, a=None, b=None, corner_start=last > 0,
                            corner_end=c < len(dense) - 1))
        last = c
    out[0]["a"], out[-1]["b"] = stroke["a"], stroke["b"]
    return out


def resample(pts, step):
    ls = LineString(pts)
    L = ls.length
    n = max(1, int(round(L / step)))
    return [tuple(ls.interpolate(L * i / n).coords[0]) for i in range(n + 1)]


def _ray(boundary, p, d, maxlen):
    q = (p[0] + d[0] * maxlen, p[1] + d[1] * maxlen)
    inter = boundary.intersection(LineString([p, q]))
    if inter.is_empty:
        return None
    best = None
    for g in getattr(inter, "geoms", [inter]):
        for c in getattr(g, "coords", []):
            dd = math.dist(c, p)
            if best is None or dd < best:
                best = dd
    return best


def column_rails(shape, pts, dist, org, res, spacing):
    """Sample centreline and find left/right rail by ray casting to the outline."""
    bnd = shape.boundary
    c = resample(pts, spacing)
    n = len(c)
    rails = []
    win = max(1, int(0.6 / spacing))
    for i in range(n):
        a, b = c[max(0, i - win)], c[min(n - 1, i + win)]
        tx, ty = b[0] - a[0], b[1] - a[1]
        L = math.hypot(tx, ty) or 1
        tx, ty = tx / L, ty / L
        nx, ny = -ty, tx
        r, col = int((c[i][1] - org[1]) * res), int((c[i][0] - org[0]) * res)
        h = dist[min(max(r, 0), dist.shape[0] - 1), min(max(col, 0), dist.shape[1] - 1)]
        h = max(h, 0.2)
        hl = _ray(bnd, c[i], (nx, ny), 2.2 * h)
        hr = _ray(bnd, c[i], (-nx, -ny), 2.2 * h)
        hl = h if hl is None else min(max(hl, 0.6 * h), 1.8 * h)
        hr = h if hr is None else min(max(hr, 0.6 * h), 1.8 * h)
        rails.append(dict(c=c[i], n=(nx, ny), t=(tx, ty), hl=hl, hr=hr, h=h))
    return rails


def extend_end(shape, rails, at_start, dist_h):
    """Extend a free terminal to the outline along the tangent."""
    r = rails[0] if at_start else rails[-1]
    t = r["t"] if not at_start else (-r["t"][0], -r["t"][1])
    L = _ray(shape.boundary, r["c"], t, 3 * r["h"]) or r["h"]
    out = []
    k = 1
    st = SATIN_SPACING / 2
    H = max(r["hl"], r["hr"], r["h"])
    while k * st < L - 0.06:
        p = (r["c"][0] + t[0] * k * st, r["c"][1] + t[1] * k * st)
        if not shape.contains(Point(p)):
            break
        hl = _ray(shape.boundary, p, r["n"], 1.25 * H)
        hr = _ray(shape.boundary, p, (-r["n"][0], -r["n"][1]), 1.25 * H)
        hl = r["hl"] if hl is None else min(hl, 1.25 * H)
        hr = r["hr"] if hr is None else min(hr, 1.25 * H)
        out.append(dict(c=p, n=r["n"], t=r["t"], hl=hl, hr=hr, h=r["h"]))
        k += 1
    return (out[::-1] + rails) if at_start else (rails + out)


def satin_glyph(contours, res=25, spacing=SATIN_SPACING, debug=None):
    """Return list of columns; each column = dict(rails, centre) ready for stitching."""
    shape = contours_to_shape(contours)
    mask, org = rasterize(contours, res)
    from scipy import ndimage
    dist0 = ndimage.distance_transform_edt(mask) / res
    from skimage.morphology import skeletonize
    sk = skeletonize(mask)
    width = 2 * float(np.median(dist0[sk]))          # typical stroke width (on the medial axis)
    nodes, edges, dist = skeleton_graph(mask, res, org, spur_mm=0.85 * width)
    nodes, edges = contract_short(nodes, edges, 0.6 * width)
    for e in edges:
        e["pts"] = simplify(smooth(e["pts"], k=int(0.25 * res)), 0.02)
    d = degree(edges)
    strokes = build_strokes(nodes, edges, width)
    pieces = []
    for s in strokes:
        pieces += split_corners(s, width)
    pieces.sort(key=lambda p: -plen(p["pts"]))
    covered = None
    cols = []
    for p in pieces:
        if plen(p["pts"]) < 0.3:
            continue
        rails = column_rails(shape, p["pts"], dist, org, res, spacing / 2)
        free_a = p["a"] is not None and d.get(p["a"], 0) == 1
        free_b = p["b"] is not None and d.get(p["b"], 0) == 1
        corner_a, corner_b = p.get("corner_start"), p.get("corner_end")
        # extend free terminals and corner-dominant ends to the outline
        if free_a or corner_a or p["a"] is not None:
            rails = extend_end(shape, rails, True, None)
        if free_b or corner_b or p["b"] is not None:
            rails = extend_end(shape, rails, False, None)
        # trim ends that lie inside already-covered columns (junctions / corners)
        if covered is not None:
            inside = prep(covered.buffer(0.1))
            keep = max(1, int(round(0.3 / (spacing / 2))))     # ~0.3 mm overlap into neighbour
            k = 0
            while k < len(rails) and inside.contains(Point(rails[k]["c"])):
                k += 1
            rails = rails[max(0, k - keep):] if k < len(rails) else []
            k = 0
            while k < len(rails) and inside.contains(Point(rails[-1 - k]["c"])):
                k += 1
            rails = rails[:len(rails) - max(0, k - keep)] if k < len(rails) else []
        if len(rails) < 2:
            continue
        poly = column_polygon(rails)
        covered = poly if covered is None else unary_union([covered, poly])
        cols.append(dict(rails=rails, width=width))
    # gap filler: satin across any outline area the columns missed (feet, joins, dots)
    if True:
        rest = shape if covered is None else shape.difference(covered.buffer(0.08))
        for g in getattr(rest, "geoms", [rest]):
            if g.geom_type != "Polygon" or g.area < (0.15 if covered is not None else 0.05):
                continue
            col = patch_column(g, spacing)
            if col:
                cols.append(col)
                covered = g if covered is None else unary_union([covered, g])
    if debug is not None:
        debug.update(shape=shape, strokes=strokes, pieces=pieces, width=width, covered=covered)
    return cols, shape


def column_polygon(rails):
    """Area actually covered by a column: union of the quads between rail pairs
    (robust for closed bowls, where a single outline polygon would fill the counter)."""
    L = [(r["c"][0] + r["n"][0] * r["hl"], r["c"][1] + r["n"][1] * r["hl"]) for r in rails]
    R = [(r["c"][0] - r["n"][0] * r["hr"], r["c"][1] - r["n"][1] * r["hr"]) for r in rails]
    quads = []
    for i in range(len(rails) - 1):
        q = Polygon([L[i], L[i + 1], R[i + 1], R[i]])
        if not q.is_valid:
            q = q.buffer(0)
        quads.append(q)
    return unary_union(quads).buffer(0.05)


def column_stitches(col, reverse=False):
    """Underlay (centre run + light zig-zag) out, satin back.  Returns needle points."""
    rails = col["rails"][::-1] if reverse else col["rails"]
    centre = [r["c"] for r in rails]
    width = np.median([r["hl"] + r["hr"] for r in rails])
    pts = run_points(centre, L=UNDERLAY_LEN, max_turn=25)
    if width >= ZIGZAG_UNDERLAY_FROM:
        # zig-zag underlay back to the start, inset from the edges
        zz = []
        step = max(1, int(round(1.6 / (SATIN_SPACING / 2))))
        for k, i in enumerate(range(len(rails) - 1, -1, -step)):
            r = rails[i]
            inset = 0.45
            sgn = 1 if k % 2 == 0 else -1
            hh = (r["hl"] if sgn > 0 else r["hr"]) - inset
            hh = max(hh, 0.1)
            zz.append((r["c"][0] + r["n"][0] * hh * sgn, r["c"][1] + r["n"][1] * hh * sgn))
        zz.append(rails[0]["c"])
        pts += zz
        # then satin outwards again (start -> end)
        order = rails
    else:
        order = rails[::-1]
    sat = []
    for i, r in enumerate(order):
        hl, hr = r["hl"], r["hr"]
        w = hl + hr
        if w < MIN_WIDTH:
            grow = (MIN_WIDTH - w) / 2
            hl, hr = hl + grow, hr + grow
        pull = min(PULL, 0.08 + 0.05 * (hl + hr))     # narrower columns get less pull comp
        hl += pull
        hr += pull
        a = (r["c"][0] + r["n"][0] * hl, r["c"][1] + r["n"][1] * hl)
        b = (r["c"][0] - r["n"][0] * hr, r["c"][1] - r["n"][1] * hr)
        sat.append(a if i % 2 == 0 else b)
    sat = _short_stitch(sat)
    return pts + sat


def _short_stitch(sat, min_gap=0.18):
    """Thin out penetrations crowding on the inside of tight curves."""
    out = [sat[0]]
    for i in range(1, len(sat)):
        p = sat[i]
        if i >= 2 and math.dist(p, sat[i - 2]) < min_gap:
            # pull this penetration 25% toward the opposite side (short stitch)
            q = sat[i - 1]
            p = (p[0] + (q[0] - p[0]) * 0.25, p[1] + (q[1] - p[1]) * 0.25)
        out.append(p)
    return out


def satin_bar(x0, y0, x1, y1):
    """Horizontal rectangle (mm) as one satin column with centre-run underlay."""
    h = (y1 - y0) / 2
    yc = (y0 + y1) / 2
    n = max(2, int(round((x1 - x0) / (SATIN_SPACING / 2))))
    rails = []
    for i in range(n + 1):
        x = x0 + (x1 - x0) * i / n
        rails.append(dict(c=(x, yc), n=(0, -1), t=(1, 0), hl=h, hr=h, h=h))
    return dict(rails=rails, width=2 * h)


def order_columns(cols, pen):
    """Greedy: next column = the one whose nearer end is closest to the pen."""
    cols = list(cols)
    out = []
    while cols:
        best = min(cols, key=lambda c: min(math.dist(pen, c["rails"][0]["c"]),
                                           math.dist(pen, c["rails"][-1]["c"])))
        cols.remove(best)
        rev = math.dist(pen, best["rails"][-1]["c"]) < math.dist(pen, best["rails"][0]["c"])
        pts = column_stitches(best, reverse=rev)
        out.append(pts)
        pen = pts[-1]
    return out, pen


def contract_short(nodes, edges, min_len):
    """Collapse tiny junction-to-junction edges, self-loops and duplicate parallels."""
    from fluxstitch import prune_spurs
    changed = True
    while changed:
        changed = False
        d = degree(edges)
        for e in list(edges):
            L = plen(e["pts"])
            if e["a"] == e["b"]:
                if L < 3 * min_len:
                    edges.remove(e)
                    changed = True
                    break
                continue
            if d.get(e["a"], 0) >= 3 and d.get(e["b"], 0) >= 3 and L < min_len:
                keep, gone = e["a"], e["b"]
                mid = tuple(np.mean([nodes[keep], nodes[gone]], axis=0))
                nodes[keep] = mid
                edges.remove(e)
                for f in edges:
                    for end, idx in (("a", 0), ("b", -1)):
                        if f[end] == gone:
                            f[end] = keep
                    if f["a"] == keep:
                        f["pts"][0] = mid
                    if f["b"] == keep:
                        f["pts"][-1] = mid
                changed = True
                break
        if changed:
            continue
        # parallel duplicates: keep the shorter one
        seen = {}
        for e in list(edges):
            key = tuple(sorted((e["a"], e["b"])))
            if key in seen and e["a"] != e["b"]:
                o = seen[key]
                if abs(plen(o["pts"]) - plen(e["pts"])) < 3 * min_len:
                    edges.remove(e if plen(e["pts"]) >= plen(o["pts"]) else o)
                    changed = True
                    break
            seen[key] = e
    return prune_spurs(nodes, edges, min_len * 1.4)


def patch_column(poly, spacing):
    """Satin across the short axis of a small leftover region."""
    mrr = poly.minimum_rotated_rectangle
    c = list(mrr.exterior.coords)[:4]
    e1 = (c[1][0] - c[0][0], c[1][1] - c[0][1])
    e2 = (c[2][0] - c[1][0], c[2][1] - c[1][1])
    long_, short = (e1, e2) if math.hypot(*e1) >= math.hypot(*e2) else (e2, e1)
    Lg = math.hypot(*long_)
    if Lg < 0.3:
        return None
    u = (long_[0] / Lg, long_[1] / Lg)
    v = (-u[1], u[0])
    cen = poly.centroid
    grown = poly.buffer(0.15)
    proj = [((x - cen.x) * u[0] + (y - cen.y) * u[1]) for x, y in grown.exterior.coords]
    lo, hi = min(proj), max(proj)
    rails, st = [], spacing / 2
    t = lo + st / 2
    while t < hi:
        p = (cen.x + u[0] * t, cen.y + u[1] * t)
        line = LineString([(p[0] - v[0] * 20, p[1] - v[1] * 20), (p[0] + v[0] * 20, p[1] + v[1] * 20)])
        inter = grown.intersection(line)
        segs = [g for g in getattr(inter, "geoms", [inter]) if g.geom_type == "LineString" and g.length > 0.05]
        if segs:
            sg = max(segs, key=lambda g: g.length)
            a, b = sg.coords[0], sg.coords[-1]
            m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
            h = sg.length / 2
            nn = ((a[0] - m[0]) / h, (a[1] - m[1]) / h)
            rails.append(dict(c=m, n=nn, t=u, hl=h, hr=h, h=h))
        t += st
    if len(rails) < 2:
        return None
    return dict(rails=rails, width=2 * max(r["h"] for r in rails), patch=True)
