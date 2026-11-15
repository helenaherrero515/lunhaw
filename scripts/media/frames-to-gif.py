"""Assemble PNG frames into a looping GIF with one shared palette.

    python scripts/media/frames-to-gif.py <frames-dir> docs/media/lunhaw.gif [fps]
"""
import sys
from pathlib import Path

from PIL import Image

frames_dir, out = Path(sys.argv[1]), Path(sys.argv[2])
fps = int(sys.argv[3]) if len(sys.argv) > 3 else 15

paths = sorted(frames_dir.glob("f*.png"))
frames = [Image.open(p).convert("RGB") for p in paths]

# Build one palette from a sample of frames so colors don't flicker between frames.
step = max(1, len(frames) // 12)
sample = frames[::step]
w, h = frames[0].size
strip = Image.new("RGB", (w, h * len(sample)))
for i, f in enumerate(sample):
    strip.paste(f, (0, i * h))
palette = strip.quantize(colors=255, method=Image.Quantize.MEDIANCUT)

quantized = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in frames]

# GIF delays are whole centiseconds, so 1000/fps (66.7 ms at 15 fps) would be stored as 60 ms and
# the loop would play ~10% fast. Spread the rounding over frames so the total matches real time.
durations, elapsed = [], 0.0
for i in range(len(frames)):
    target = round((i + 1) * 100 / fps)  # end time of this frame, in centiseconds
    durations.append((target - round(elapsed)) * 10)
    elapsed = target

quantized[0].save(
    out,
    save_all=True,
    append_images=quantized[1:],
    duration=durations,
    loop=0,
    optimize=True,
    disposal=1,
)
print(f"{len(frames)} frames -> {out} ({out.stat().st_size / 1e6:.2f} MB)")
