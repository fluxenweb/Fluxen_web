"""fluxstitch — small, explicit embroidery digitizing toolkit (mm units, y down).

Pipeline:  font outline -> raster -> skeleton graph -> stitch objects -> DST.
  * run_text   : bean (triple) running stitch on glyph centerlines (small code text)
  * satin_text : medial-axis satin columns with center-run underlay (brand lettering)
  * satin_bar  : rectangular satin column (rules / underline bars)
All geometry is in millimetres; pyembroidery receives 0.1 mm units.
"""
import math
import numpy as np
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
import uharfbuzz as hb
from PIL import Image, ImageDraw
from scipy import ndimage
from skimage.morphology import skeletonize
from shapely.geometry import Polygon, LineString, Point
from shapely.ops import unary_union

# ---------------------------------------------------------------- fonts


class _FlattenPen(BasePen):
    def __init__(self, gs, steps=10):
        super().__init__(gs)
        self.contours, self.cur, self.steps = [], None, steps

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        n = self.steps + 4
        for i in range(1, n + 1):
            t = i / n
            mt = 1 - t
            self.cur.append((
                mt**3*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t**3*p3[0],
                mt**3*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t**3*p3[1]))

    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        n = self.steps
        for i in range(1, n + 1):
            t = i / n
            mt = 1 - t
            self.cur.append((mt*mt*p0[0] + 2*mt*t*p1[0] + t*t*p2[0],
                             mt*mt*p0[1] + 2*mt*t*p1[1] + t*t*p2[1]))

    def _closePath(self):
        if self.cur and len(self.cur) > 2:
            self.contours.append(self.cur)
        self.cur = None

    _endPath = _closePath


class Font:
    def __init__(self, path, variations=None):
        self.path = path
        self.tt = TTFont(path)
        if variations and "fvar" in self.tt:
            from fontTools.varLib import instancer
            self.tt = instancer.instantiateVariableFont(self.tt, variations)
        try:                                   # merge overlapping contours (variable/static instances)
            from fontTools.ttLib.removeOverlaps import removeOverlaps
            removeOverlaps(self.tt)
        except Exception as exc:               # pragma: no cover - reported, raster is nonzero-safe
            print("removeOverlaps skipped:", exc)
        self.gs = self.tt.getGlyphSet()
        self.upm = self.tt["head"].unitsPerEm
        os2 = self.tt["OS/2"]
        self.cap = getattr(os2, "sCapHeight", 0) or 0.7 * self.upm
        self.xh = getattr(os2, "sxHeight", 0) or 0.5 * self.upm
        self.name = self.tt["name"].getDebugName(4)
        import io
        buf = io.BytesIO()
        self.tt.flavor = None
        self.tt.save(buf)
        self.hbfont = hb.Font(hb.Face(buf.getvalue()))
        self.order = self.tt.getGlyphOrder()

    def has(self, text):
        cmap = self.tt.getBestCmap()
        return [c for c in text if ord(c) not in cmap and c != " "]

    def layout(self, text, em_mm, x0, baseline, tracking_mm=0.0):
        """Shape `text`; return list of glyphs {char, contours(mm, y-down), x, adv}."""
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hbfont, buf, {"kern": True, "liga": False, "calt": False})
        s = em_mm / self.upm
        out, pen_x = [], x0
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            gname = self.order[info.codepoint]
            ch = text[info.cluster]
            p = _FlattenPen(self.gs)
            self.gs[gname].draw(p)
            ox = pen_x + pos.x_offset * s
            oy = baseline - pos.y_offset * s
            contours = [[(ox + x * s, oy - y * s) for x, y in c] for c in p.contours]
            out.append(dict(char=ch, contours=contours, x=pen_x, adv=pos.x_advance * s))
            pen_x += pos.x_advance * s + tracking_mm
        return out, pen_x - tracking_mm

# ---------------------------------------------------------------- raster / skeleton


