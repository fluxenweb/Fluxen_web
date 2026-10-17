"""Independent Tajima DST decoder + stitch renderer (does not use pyembroidery's reader)."""
import math, sys
from PIL import Image, ImageDraw

def decode(path):
    data = open(path, 'rb').read()
    head = data[:512].split(b'\x1a')[0].decode('latin-1')
    fields = {}
    for part in head.split('\r'):
        if len(part) > 3 and part[2] == ':':
            fields.setdefault(part[:2], []).append(part[3:].strip())
    recs = data[512:]
    def bit(b, n): return (b >> n) & 1
    x = y = 0; out = []
    for i in range(0, len(recs) - 2, 3):
        b0, b1, b2 = recs[i], recs[i+1], recs[i+2]
        dx = (bit(b2,2)*81 - bit(b2,3)*81 + bit(b1,2)*27 - bit(b1,3)*27 + bit(b0,2)*9 - bit(b0,3)*9
              + bit(b1,0)*3 - bit(b1,1)*3 + bit(b0,0) - bit(b0,1))
        dy = (bit(b2,5)*81 - bit(b2,4)*81 + bit(b1,5)*27 - bit(b1,4)*27 + bit(b0,5)*9 - bit(b0,4)*9
              + bit(b1,7)*3 - bit(b1,6)*3 + bit(b0,7) - bit(b0,6))
        if b2 == 0xF3 and b0 == 0 and b1 == 0:
            out.append(('END', x, y)); break
        jump, cc = bit(b2,7), bit(b2,6)
        x += dx; y += dy
        kind = 'COLOR' if (jump and cc) else 'JUMP' if jump else 'STITCH'
        out.append((kind, x, y))
    return fields, out

def stats(recs):
    st = sum(1 for r in recs if r[0] == 'STITCH')
    jumps = sum(1 for r in recs if r[0] == 'JUMP')
    colors = sum(1 for r in recs if r[0] == 'COLOR')
    # trims: runs of >=3 consecutive jump records (Tajima convention used by pyembroidery)
    trims, run = 0, 0
    for r in recs:
        if r[0] == 'JUMP':
            run += 1
        else:
            if run >= 3: trims += 1
            run = 0
    pts = [(r[1], r[2]) for r in recs if r[0] == 'STITCH']
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    lens, prev = [], None
    for r in recs:
        if r[0] == 'STITCH' and prev is not None and prev[0] == 'STITCH':
            lens.append(math.dist(r[1:], prev[1:]))
        prev = r
    return dict(stitches=st, jump_records=jumps, color_changes=colors, trims=trims,
                width_mm=(max(xs)-min(xs))/10, height_mm=(max(ys)-min(ys))/10,
                bounds=(min(xs), max(xs), min(ys), max(ys)),
                max_stitch_mm=max(lens)/10, min_stitch_mm=min(l for l in lens if l > 0)/10,
                short_lt_0_3mm=sum(1 for l in lens if 0 < l < 3))

def render(recs, colors, path, scale=10, thread_mm=0.32, bg=(247,247,244), margin_mm=8):
    st = stats(recs)
    x0, x1, y0, y1 = st['bounds']
    W = int(((x1-x0)/10 + 2*margin_mm) * scale); H = int(((y1-y0)/10 + 2*margin_mm) * scale)
    ss = 2
    im = Image.new('RGB', (W*ss, H*ss), bg); d = ImageDraw.Draw(im)
    def P(x, y):  # DST +y is up -> screen y down
        return (((x - x0)/10 + margin_mm) * scale * ss, ((y1 - y)/10 + margin_mm) * scale * ss)
    ci = 0; prev = None
    w = max(1, int(thread_mm * scale * ss))
    for r in recs:
        if r[0] == 'COLOR':
            ci += 1; prev = None; continue
        if r[0] != 'STITCH':
            prev = None; continue
        if prev is not None:
            c = colors[min(ci, len(colors)-1)]
            dark = tuple(int(v*0.72) for v in c)
            a, b = P(*prev), P(r[1], r[2])
            lite = tuple(min(255, int(v + (255 - v) * 0.35)) for v in c)
            d.line([a, b], fill=dark, width=w + 2)
            d.line([a, b], fill=c, width=w)
            d.line([a, b], fill=lite, width=max(1, w // 3))
        prev = (r[1], r[2])
    im = im.resize((W, H), Image.LANCZOS)
    im.save(path)
    return im.size

if __name__ == '__main__':
    f, r = decode(sys.argv[1]); print(f); print(stats(r))
