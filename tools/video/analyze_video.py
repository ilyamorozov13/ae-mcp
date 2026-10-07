#!/usr/bin/env python3
"""Frame-level read of a video creative: cuts, holds, motion, tone, UI zones, audio energy.

Usage:
    python3 analyze_video.py VIDEO [--out DIR] [--width 360]

Writes into DIR (default /tmp/vcp/<video-stem>/):
    frames/f_%05d.png   every frame at analysis width
    report.json         compact summary the agent reads in full
    per_frame.csv       one row per frame (grep it, do not read it whole)
    timeline.md         timing table skeleton to fill in after looking at frames
    sheets/overview.jpg contact sheet across the whole video
    sheets/seg_NN.jpg   contact sheet per segment
    sheets/cuts.jpg     frames around every detected cut
    keys/               full-resolution stills at every hold and cut

Only ffmpeg/ffprobe and Pillow are required. No numpy.
"""

import argparse
import array
import csv
import json
import os
import re
import subprocess
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageStat


# ---------------------------------------------------------------- helpers

def run(cmd, capture=True):
    return subprocess.run(cmd, capture_output=capture, text=True, check=False)


def probe(path):
    r = run(["ffprobe", "-v", "error", "-show_streams", "-show_format",
             "-of", "json", path])
    if r.returncode != 0:
        sys.exit("ffprobe failed: " + r.stderr.strip())
    data = json.loads(r.stdout)
    v = next((s for s in data["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in data["streams"] if s["codec_type"] == "audio"), None)
    if v is None:
        sys.exit("no video stream in " + path)
    num, den = (v.get("r_frame_rate") or "30/1").split("/")
    fps = float(num) / float(den or 1)
    dur = float(data["format"].get("duration") or v.get("duration") or 0)
    return {
        "file": os.path.abspath(path),
        "width": int(v["width"]),
        "height": int(v["height"]),
        "aspect": aspect_label(int(v["width"]), int(v["height"])),
        "fps": round(fps, 3),
        "duration_s": round(dur, 3),
        "video_codec": v.get("codec_name"),
        "has_audio": a is not None,
        "audio_codec": a.get("codec_name") if a else None,
        "bitrate_kbps": int(int(data["format"].get("bit_rate", 0)) / 1000) or None,
    }


COMMON_RATIOS = [("9:16", 9 / 16), ("4:5", 4 / 5), ("1:1", 1.0), ("2:3", 2 / 3),
                 ("3:4", 3 / 4), ("16:9", 16 / 9), ("4:3", 4 / 3), ("1.91:1", 1.91)]


def aspect_label(w, h):
    r = w / float(h)
    name, ref = min(COMMON_RATIOS, key=lambda p: abs(p[1] - r))
    return name if abs(ref - r) / r < 0.02 else "%.3f:1" % r


def extract_frames(path, out_dir, width):
    os.makedirs(out_dir, exist_ok=True)
    for f in os.listdir(out_dir):
        os.remove(os.path.join(out_dir, f))
    r = run(["ffmpeg", "-v", "error", "-i", path, "-vf", "scale=%d:-2" % width,
             os.path.join(out_dir, "f_%05d.png")])
    if r.returncode != 0:
        sys.exit("frame extraction failed: " + r.stderr.strip())
    return sorted(os.listdir(out_dir))


def pixels(im):
    """Flat pixel list; get_flattened_data replaces getdata in Pillow 14."""
    getter = getattr(im, "get_flattened_data", None) or im.getdata
    return list(getter())


def mean_luma(im):
    return ImageStat.Stat(im.convert("L")).mean[0]


def saturation(im):
    return ImageStat.Stat(im.convert("HSV").getchannel("S")).mean[0]


# ---------------------------------------------------------------- per-frame pass

UI_W = 60  # grid width of the temporal-change map used to find baked UI


def scan_frames(frame_dir, names):
    """Motion, edge energy, tone per frame + a mean-change grid for UI detection."""
    rows = []
    prev_small = None
    prev_ui = None
    # Baked UI can appear and disappear, so per-cell change is tracked in NWIN
    # windows and voted on later instead of being maxed over the whole video.
    nwin = 8
    win_peak = [None] * nwin
    ui_size = None
    for i, name in enumerate(names):
        im = Image.open(os.path.join(frame_dir, name)).convert("RGB")
        small = im.resize((96, max(1, int(96 * im.height / im.width))), Image.BILINEAR)
        gray = im.convert("L")
        ui_size = (UI_W, max(1, int(UI_W * im.height / im.width)))
        ui = gray.resize(ui_size, Image.BOX)

        motion = 0.0
        if prev_small is not None:
            motion = ImageStat.Stat(ImageChops.difference(small, prev_small)).mean[0]
            d = pixels(ImageChops.difference(ui, prev_ui))
            k = min(nwin - 1, i * nwin // len(names))
            win_peak[k] = d if win_peak[k] is None else list(map(max, win_peak[k], d))
        prev_small, prev_ui = small, ui

        r, g, b = ImageStat.Stat(im).mean
        rows.append({
            "f": i,
            "motion": round(motion, 3),
            "edge": round(ImageStat.Stat(gray.filter(ImageFilter.FIND_EDGES)).mean[0], 3),
            "luma": round(mean_luma(im), 2),
            "r": round(r, 1), "g": round(g, 1), "b": round(b, 1),
            "sat": round(saturation(im), 2),
        })

    change_grid = None
    if ui_size and any(w is not None for w in win_peak):
        change_grid = {"w": ui_size[0], "h": ui_size[1],
                       "windows": [w for w in win_peak if w is not None]}
    return rows, change_grid


def median(values):
    s = sorted(values)
    return s[len(s) // 2] if s else 0.0


def detect_cuts(rows, fps):
    """Hard cuts show as a motion spike, soft ones as an edge-energy collapse."""
    motions = [r["motion"] for r in rows[1:]]
    edges = [r["edge"] for r in rows]
    m_med = median(motions) or 1e-6
    e_med = median(edges) or 1e-6

    hard = set()
    for r in rows[1:]:
        if r["motion"] > max(m_med * 6.0, 8.0):
            hard.add(r["f"])

    soft = set()
    for r in rows:
        if r["edge"] < e_med * 0.45:
            soft.add(r["f"])

    events = []
    marked = sorted(hard | soft)
    group = []
    for f in marked:
        if group and f - group[-1] > 3:
            events.append(group)
            group = []
        group.append(f)
    if group:
        events.append(group)

    cuts = []
    for grp in events:
        span = (grp[0], grp[-1])
        is_soft = any(f in soft for f in grp)
        is_hard = any(f in hard for f in grp)
        if is_soft and span[1] - span[0] >= 1:
            kind = "blur_or_dissolve"
        elif is_hard and span[1] - span[0] <= 1:
            kind = "hard_cut"
        else:
            kind = "mixed"
        centre = grp[len(grp) // 2]
        cuts.append({
            "frame": centre,
            "t": round(centre / fps, 2),
            "type": kind,
            "span_frames": [span[0], span[1]],
            "span_s": [round(span[0] / fps, 2), round(span[1] / fps, 2)],
            "min_edge": round(min(rows[f]["edge"] for f in grp), 2),
            "max_motion": round(max(rows[f]["motion"] for f in grp), 2),
        })
    return cuts


def detect_holds(rows, fps, min_frames=8):
    motions = [r["motion"] for r in rows[1:]]
    thr = (median(motions) or 1e-6) * 0.35
    holds, start = [], None
    for r in rows[1:]:
        if r["motion"] <= thr:
            if start is None:
                start = r["f"]
        else:
            if start is not None and r["f"] - start >= min_frames:
                holds.append((start, r["f"] - 1))
            start = None
    if start is not None and rows[-1]["f"] - start >= min_frames:
        holds.append((start, rows[-1]["f"]))
    return [{"start_f": a, "end_f": b, "start_s": round(a / fps, 2),
             "end_s": round(b / fps, 2), "frames": b - a + 1} for a, b in holds]


def build_segments(rows, cuts, fps):
    bounds = [0] + [c["frame"] for c in cuts] + [rows[-1]["f"] + 1]
    bounds = sorted(set(bounds))
    segs = []
    for i in range(len(bounds) - 1):
        a, b = bounds[i], bounds[i + 1] - 1
        if b < a:
            continue
        block = rows[a:b + 1]
        if not block:
            continue
        segs.append({
            "index": len(segs) + 1,
            "start_f": a, "end_f": b,
            "start_s": round(a / fps, 2), "end_s": round((b + 1) / fps, 2),
            "dur_s": round((b - a + 1) / fps, 2),
            "mean_motion": round(sum(x["motion"] for x in block) / len(block), 2),
            "mean_luma": round(sum(x["luma"] for x in block) / len(block), 1),
            "mean_sat": round(sum(x["sat"] for x in block) / len(block), 1),
            "mean_rgb": [round(sum(x["r"] for x in block) / len(block)),
                         round(sum(x["g"] for x in block) / len(block)),
                         round(sum(x["b"] for x in block) / len(block))],
        })
    return segs


# ---------------------------------------------------------------- static overlays

def static_zones(change_grid, frame_dir, names, src_w, src_h):
    """Regions that hold still while the frame around them moves: captions, logos, bars."""
    if not change_grid:
        return {"letterbox": None, "zones": []}
    w, h = change_grid["w"], change_grid["h"]
    mid = Image.open(os.path.join(frame_dir, names[len(names) // 2])).convert("L")
    mpx = pixels(mid.resize((w, h), Image.BOX))

    # vote across windows that actually contain movement
    votes = [0] * (w * h)
    active = 0
    for wp in change_grid["windows"]:
        ordered = sorted(wp)
        p90 = ordered[int(len(ordered) * 0.9)]
        if p90 < 12:
            continue  # nothing moved in this window, it tells us nothing about UI
        active += 1
        thr = max(6, p90 * 0.18)
        for i, v in enumerate(wp):
            if v < thr:
                votes[i] += 1
    if not active:
        return {"letterbox": None, "zones": []}
    static = [v >= active * 0.6 for v in votes]
    seen = [False] * (w * h)
    sx, sy = src_w / float(w), src_h / float(h)
    zones = []
    for start in range(w * h):
        if not static[start] or seen[start]:
            continue
        stack, cells = [start], []
        seen[start] = True
        while stack:
            i = stack.pop()
            cells.append(i)
            x, y = i % w, i // w
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h:
                    j = ny * w + nx
                    if static[j] and not seen[j]:
                        seen[j] = True
                        stack.append(j)
        if len(cells) < w * h * 0.012:
            continue
        xs = [i % w for i in cells]
        ys = [i // w for i in cells]
        lit = sum(mpx[i] for i in cells) / len(cells)
        zones.append({
            "box_src": [int(min(xs) * sx), int(min(ys) * sy),
                        int((max(xs) + 1) * sx), int((max(ys) + 1) * sy)],
            "coverage": round(len(cells) / float(w * h), 3),
            "mean_luma": round(lit, 1),
            "kind": "dark_bar" if lit < 18 else "persistent_overlay",
        })
    zones.sort(key=lambda z: z["box_src"][1])

    rowdark = []
    for y in range(h):
        band = mpx[y * w:(y + 1) * w]
        rowdark.append(sum(band) / float(w) < 14 and all(static[y * w:(y + 1) * w]))
    top = 0
    while top < h and rowdark[top]:
        top += 1
    bot = 0
    while bot < h and rowdark[h - 1 - bot]:
        bot += 1
    letterbox = None
    if top or bot:
        letterbox = {"top_px": int(top * sy), "bottom_px": int(bot * sy)}
    return {"letterbox": letterbox, "zones": zones}


def dominant_colors(path, count=5):
    im = Image.open(path).convert("RGB").resize((120, 150), Image.BILINEAR)
    q = im.quantize(colors=count, method=Image.MEDIANCUT).convert("RGB")
    hits = sorted(q.getcolors(4096) or [], reverse=True)[:count]
    total = sum(n for n, _ in hits) or 1
    return [{"rgb": list(c), "hex": "#%02x%02x%02x" % c, "share": round(n / total, 3)}
            for n, c in hits]


# ---------------------------------------------------------------- audio

def audio_energy(path, fps, nframes):
    r = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", "8000",
         "-f", "s16le", "-"],
        capture_output=True, check=False)
    if r.returncode != 0 or not r.stdout:
        return None
    pcm = array.array("h")
    pcm.frombytes(r.stdout[:len(r.stdout) // 2 * 2])
    per = max(1, int(8000 / fps))
    out = []
    for i in range(nframes):
        chunk = pcm[i * per:(i + 1) * per]
        if not chunk:
            break
        rms = (sum(v * v for v in chunk) / len(chunk)) ** 0.5
        out.append(round(rms / 327.68, 2))  # 0..100
    return out


def audio_peaks(env, fps, nframes):
    if not env:
        return []
    med = median(env) or 1e-6
    peaks, i = [], 1
    while i < len(env) - 1:
        if env[i] > max(med * 1.9, 12) and env[i] >= env[i - 1] and env[i] > env[i + 1]:
            peaks.append({"frame": i, "t": round(i / fps, 2), "rms": env[i]})
            i += int(fps * 0.25)
        i += 1
    return peaks


# ---------------------------------------------------------------- sheets

def _font(size):
    try:
        return ImageFont.load_default(size)
    except TypeError:
        return ImageFont.load_default()


def sheet(frame_dir, names, indices, out_path, fps, cols=5, tile_w=216):
    if not indices:
        return None
    first = Image.open(os.path.join(frame_dir, names[indices[0]]))
    tile_h = int(tile_w * first.height / first.width)
    rows = (len(indices) + cols - 1) // cols
    canvas = Image.new("RGB", (cols * tile_w, rows * tile_h), (12, 12, 12))
    font = _font(13)
    draw = ImageDraw.Draw(canvas)
    for n, idx in enumerate(indices):
        im = Image.open(os.path.join(frame_dir, names[idx])).convert("RGB")
        im = im.resize((tile_w, tile_h), Image.BILINEAR)
        x, y = (n % cols) * tile_w, (n // cols) * tile_h
        canvas.paste(im, (x, y))
        label = "f%d  %.2fs" % (idx, idx / fps)
        draw.rectangle([x + 2, y + 2, x + 2 + 8 * len(label), y + 18], fill=(0, 0, 0))
        draw.text((x + 5, y + 4), label, fill=(255, 220, 60), font=font)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    canvas.save(out_path, quality=88)
    return out_path


def spaced(a, b, count):
    if b < a:
        return []
    n = b - a + 1
    if n <= count:
        return list(range(a, b + 1))
    step = n / float(count)
    return [min(b, a + int(i * step)) for i in range(count)]


def export_keys(src, out_dir, frames, fps):
    os.makedirs(out_dir, exist_ok=True)
    for f in frames:
        dst = os.path.join(out_dir, "k_%05d.png" % f)
        run(["ffmpeg", "-v", "error", "-i", src, "-vf", "select=eq(n\\,%d)" % f,
             "-vframes", "1", "-y", dst])
    return out_dir


# ---------------------------------------------------------------- timeline

def write_timeline(path, info, segs, cuts, holds, peaks):
    lines = []
    lines.append("# Timeline — %s" % os.path.basename(info["file"]))
    lines.append("")
    lines.append("%dx%d (%s), %.3f fps, %.2fs, %d frames, audio: %s"
                 % (info["width"], info["height"], info["aspect"], info["fps"],
                    info["duration_s"], info["frames"],
                    info["audio_codec"] or "none"))
    lines.append("")
    lines.append("Fill the two right columns after looking at the contact sheets.")
    lines.append("")
    lines.append("| # | Frames | Time | Dur | Motion | Mean RGB | What is on screen | Role in the funnel |")
    lines.append("|---|--------|------|-----|--------|----------|-------------------|--------------------|")
    for s in segs:
        lines.append("| %d | %d-%d | %.2f-%.2fs | %.2fs | %.1f | %s | | |"
                     % (s["index"], s["start_f"], s["end_f"], s["start_s"],
                        s["end_s"], s["dur_s"], s["mean_motion"],
                        "/".join(str(v) for v in s["mean_rgb"])))
    lines.append("")
    lines.append("## Cuts")
    for c in cuts:
        lines.append("- f%d (%.2fs) — %s, span f%d-f%d"
                     % (c["frame"], c["t"], c["type"], c["span_frames"][0], c["span_frames"][1]))
    lines.append("")
    lines.append("## Holds (camera/graphics settled)")
    for h in holds:
        lines.append("- f%d-f%d (%.2f-%.2fs, %d frames)"
                     % (h["start_f"], h["end_f"], h["start_s"], h["end_s"], h["frames"]))
    if peaks:
        lines.append("")
        lines.append("## Audio accents")
        lines.append(", ".join("%.2fs" % p["t"] for p in peaks[:40]))
    with open(path, "w") as fh:
        fh.write("\n".join(lines) + "\n")


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out", default=None)
    ap.add_argument("--width", type=int, default=360)
    args = ap.parse_args()

    src = os.path.abspath(args.video)
    if not os.path.exists(src):
        sys.exit("no such file: " + src)

    stem = re.sub(r"[^A-Za-z0-9_.-]+", "_", os.path.splitext(os.path.basename(src))[0])
    out = args.out or os.path.join("/tmp/vcp", stem)
    frame_dir = os.path.join(out, "frames")
    os.makedirs(out, exist_ok=True)

    info = probe(src)
    print("probe:", info["width"], "x", info["height"], info["aspect"],
          "%.3f fps" % info["fps"], "%.2fs" % info["duration_s"])

    names = extract_frames(src, frame_dir, min(args.width, info["width"]))
    info["frames"] = len(names)
    print("frames extracted:", len(names))

    rows, change_grid = scan_frames(frame_dir, names)
    cuts = detect_cuts(rows, info["fps"])
    holds = detect_holds(rows, info["fps"])
    segs = build_segments(rows, cuts, info["fps"])
    overlays = static_zones(change_grid, frame_dir, names, info["width"], info["height"])
    env = audio_energy(src, info["fps"], len(names)) if info["has_audio"] else None
    peaks = audio_peaks(env, info["fps"], len(names)) if env else []

    # contact sheets
    sheets = {}
    sheets["overview"] = sheet(frame_dir, names,
                               spaced(0, len(names) - 1, 40),
                               os.path.join(out, "sheets", "overview.jpg"), info["fps"])
    for s in segs:
        p = sheet(frame_dir, names, spaced(s["start_f"], s["end_f"], 10),
                  os.path.join(out, "sheets", "seg_%02d.jpg" % s["index"]), info["fps"])
        sheets["seg_%02d" % s["index"]] = p
        s["palette"] = dominant_colors(
            os.path.join(frame_dir, names[(s["start_f"] + s["end_f"]) // 2]))
    cut_idx = []
    for c in cuts:
        a = max(0, c["span_frames"][0] - 2)
        b = min(len(names) - 1, c["span_frames"][1] + 2)
        cut_idx += list(range(a, b + 1))
    sheets["cuts"] = sheet(frame_dir, names, cut_idx[:60],
                           os.path.join(out, "sheets", "cuts.jpg"), info["fps"], cols=6)

    key_frames = sorted({h["start_f"] + (h["end_f"] - h["start_f"]) // 2 for h in holds} |
                        {c["frame"] for c in cuts} | {0, len(names) - 1})
    export_keys(src, os.path.join(out, "keys"), key_frames, info["fps"])

    with open(os.path.join(out, "per_frame.csv"), "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()) + ["audio_rms"])
        w.writeheader()
        for r in rows:
            r = dict(r)
            r["audio_rms"] = env[r["f"]] if env and r["f"] < len(env) else ""
            w.writerow(r)

    report = {
        "source": info,
        "segments": segs,
        "cuts": cuts,
        "holds": holds,
        "overlays": overlays,
        "audio": {"present": bool(env), "peaks": peaks[:60],
                  "mean_rms": round(sum(env) / len(env), 2) if env else None},
        "key_frames": key_frames,
        "artifacts": {
            "frames": frame_dir,
            "sheets": {k: v for k, v in sheets.items() if v},
            "keys": os.path.join(out, "keys"),
            "per_frame_csv": os.path.join(out, "per_frame.csv"),
            "timeline_md": os.path.join(out, "timeline.md"),
        },
    }
    with open(os.path.join(out, "report.json"), "w") as fh:
        json.dump(report, fh, indent=1)
    write_timeline(os.path.join(out, "timeline.md"), info, segs, cuts, holds, peaks)

    print("segments:", len(segs), " cuts:", len(cuts), " holds:", len(holds))
    print("report:", os.path.join(out, "report.json"))


if __name__ == "__main__":
    main()