def signed_area(c):
    a = 0.0
    for (x1, y1), (x2, y2) in zip(c, c[1:] + c[:1]):
        a += x1 * y2 - x2 * y1
    return a / 2


def contours_to_shape(contours):
    """Outline -> shapely geometry using containment depth (direction-agnostic):
    a contour nested inside an odd number of others is a counter."""
    polys = [Polygon(c).buffer(0) for c in contours if len(c) > 2]
    polys = [p for p in polys if p.area > 1e-6]
    order = sorted(range(len(polys)), key=lambda k: -polys[k].area)
    shp = None
    for k in order:
        p = polys[k]
        rp = p.representative_point()
        depth = sum(1 for m in order if m != k and polys[m].area > p.area and polys[m].contains(rp))
        if shp is None:
            shp = p
        elif depth % 2 == 0:
            shp = shp.union(p)
        else:
            shp = shp.difference(p)
    return shp.buffer(0) if shp is not None else Polygon()


def rasterize(contours, res, margin=1.0):
    xs = [x for c in contours for x, _ in c]
    ys = [y for c in contours for _, y in c]
    x0, y0 = min(xs) - margin, min(ys) - margin
    w = int(math.ceil((max(xs) - x0 + margin) * res))
    h = int(math.ceil((max(ys) - y0 + margin) * res))
    wind = np.zeros((h, w), np.int32)
    for c in contours:
        im = Image.new("L", (w, h), 0)
        ImageDraw.Draw(im).polygon([((x - x0) * res, (y - y0) * res) for x, y in c], fill=1)
        wind += np.sign(signed_area(c)).astype(np.int32) * np.asarray(im, np.int32)
    return wind != 0, (x0, y0)


_N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def skeleton_graph(mask, res, origin, spur_mm=0.4):
    """Skeletonize a boolean raster and return (nodes, edges) in mm.

    nodes: {id: (x, y)};  edges: list of dict(a, b, pts[(x,y)...])
    """
    skel = skeletonize(mask)
    dist = ndimage.distance_transform_edt(mask) / res
    pix = set(zip(*np.nonzero(skel)))
    if not pix:
        return {}, [], dist

    def nb(p):
        return [(p[0] + dy, p[1] + dx) for dy, dx in _N8 if (p[0] + dy, p[1] + dx) in pix]

    deg = {p: len(nb(p)) for p in pix}
    junc = {p for p in pix if deg[p] >= 3}
    # cluster junction pixels
    node_of, nodes, nid = {}, {}, 0
    for p in junc:
        if p in node_of:
            continue
        stack, members = [p], []
        node_of[p] = nid
        while stack:
            q = stack.pop()
            members.append(q)
            for r in nb(q):
                if r in junc and r not in node_of:
                    node_of[r] = nid
                    stack.append(r)
        nodes[nid] = members
        nid += 1
    for p in pix:
        if deg[p] <= 1:
            node_of[p] = nid
            nodes[nid] = [p]
            nid += 1

    def to_mm(p):
        return (origin[0] + (p[1] + 0.5) / res, origin[1] + (p[0] + 0.5) / res)

    node_xy = {k: tuple(np.mean([to_mm(m) for m in v], axis=0)) for k, v in nodes.items()}
    edges, used = [], set()

    def trace(start, first):
        path, prev, cur = [start, first], start, first
        used.add(first)
        while cur not in node_of:
            nxt = [r for r in nb(cur) if r != prev and r not in used and r not in path[-3:]]
            nxt_nodes = [r for r in nb(cur) if r in node_of and r != prev and node_of[r] != node_of.get(start)]
            if not nxt and nxt_nodes:
                nxt = nxt_nodes
            if not nxt:
                cand = [r for r in nb(cur) if r in node_of and r != prev]
                if cand:
                    nxt = cand
                else:
                    break
            # prefer stepping onto a node if one is adjacent
            nn = [r for r in nxt if r in node_of]
            prev, cur = cur, (nn[0] if nn else nxt[0])
            if cur not in node_of:
                used.add(cur)
            path.append(cur)
        return path

    seen_direct = set()
    for k, members in nodes.items():
        for m in members:
            for q in nb(m):
                if q in node_of:
                    if node_of[q] != k:
                        key = tuple(sorted((k, node_of[q])))
                        if key not in seen_direct:
                            seen_direct.add(key)
                            edges.append(dict(a=k, b=node_of[q], px=[m, q]))
                    continue
                if q in used:
                    continue
                path = trace(m, q)
                end = path[-1]
                b = node_of.get(end)
                if b is None:           # dead end inside chain (rare) -> make endpoint
                    b = nid
                    nodes[nid] = [end]
                    node_xy[nid] = to_mm(end)
                    node_of[end] = nid
                    nid += 1
                edges.append(dict(a=k, b=b, px=path))
    # pure loops (no nodes)
    rest = pix - used - set(node_of)
    while rest:
        p = next(iter(rest))
        node_of[p] = nid
        nodes[nid] = [p]
        node_xy[nid] = to_mm(p)
        loop_start = nid
        nid += 1
        for q in nb(p):
            if q not in used and q not in node_of:
                path = trace(p, q)
                edges.append(dict(a=loop_start, b=node_of.get(path[-1], loop_start), px=path))
                break
        rest = pix - used - set(node_of)

    for e in edges:
        pts = [to_mm(p) for p in e["px"]]
        pts[0], pts[-1] = node_xy[e["a"]], node_xy[e["b"]]
        e["pts"] = pts
        del e["px"]
    nodes_mm = dict(node_xy)
    nodes_mm, edges = prune_spurs(nodes_mm, edges, spur_mm)
    for e in edges:
        e["pts"] = smooth(e["pts"], k=max(1, int(0.12 * res)))
    return nodes_mm, edges, dist


