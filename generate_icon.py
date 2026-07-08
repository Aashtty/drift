# generate_icon.py — run once, then delete
import zlib, struct

def make_png(path, size, rgb):
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c))

    width = height = size
    r, g, b = rgb
    raw = b''
    for _ in range(height):
        raw += b'\x00' + bytes([r, g, b]) * width  # filter byte 0 + RGB row

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')

    with open(path, 'wb') as f:
        f.write(png)

make_png('drift/apps/extension/assets/icon.png', 512, (0x66, 0x55, 0xCC))  # DRIFT violet
print('wrote apps/extension/assets/icon.png')