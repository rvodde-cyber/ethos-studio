#!/usr/bin/env python3
"""Generate minimal PWA icons for Ethos Studio."""
import os
import struct
import zlib

def png_chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

def write_icon(path: str, size: int) -> None:
    bg = (15, 110, 86)
    fg = (255, 255, 255)
    accent = (153, 53, 86)
    w = h = size
    raw = bytearray()
    cx, cy = w / 2, h / 2
    r_outer = w * 0.38
    r_inner = w * 0.16
    for y in range(h):
        raw.append(0)
        for x in range(w):
            dx, dy = x - cx, y - cy
            dist = (dx * dx + dy * dy) ** 0.5
            angle = (abs(dx) + abs(dy)) / max(w, 1)
            if dist < r_inner:
                raw.extend(accent)
            elif dist < r_outer and angle < 0.35:
                raw.extend(fg)
            elif dist < r_outer * 0.92:
                raw.extend(bg)
            else:
                raw.extend(bg)
    comp = zlib.compress(bytes(raw), 9)
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += png_chunk(b"IHDR", ihdr)
    png += png_chunk(b"IDAT", comp)
    png += png_chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)

if __name__ == "__main__":
    os.makedirs("icons", exist_ok=True)
    write_icon("icons/icon-192.png", 192)
    write_icon("icons/icon-512.png", 512)
    print("Icons written to icons/")