def plen(pts):
    return sum(math.dist(a, b) for a, b in zip(pts, pts[1:]))


def degree(edges):
    d = {}
    for e in edges:
        d[e["a"]] = d.get(e["a"], 0) + 1
        d[e["b"]] = d.get(e["b"], 0) + 1
    return d


def prune_spurs(nodes, edges, spur_mm, fork_mm=1.1):
    changed = True
    while changed:
        changed = False
        d = degree(edges)
        for e in list(edges):
            ta, tb = d[e["a"]] == 1, d[e["b"]] == 1
            if (ta ^ tb) and plen(e["pts"]) < spur_mm:
                hub = e["b"] if ta else e["a"]
                if d[hub] >= 3:
                    edges.remove(e)
                    changed = True
                    break
        if changed:
            continue
        # terminal forks: a degree-3 hub with two short end-branches splayed < 100 deg
        # (skeleton of an angled stroke terminal) -> keep the branch that continues
        # the incoming stroke, drop the other
        for hub, k in d.items():
            if k != 3:
                continue
            es = [e for e in edges if hub in (e["a"], e["b"])]
            term = [e for e in es if d[e["b"] if e["a"] == hub else e["a"]] == 1
                    and plen(e["pts"]) < fork_mm]
            if len(term) != 2:
                continue
            main = [e for e in es if e not in term][0]

            def away(e, n=6):
                pts = e["pts"] if e["a"] == hub else e["pts"][::-1]
                q = pts[min(n, len(pts) - 1)]
                p = pts[0]
                return math.atan2(q[1] - p[1], q[0] - p[0])
            a1, a2, am = away(term[0]), away(term[1]), away(main, 12)
            spread = abs((a1 - a2 + math.pi) % (2 * math.pi) - math.pi)
            if spread > math.radians(135):
                continue
            straight = lambda a: abs((a - am + math.pi) % (2 * math.pi) - math.pi)
            drop = term[0] if straight(a1) < straight(a2) else term[1]
            edges.remove(drop)
            changed = True
            break
        if changed:
            continue
        # merge degree-2 nodes
        d = degree(edges)
        for n, k in d.items():
            if k == 2:
                es = [e for e in edges if n in (e["a"], e["b"])]
                if len(es) == 2 and es[0] is not es[1]:
                    e1, e2 = es
                    p1 = e1["pts"] if e1["b"] == n else e1["pts"][::-1]
                    a = e1["a"] if e1["b"] == n else e1["b"]
                    p2 = e2["pts"] if e2["a"] == n else e2["pts"][::-1]
                    b = e2["b"] if e2["a"] == n else e2["a"]
                    edges.remove(e1)
                    edges.remove(e2)
                    edges.append(dict(a=a, b=b, pts=p1 + p2[1:]))
                    changed = True
                    break
    return nodes, edges


