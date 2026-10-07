#!/usr/bin/env python3
"""Measure an After Effects build against its reference, frame by frame.

The recreate loop needs numbers, not impressions: which frames diverge, by how
much, and where inside the frame. Both sides may be a video file or a folder of
stills, and they may be at different resolutions — geometry is reported in
normalised coordinates as well as native pixels so a 3x build can be compared
to a small reference without rescaling mistakes.

Usage:
    # QA pass over every frame the build exported
    python3 compare_frames.py --ref REF.mp4 --build /tmp/uac_out

    # deep dive on one frame: bbox, letterbox, profiles, mosaic pitch
    python3 compare_frames.py --ref REF.mp4 --build /tmp/uac_out --frame 0 --geometry

    # explicit frame list
    python3 compare_frames.py --ref REF.mp4 --build BUILD.mp4 --frames 0,90,273

Writes into --out (default /tmp/vcmp/<ref-stem>_vs_<build-stem>/):
    pairs/cmp_NNNNN.jpg   reference | build | amplified difference
    report.json           per-frame metrics and the ranked divergence list
    summary.md            table sorted worst-first

Needs ffmpeg/ffprobe and Pillow. No numpy.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

GRID_COLS, GRID_ROWS = 4, 5


# ---------------------------------------------------------------- io

def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=False)


def probe(path):
    r = run(["ffprobe", "-v", "error", "-show_streams", "-show_format",
             "-of", "json", path])
    if r.returncode != 0:
        sys.exit("ffprobe failed on %s: %s" % (path, r.stderr.strip()))
    data = json.loads(r.stdout)
    v = next((s for s in data["streams"] if s["codec_type"] == "video"), None)
    if v is None:
        sys.exit("no video stream in " + path)
    num, den = (v.get("r_frame_rate") or "30/1").split("/")
    return {
        "kind": "video",
        "path": os.path.abspath(path),
        "width": int(v["width"]),
        "height": int(v["height"]),
        "fps": round(float(num) / float(den or 1), 3),
        "duration_s": round(float(data["format"].get("duration") or 0), 3),
        "frames": int(v.get("nb_frames") or 0) or None,
        "has_audio": any(s["codec_type"] == "audio" for s in data["streams"]),
    }


def frame_index(name):
    m = re.findall(r"(\d+)", os.path.basename(name))
    return int(m[-1]) if m else None


def scan_dir(path):
    files = {}
    for n in sorted(os.listdir(path)):
        if not n.lower().endswith((".png", ".jpg", ".jpeg", ".tif", ".tiff")):
            continue
        i = frame_index(n)
        if i is not None:
            files[i] = os.path.join(path, n)
    if not files:
        sys.exit("no numbered stills in " + path)
    first = Image.open(files[sorted(files)[0]])
    return {"kind": "dir", "path": os.path.abspath(path), "files": files,
            "width": first.width, "height": first.height,
            "fps": None, "duration_s": None, "frames": max(files) + 1,
            "has_audio": False}


def source(path):
    return scan_dir(path) if os.path.isdir(path) else probe(path)


def grab(src, frames, workdir):
    """Return {frame_index: PIL.Image} for the requested frames."""
    if src["kind"] == "dir":
        out = {}
        for f in frames:
            p = src["files"].get(f)
            if p:
                out[f] = Image.open(p).convert("RGB")
        return out

    tmp = tempfile.mkdtemp(dir=workdir)
    expr = "+".join("eq(n\\,%d)" % f for f in frames)
    r = run(["ffmpeg", "-v", "error", "-i", src["path"], "-vf", "select='%s'" % expr,
             "-vsync", "0", "-frame_pts", "0", os.path.join(tmp, "g_%05d.png")])
    if r.returncode != 0:
        sys.exit("frame grab failed: " + r.stderr.strip())
    got = sorted(os.listdir(tmp))
    return {f: Image.open(os.path.join(tmp, n)).convert("RGB")
            for f, n in zip(frames, got)}


# ---------------------------------------------------------------- metrics

def tails(im):
    h = im.convert("L").histogram()
    t = sum(h) or 1
    return {
        "hi240": round(sum(h[240:]) / t * 100, 2),
        "hi220": round(sum(h[220:]) / t * 100, 2),
        "hi200": round(sum(h[200:]) / t * 100, 2),
        "lo40": round(sum(h[:40]) / t * 100, 2),
        "lo20": round(sum(h[:20]) / t * 100, 2),
    }


def tone(im):
    r, g, b = ImageStat.Stat(im).mean
    return {
        "rgb": [round(r, 1), round(g, 1), round(b, 1)],
        "luma": round(ImageStat.Stat(im.convert("L")).mean[0], 2),
        "sat": round(ImageStat.Stat(im.convert("HSV").getchannel("S")).mean[0], 2),
        "warmth": round(r - b, 1),
    }


def worst_cell(diff):
    w, h = diff.size
    cw, ch = w / float(GRID_COLS), h / float(GRID_ROWS)
    worst = None
    for gy in range(GRID_ROWS):
        for gx in range(GRID_COLS):
            box = (int(gx * cw), int(gy * ch), int((gx + 1) * cw), int((gy + 1) * ch))
            v = ImageStat.Stat(diff.crop(box)).mean[0]
            if worst is None or v > worst["mae"]:
                worst = {"cell": [gx, gy], "box": list(box), "mae": round(v, 2)}
    return worst


def compare(ref, bld):
    """Metrics for one pair. Build is resampled to the reference size."""
    size = ref.size
    b = bld if bld.size == size else bld.resize(size, Image.LANCZOS)
    gdiff = ImageChops.difference(ref, b).convert("L")
    tr, tb = tone(ref), tone(b)
    hr, hb = tails(ref), tails(b)
    # mae compares pixels and so explodes when the media itself was regenerated;
    # mae_layout throws away detail and keeps composition and tone placement
    lw = 32
    lh = max(1, int(lw * size[1] / size[0]))
    layout = ImageChops.difference(ref.resize((lw, lh), Image.BOX),
                                   b.resize((lw, lh), Image.BOX)).convert("L")
    return {
        "compare_size": list(size),
        "mae": round(ImageStat.Stat(gdiff).mean[0], 2),
        "mae_layout": round(ImageStat.Stat(layout).mean[0], 2),
        "max_diff": gdiff.getextrema()[1],
        "worst_region": worst_cell(gdiff),
        "ref": {"tone": tr, "tails": hr},
        "build": {"tone": tb, "tails": hb},
        "delta": {
            "luma": round(tb["luma"] - tr["luma"], 2),
            "warmth": round(tb["warmth"] - tr["warmth"], 1),
            "sat": round(tb["sat"] - tr["sat"], 2),
            "rgb": [round(tb["rgb"][i] - tr["rgb"][i], 1) for i in range(3)],
            "hi240": round(hb["hi240"] - hr["hi240"], 2),
            "lo40": round(hb["lo40"] - hr["lo40"], 2),
        },
    }, gdiff


# ---------------------------------------------------------------- geometry

def content_bbox(im, thr=18):
    g = im.convert("L")
    mask = g.point(lambda v: 255 if v > thr else 0)
    box = mask.getbbox()
    if not box:
        return None
    w, h = im.size
    return {
        "px": list(box),
        "norm": [round(box[0] / w, 4), round(box[1] / h, 4),
                 round(box[2] / w, 4), round(box[3] / h, 4)],
        "size_px": [box[2] - box[0], box[3] - box[1]],
    }


def letterbox(im, thr=14):
    g = im.convert("L")
    w, h = g.size
    rows = [ImageStat.Stat(g.crop((0, y, w, y + 1))).mean[0] for y in range(h)]
    top = 0
    while top < h and rows[top] < thr:
        top += 1
    bot = 0
    while bot < h and rows[h - 1 - bot] < thr:
        bot += 1
    cols = [ImageStat.Stat(g.crop((x, 0, x + 1, h))).mean[0] for x in range(w)]
    left = 0
    while left < w and cols[left] < thr:
        left += 1
    right = 0
    while right < w and cols[w - 1 - right] < thr:
        right += 1
    return {"top": top, "bottom": bot, "left": left, "right": right,
            "top_norm": round(top / h, 4), "bottom_norm": round(bot / h, 4)}


def profile(im, axis, at):
    """Luma profile along a row (axis='row') or column (axis='col')."""
    g = im.convert("L")
    w, h = g.size
    if axis == "row":
        y = min(h - 1, max(0, int(at * h if at <= 1 else at)))
        return {"at_px": y, "values": list(g.crop((0, y, w, y + 1)).getdata())}
    x = min(w - 1, max(0, int(at * w if at <= 1 else at)))
    return {"at_px": x, "values": list(g.crop((x, 0, x + 1, h)).getdata())}


def block_pitch(im, band=(0.30, 0.60)):
    """Mosaic block size, as the median gap between column-edge spikes."""
    g = im.convert("L")
    w, h = g.size
    y0, y1 = int(h * band[0]), int(h * band[1])
    strip = g.crop((0, y0, w, y1))
    px = strip.load()
    cols = []
    for x in range(w - 1):
        s = sum(abs(px[x, y] - px[x + 1, y]) for y in range(y1 - y0))
        cols.append(s / float(y1 - y0))
    m = sum(cols) / len(cols) if cols else 0
    edges = [x for x in range(1, len(cols) - 1)
             if cols[x] > m * 1.6 and cols[x] >= cols[x - 1] and cols[x] >= cols[x + 1]]
    gaps = sorted(g2 - g1 for g1, g2 in zip(edges, edges[1:]) if g2 - g1 > 1)
    return {"edges": len(edges), "median_gap_px": gaps[len(gaps) // 2] if gaps else None,
            "blocks_across": round(w / gaps[len(gaps) // 2], 1) if gaps else None}


def geometry(im):
    return {"size": list(im.size), "bbox": content_bbox(im),
            "letterbox": letterbox(im), "block_pitch": block_pitch(im)}


# ---------------------------------------------------------------- output

def _font(size):
    try:
        return ImageFont.load_default(size)
    except TypeError:
        return ImageFont.load_default()


def pair_image(ref, bld, gdiff, f, out_path, gain=4):
    panel_w = 360
    ph = int(panel_w * ref.height / ref.width)
    amp = gdiff.point(lambda v: min(255, v * gain)).convert("RGB")
    panels = [ref.resize((panel_w, ph), Image.LANCZOS),
              bld.resize((panel_w, ph), Image.LANCZOS),
              amp.resize((panel_w, ph), Image.LANCZOS)]
    canvas = Image.new("RGB", (panel_w * 3, ph + 20), (10, 10, 10))
    for i, p in enumerate(panels):
        canvas.paste(p, (i * panel_w, 20))
    d = ImageDraw.Draw(canvas)
    font = _font(13)
    for i, label in enumerate(("REF f%d" % f, "BUILD f%d" % f, "DIFF x%d" % gain)):
        d.text((i * panel_w + 6, 4), label, fill=(255, 220, 60), font=font)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    canvas.save(out_path, quality=90)


def write_summary(path, specs, results, spec_warnings):
    lines = ["# Build vs reference", ""]
    for side in ("ref", "build"):
        s = specs[side]
        lines.append("- **%s**: `%s` — %dx%d%s"
                     % (side, s["path"], s["width"], s["height"],
                        ", %.3f fps, %.2fs" % (s["fps"], s["duration_s"])
                        if s["fps"] else " (stills)"))
    if spec_warnings:
        lines += ["", "## Spec mismatch"] + ["- " + w for w in spec_warnings]
    lines += ["", "## Frames, worst first", "",
              "| Frame | MAE | MAE layout | Δluma | Δwarmth | Δsat | Δhi240 | Worst cell |",
              "|-------|-----|------------|-------|---------|------|--------|------------|"]
    for r in sorted(results, key=lambda x: -x["mae"]):
        d = r["delta"]
        lines.append("| %d | %.2f | %.2f | %+.2f | %+.1f | %+.2f | %+.2f | %s |"
                     % (r["frame"], r["mae"], r["mae_layout"], d["luma"], d["warmth"],
                        d["sat"], d["hi240"], r["worst_region"]["cell"]))
    with open(path, "w") as fh:
        fh.write("\n".join(lines) + "\n")


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", required=True, help="reference video or folder of stills")
    ap.add_argument("--build", required=True, help="build video or folder of stills")
    ap.add_argument("--frames", help="comma separated frame indices")
    ap.add_argument("--frame", type=int, help="single frame, implies a deep dive")
    ap.add_argument("--auto", type=int, default=24,
                    help="evenly spaced frames when neither side is a folder")
    ap.add_argument("--geometry", action="store_true",
                    help="also measure bbox, letterbox, profiles and mosaic pitch")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    ref_src, bld_src = source(args.ref), source(args.build)

    if args.frame is not None:
        frames = [args.frame]
    elif args.frames:
        frames = [int(x) for x in args.frames.split(",") if x.strip()]
    elif bld_src["kind"] == "dir":
        frames = sorted(bld_src["files"])
    elif ref_src["kind"] == "dir":
        frames = sorted(ref_src["files"])
    else:
        n = ref_src["frames"] or int((ref_src["duration_s"] or 1) * (ref_src["fps"] or 30))
        step = max(1, n // max(1, args.auto))
        frames = list(range(0, n, step))[:args.auto]

    stem = "%s_vs_%s" % (
        re.sub(r"[^A-Za-z0-9]+", "_", os.path.splitext(os.path.basename(args.ref))[0]),
        re.sub(r"[^A-Za-z0-9]+", "_", os.path.basename(args.build.rstrip("/"))))
    out = args.out or os.path.join("/tmp/vcmp", stem)
    os.makedirs(out, exist_ok=True)

    warnings = []
    ra = ref_src["width"] / float(ref_src["height"])
    ba = bld_src["width"] / float(bld_src["height"])
    if abs(ra - ba) / ra > 0.01:
        warnings.append("aspect differs: ref %.4f vs build %.4f — geometry is not comparable"
                        % (ra, ba))
    if ref_src["fps"] and bld_src["fps"] and abs(ref_src["fps"] - bld_src["fps"]) > 0.01:
        warnings.append("fps differs: ref %.3f vs build %.3f — frame indices do not line up"
                        % (ref_src["fps"], bld_src["fps"]))
    if ref_src["duration_s"] and bld_src["duration_s"]:
        if abs(ref_src["duration_s"] - bld_src["duration_s"]) > 0.05:
            warnings.append("duration differs: ref %.2fs vs build %.2fs"
                            % (ref_src["duration_s"], bld_src["duration_s"]))
    for w in warnings:
        print("WARNING:", w)

    workdir = tempfile.mkdtemp()
    ref_imgs = grab(ref_src, frames, workdir)
    bld_imgs = grab(bld_src, frames, workdir)

    results = []
    for f in frames:
        if f not in ref_imgs or f not in bld_imgs:
            print("skip f%d — missing on %s" % (f, "ref" if f not in ref_imgs else "build"))
            continue
        r_im, b_im = ref_imgs[f], bld_imgs[f]
        m, gdiff = compare(r_im, b_im)
        m["frame"] = f
        if ref_src["fps"]:
            m["t"] = round(f / ref_src["fps"], 3)
        if args.geometry or args.frame is not None:
            m["geometry"] = {"ref": geometry(r_im), "build": geometry(b_im)}
        pair_image(r_im, b_im, gdiff, f, os.path.join(out, "pairs", "cmp_%05d.jpg" % f))
        results.append(m)

    if not results:
        sys.exit("no comparable frames")

    report = {"ref": {k: v for k, v in ref_src.items() if k != "files"},
              "build": {k: v for k, v in bld_src.items() if k != "files"},
              "spec_warnings": warnings,
              "frames_compared": len(results),
              "mae_mean": round(sum(r["mae"] for r in results) / len(results), 2),
              "mae_layout_mean": round(sum(r["mae_layout"] for r in results) / len(results), 2),
              "worst_frames_layout": [r["frame"] for r in sorted(results, key=lambda x: -x["mae_layout"])[:5]],
              "worst_frames": [r["frame"] for r in sorted(results, key=lambda x: -x["mae"])[:5]],
              "results": results}
    with open(os.path.join(out, "report.json"), "w") as fh:
        json.dump(report, fh, indent=1)
    write_summary(os.path.join(out, "summary.md"),
                  {"ref": ref_src, "build": bld_src}, results, warnings)

    print("compared %d frames, mean MAE %.2f (layout %.2f)"
          % (len(results), report["mae_mean"], report["mae_layout_mean"]))
    print("worst pixels:", ", ".join("f%d (%.1f)" % (r["frame"], r["mae"])
                                     for r in sorted(results, key=lambda x: -x["mae"])[:5]))
    print("worst layout:", ", ".join("f%d (%.1f)" % (r["frame"], r["mae_layout"])
                                     for r in sorted(results, key=lambda x: -x["mae_layout"])[:5]))
    if args.frame is not None:
        print(json.dumps(results[0], indent=1))
    print("report:", os.path.join(out, "report.json"))
    print("pairs: ", os.path.join(out, "pairs"))


if __name__ == "__main__":
    main()