def smooth(pts, k=2):
    if len(pts) < 5 or k < 1:
        return pts
    a = np.array(pts, float)
    closed = math.dist(pts[0], pts[-1]) < 1e-6
    out = a.copy()
    n = len(a)
    for i in range(n):
        if not closed and (i == 0 or i == n - 1):
            continue
        lo, hi = i - k, i + k + 1
        if closed:
            idx = [(j % (n - 1)) for j in range(lo, hi)]
        else:
            w = min(i, n - 1 - i, k)
            idx = list(range(i - w, i + w + 1))
        out[i] = a[idx].mean(axis=0)
    if closed:
        out[-1] = out[0]
    return [tuple(p) for p in out]


def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    return list(LineString(pts).simplify(tol, preserve_topology=False).coords)

# ---------------------------------------------------------------- routing (Euler trail)


def components(nodes, edges):
    parent = {n: n for n in nodes}

    def f(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for e in edges:
        parent[f(e["a"])] = f(e["b"])
    groups = {}
    for i, e in enumerate(edges):
        groups.setdefault(f(e["a"]), []).append(i)
    return list(groups.values())


def euler_route(nodes, edges, idxs, start_near):
    """Cover edges[idxs] with one continuous trail (duplicating shortest paths
    between odd nodes as 'travel'). Returns [(pts, kind)] kind in {'stitch','travel'}."""
    import heapq
    adj = {}
    for i in idxs:
        e = edges[i]
        L = plen(e["pts"])
        adj.setdefault(e["a"], []).append((e["b"], i, L))
        adj.setdefault(e["b"], []).append((e["a"], i, L))
    d = {n: len(v) for n, v in adj.items()}
    odd = [n for n, k in d.items() if k % 2]

    def dijkstra(src):
        dist, prev, pq = {src: 0}, {}, [(0, src)]
        while pq:
            dd, u = heapq.heappop(pq)
            if dd > dist[u]:
                continue
            for v, i, L in adj[u]:
                if dd + L < dist.get(v, 1e18):
                    dist[v] = dd + L
                    prev[v] = (u, i)
                    heapq.heappush(pq, (dist[v], v))
        return dist, prev

    # choose start odd node nearest to pen, leave it and one partner unpaired
    multi = [(edges[i]["a"], edges[i]["b"], i, False) for i in idxs]
    if odd:
        odd.sort(key=lambda n: math.dist(nodes[n], start_near))
        start = odd[0]
        rest = odd[1:]
        # pair remaining nodes greedily; the one left over is the trail end
        D = {n: dijkstra(n) for n in rest}
        best_end, best_cost, best_pairs = None, 1e18, None
        for end in rest:
            pool = [n for n in rest if n != end]
            pairs, cost = [], 0
            while pool:
                u = pool.pop(0)
                v = min(pool, key=lambda w: D[u][0].get(w, 1e9))
                pool.remove(v)
                pairs.append((u, v))
                cost += D[u][0].get(v, 1e9)
            if cost < best_cost:
                best_end, best_cost, best_pairs = end, cost, pairs
        for u, v in best_pairs:
            prev = D[u][1]
            x = v
            while x != u:
                p, i = prev[x]
                multi.append((p, x, i, True))
                x = p
    else:
        start = min(adj, key=lambda n: math.dist(nodes[n], start_near))
    # Hierholzer
    inc = {}
    for k, (a, b, i, t) in enumerate(multi):
        inc.setdefault(a, []).append(k)
        inc.setdefault(b, []).append(k)
    used = [False] * len(multi)
    stack, trail = [(start, None)], []
    while stack:
        v, via = stack[-1]
        while inc[v] and used[inc[v][-1]]:
            inc[v].pop()
        if inc[v]:
            k = inc[v].pop()
            used[k] = True
            a, b, i, t = multi[k]
            stack.append((b if a == v else a, k))
        else:
            stack.pop()
            if via is not None:
                trail.append((v, via))
    trail.reverse()
    out, cur, stitched = [], start, set()
    for v, k in trail:
        a, b, i, t = multi[k]
        pts = edges[i]["pts"]
        if math.dist(pts[0], nodes[cur]) > math.dist(pts[-1], nodes[cur]):
            pts = pts[::-1]
        kind = "travel" if i in stitched else "stitch"
        stitched.add(i)
        out.append((pts, kind))
        cur = v
    return out

# ---------------------------------------------------------------- stitch generators


def run_points(pts, L=1.3, Lmin=0.45, max_turn=28.0):
    """Resample a polyline into needle points: max length L, extra points on curves."""
    if len(pts) < 2:
        return list(pts)
    dense = []
    for a, b in zip(pts, pts[1:]):
        n = max(1, int(math.dist(a, b) / 0.05))
        for i in range(n):
            t = i / n
            dense.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    dense.append(pts[-1])
    out = [dense[0]]
    acc, turn, last_dir = 0.0, 0.0, None
    for p, q in zip(dense, dense[1:]):
        seg = math.dist(p, q)
        if seg < 1e-9:
            continue
        ang = math.atan2(q[1] - p[1], q[0] - p[0])
        if last_dir is not None:
            dt = abs((ang - last_dir + math.pi) % (2 * math.pi) - math.pi)
            turn += math.degrees(dt)
        last_dir = ang
        acc += seg
        if acc >= L or (turn >= max_turn and acc >= Lmin):
            out.append(q)
            acc, turn = 0.0, 0.0
    total_end = dense[-1]
    if math.dist(out[-1], total_end) < Lmin * 0.6 and len(out) > 1:
        out[-1] = total_end
    elif out[-1] != total_end:
        out.append(total_end)
    return out


def bean(points):
    """Triple ('bean') stitch: a-b-a-b for every step."""
    out = [points[0]]
    for a, b in zip(points, points[1:]):
        out += [b, a, b]
    return out


def lock_at(p, toward, size=0.6):
    """Tie stitches at p, pointing toward `toward`: p -> p+d -> p -> p+d -> p."""
    dx, dy = toward[0] - p[0], toward[1] - p[1]
    n = math.hypot(dx, dy) or 1.0
    q = (p[0] + dx / n * size, p[1] + dy / n * size)
    return [p, q, p, q, p]


def dot_stitches(c, r=0.42):
    """Small knot for dots (i, :, ., ·)."""
    pts = [c]
    for k in range(4):
        a = math.radians(45 * k)
        pts += [(c[0] + r * math.cos(a), c[1] + r * math.sin(a)),
                (c[0] - r * math.cos(a), c[1] - r * math.sin(a))]
    pts.append(c)
    return pts


def run_glyph_objects(glyph, res=40, L=1.3, extend=0.18):
    """Return list of 'trails' (each a list of needle points) for a glyph."""
    if not glyph["contours"]:
        return []
    mask, org = rasterize(glyph["contours"], res)
    lab, n = ndimage.label(mask)
    trails = []
    nodes, edges, dist = skeleton_graph(mask, res, org, spur_mm=0.55)
    # dots / tiny blobs
    covered = np.zeros(n + 1, bool)
    for e in edges:
        x, y = e["pts"][len(e["pts"]) // 2]
        r, c = int((y - org[1]) * res), int((x - org[0]) * res)
        if 0 <= r < lab.shape[0] and 0 <= c < lab.shape[1]:
            covered[lab[r, c]] = True
    for k in range(1, n + 1):
        ys, xs = np.nonzero(lab == k)
        area = len(ys) / res / res
        small = (xs.max() - xs.min()) / res < 1.25 and (ys.max() - ys.min()) / res < 1.25
        if small or not covered[k]:
            cx, cy = org[0] + (xs.mean() + .5) / res, org[1] + (ys.mean() + .5) / res
            trails.append(dict(kind="dot", pts=dot_stitches((cx, cy)), start=(cx, cy), end=(cx, cy)))
            # drop skeleton edges belonging to this blob
            edges = [e for e in edges if not _in_label(e, lab, k, org, res)]
    # extend free ends a little (skeleton stops short of the stroke end)
    d = degree(edges)
    for e in edges:
        for end in ("a", "b"):
            if d.get(e[end]) == 1:
                pts = e["pts"]
                if end == "a":
                    p, q = pts[0], pts[min(3, len(pts) - 1)]
                else:
                    p, q = pts[-1], pts[max(-4, -len(pts))]
                v = (p[0] - q[0], p[1] - q[1])
                nv = math.hypot(*v) or 1
                newp = (p[0] + v[0] / nv * extend, p[1] + v[1] / nv * extend)
                if end == "a":
                    e["pts"] = [newp] + pts
                else:
                    e["pts"] = pts + [newp]
                nodes[e[end]] = newp
    for e in edges:
        e["pts"] = simplify(e["pts"], 0.03)
    for comp in components(nodes, edges):
        if not comp:
            continue
        trails.append(dict(kind="graph", nodes=nodes, edges=edges, idxs=comp))
    return trails


def _in_label(e, lab, k, org, res):
    x, y = e["pts"][len(e["pts"]) // 2]
    r, c = int((y - org[1]) * res), int((x - org[0]) * res)
    return 0 <= r < lab.shape[0] and 0 <= c < lab.shape[1] and lab[r, c] == k


def realize_trail(t, pen, L=1.3):
    """Turn a trail object into needle points, starting near `pen`."""
    if t["kind"] == "dot":
        return t["pts"]
    route = euler_route(t["nodes"], t["edges"], t["idxs"], pen)
    pts = []
    for seg, kind in route:
        rp = run_points(seg, L=L if kind == "stitch" else 1.8)
        rp = bean(rp) if kind == "stitch" else rp
        if pts and math.dist(pts[-1], rp[0]) < 1e-6:
            rp = rp[1:]
        pts += rp
    return pts


def trail_anchor(t):
    if t["kind"] == "dot":
        return t["start"]
    xs = [t["nodes"][t["edges"][i]["a"]] for i in t["idxs"]]
    return min(xs, key=lambda p: (p[0], p[1]))

# ---------------------------------------------------------------- satin columns


def ray_hit(shape_boundary, p, d, maxlen):
    q = (p[0] + d[0] * maxlen, p[1] + d[1] * maxlen)
    inter = shape_boundary.intersection(LineString([p, q]))
    if inter.is_empty:
        return None
    pts = []
    for g in getattr(inter, "geoms", [inter]):
        if g.geom_type == "Point":
            pts.append((g.x, g.y))
        elif hasattr(g, "coords"):
            pts += list(g.coords)
    if not pts:
        return None
    return min(pts, key=lambda r: math.dist(r, p))


def _tangents(pts):
    out = []
    n = len(pts)
    for i in range(n):
        a = pts[max(0, i - 1)]
        b = pts[min(n - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        out.append((dx / L, dy / L))
    return out


def resample(pts, step):
    ls = LineString(pts)
    L = ls.length
    n = max(1, int(round(L / step)))
    return [tuple(ls.interpolate(L * i / n).coords[0]) for i in range(n + 1)]


def satin_column(rails_l, rails_r, spacing, pull=0.15):
    """Zig-zag between paired rail points (already sampled at ~spacing)."""
    out = []
    for i, (l, r) in enumerate(zip(rails_l, rails_r)):
        dx, dy = r[0] - l[0], r[1] - l[1]
        w = math.hypot(dx, dy) or 1
        ux, uy = dx / w, dy / w
        lp = (l[0] - ux * pull, l[1] - uy * pull)
        rp = (r[0] + ux * pull, r[1] + uy * pull)
        out += [lp, rp] if i % 2 == 0 else [rp, lp]
    return out

# ---------------------------------------------------------------- pattern assembly

JUMP_NO_TRIM_MM = 3.0      # hops up to this length: jump only (with tie stitches)
MIN_STITCH_MM = 0.3        # shorter needle drops are merged (thread-break risk)


class Job:
    """Collects stitch blocks per colour and writes a DST through pyembroidery."""

    def __init__(self, name):
        self.name = name
        self.blocks = []        # (thread dict, [segment lists of needle points])

    def color(self, thread):
        self.blocks.append((thread, []))

    def add(self, pts):
        """Add one continuous stitched segment (needle points, mm)."""
        if len(pts) >= 2:
            self.blocks[-1][1].append(list(pts))

    def build(self, center=None):
        import pyembroidery as pe
        allp = [p for _, segs in self.blocks for s in segs for p in s]
        xs, ys = [p[0] for p in allp], [p[1] for p in allp]
        if center is None:
            center = ((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2)
        cx, cy = center
        pat = pe.EmbPattern()
        pat.extras["name"] = self.name[:16]
        stats = dict(jumps=0, trims=0, locks=0)
        first_block = True
        for thread, segs in self.blocks:
            if not segs:
                continue
            th = pe.EmbThread()
            th.set_hex_color(thread["hex"])
            th.description = thread["name"]
            th.catalog_number = thread.get("code", "")
            pat.add_thread(th)
            if not first_block:
                pat.add_command(pe.TRIM)
                stats["trims"] += 1
                pat.add_command(pe.COLOR_CHANGE)
            first_block = False
            prev_end = None
            for si, s in enumerate(segs):
                if prev_end is not None:
                    gap = math.dist(prev_end, s[0])
                    if gap > JUMP_NO_TRIM_MM:
                        pat.add_command(pe.TRIM)
                        stats["trims"] += 1
                    stats["jumps"] += 1
                # jump to start, tie in, stitch, tie off
                pat.add_stitch_absolute(pe.JUMP, (s[0][0] - cx) * 10, (s[0][1] - cy) * 10)
                body = lock_at(s[0], s[1])[:-1] + s
                body = body + lock_at(s[-1], s[-2])[1:]
                stats["locks"] += 2
                clean = [body[0]]
                for p in body[1:]:                     # no needle drops closer than 0.3 mm
                    if math.dist(p, clean[-1]) >= MIN_STITCH_MM:
                        clean.append(p)
                if math.dist(body[-1], clean[-1]) > 0.05:
                    clean[-1] = body[-1]
                body = clean
                for x, y in body:
                    pat.add_stitch_absolute(pe.STITCH, (x - cx) * 10, (y - cy) * 10)
                prev_end = s[-1]
        pat.add_command(pe.TRIM)
        pat.end()
        self.pattern, self.center, self.stats = pat, center, stats
        return pat

    def write_dst(self, path):
        import pyembroidery as pe
        pe.write_dst(self.pattern, path, {"version": "extended", "trim_at": 3})
