"""Exporta o chão, os objetos e a grade do mockup floresta-v3.

O layout segue o compositor aprovado (seed 149, Wang 16px, só a base bloqueia).
O PNG do chão guarda flores e as sombras das árvores já recoloridas. Heróis e
mobs ficam de fora para serem desenhados vivos, por cima, com ordenação em Y.
"""

import json
import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
SRC = Path('/tmp/floresta-v3')
ASSETS = SRC / 'v3' / 'assets'
REAL = SRC / 'v2' / 'real'
BESTIARY = Path('/agent/repos/pacto-dos-eternos/assets/campaign-bestiary')
W, H, T = 640, 360, 16
GROUND_H = 368

ZIP_ORDER = [
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_11.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_6.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_13.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_4.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_2.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_10.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_5.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_0.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_7.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_8.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_14.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_1.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_15.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_3.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_12.png',
    'Sixteen_delicate_tiny_16x16_forest_grass_ground_va_9.png',
]


def center(x):
    return 182 + 32 * math.sin(x / 97 - 0.6) + 10 * math.sin(x / 41)


def kind(x, y):
    return 'lower' if abs(y - center(x)) < 19 + 5 * math.sin(x / 134) else 'upper'


def load_tiles():
    meta = json.loads((ASSETS / 'terrain.json').read_text())
    sheet = Image.open(ASSETS / 'terrain.png').convert('RGBA')
    tiles = {}
    table = []
    for tile in meta['tileset_data']['tiles']:
        box = tile['bounding_box']
        key = tuple(tile['corners'][corner] for corner in ['NW', 'NE', 'SW', 'SE'])
        tiles[key] = sheet.crop((box['x'], box['y'], box['x'] + 16, box['y'] + 16))
        table.append({
            'key': ''.join('L' if corner == 'lower' else 'U' for corner in key),
            'x': box['x'],
            'y': box['y'],
        })
    return tiles, table


def load_variants():
    variants = []
    names = []
    for index, name in enumerate(ZIP_ORDER):
        image = Image.open(ASSETS / 'grass' / name).convert('RGBA')
        if (np.array(image)[:, :, 3] > 0).mean() >= 0.20:
            continue
        array = np.array(image)
        array[0, :, 3] = 0
        array[-1, :, 3] = 0
        array[:, 0, 3] = 0
        array[:, -1, 3] = 0
        cleaned = Image.fromarray(array, 'RGBA')
        file_name = f'{len(names):02d}.png'
        cleaned.save(HERE / 'grama' / file_name)
        variants.append(cleaned)
        names.append(file_name)
    return variants


def canonical_objects():
    objects = []

    def put(name, col, row, flip=False, solid=True):
        objects.append({
            'asset': name,
            'x': col * T + 8,
            'y': row * T + 12,
            'flip': bool(flip),
            'solid': bool(solid),
        })

    back = [(0, 1), (2, 0), (4, 2), (6, 1), (8, 2), (10, 0), (12, 2), (14, 1), (16, 2),
            (19, 1), (21, 2), (23, 0), (26, 2), (28, 1), (30, 2), (33, 0), (35, 2), (38, 1), (40, 2),
            (-1, 5), (2, 5), (4, 6), (7, 4), (10, 6), (13, 5), (16, 6), (19, 4), (22, 5), (25, 6),
            (28, 5), (32, 5), (35, 4), (38, 6), (41, 5)]
    for j, (col, row) in enumerate(back):
        put('birch' if j % 4 == 1 else 'oak', col, row, j % 3 == 0)
    front = [(-1, 16), (1, 18), (3, 17), (5, 19), (7, 17), (9, 20), (11, 19), (13, 21), (16, 20),
             (19, 22), (23, 21), (26, 20), (28, 22), (31, 19), (33, 21), (35, 19), (37, 21), (39, 18), (41, 20)]
    for j, (col, row) in enumerate(front):
        put('birch' if j % 3 == 1 else 'oak', col, row, j % 2 == 0)
    for name, col, row, flip in [('oak', 0, 7, False), ('oak', 39, 7, True), ('birch', 2, 13, True),
                                 ('oak', 36, 14, False), ('birch', 6, 8, False), ('oak', 32, 6, True)]:
        put(name, col, row, flip)
    for name, col, row, flip in [('rocks', 9, 8, False), ('rocks', 30, 14, True), ('rocks', 14, 18, False),
                                 ('log', 8, 16, False), ('waystone', 29, 6, False)]:
        put(name, col, row, flip)
    for col, row in [(4, 8), (11, 7), (20, 7), (25, 8), (34, 10), (5, 16), (17, 17), (27, 17),
                     (35, 16), (37, 7), (12, 17), (31, 6)]:
        put('shrub', col, row, False, False)
    for name, col, row in [('oak-sapling', 3, 7), ('birch-sapling', 24, 6), ('oak-sapling', 34, 17)]:
        put(name, col, row, False, True)
    return objects


def open_sprite(obj):
    image = Image.open(ASSETS / f"{obj['asset']}.png").convert('RGBA')
    if obj['flip']:
        image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return image


def stamp(image, obj, cover=None):
    sprite = open_sprite(obj)
    box = sprite.getbbox()
    left = obj['x'] - (box[0] + box[2]) // 2
    top = obj['y'] - box[3]
    if cover is not None:
        alpha = np.array(sprite)[:, :, 3] > 0
        height, width = alpha.shape
        y0, y1 = max(0, top), min(H, top + height)
        x0, x1 = max(0, left), min(W, left + width)
        if y1 > y0 and x1 > x0:
            cover[y0:y1, x0:x1] |= alpha[y0 - top:y1 - top, x0 - left:x1 - left]
    image.alpha_composite(sprite, (left, top))


def majority(image):
    array = np.array(image.convert('RGBA'))
    height, width = array.shape[:2]
    out = np.zeros((height // 4, width // 4, 4), np.uint8)
    for y in range(height // 4):
        for x in range(width // 4):
            block = array[y * 4:(y + 1) * 4, x * 4:(x + 1) * 4].reshape(-1, 4)
            keys = (block[:, 0].astype(np.int32) << 24) | (block[:, 1].astype(np.int32) << 16) | (block[:, 2].astype(np.int32) << 8) | block[:, 3]
            values, counts = np.unique(keys, return_counts=True)
            key = int(values[counts.argmax()])
            out[y, x] = [(key >> 24) & 255, (key >> 16) & 255, (key >> 8) & 255, key & 255]
    return Image.fromarray(out, 'RGBA')


def export_mobs():
    for source, dest in [('enemy-1-1', 'cogumelo.png'), ('enemy-1-2', 'criatura.png')]:
        frames = [majority(Image.open(BESTIARY / f'{source}-pixel-{i}.png')) for i in range(4)]
        sheet = Image.new('RGBA', (24 * 4, 24))
        for index, frame in enumerate(frames):
            sheet.paste(frame, (index * 24, 0))
        sheet.save(HERE / dest)


def main():
    tiles, table = load_tiles()
    variants = load_variants()
    Image.open(ASSETS / 'terrain.png').convert('RGBA').save(HERE / 'terreno.png')
    for name in ['oak', 'birch', 'oak-sapling', 'birch-sapling', 'rocks', 'shrub', 'log', 'waystone']:
        Image.open(ASSETS / f'{name}.png').convert('RGBA').save(HERE / f'{name}.png')
    export_mobs()

    objects = canonical_objects()
    native = np.array(Image.open(SRC / 'v3' / 'floresta-v3-native.png').convert('RGB'))
    cover = np.zeros((H, W), bool)
    shadow = np.zeros((H, W), bool)
    scratch = Image.new('RGBA', (W, H))
    for obj in objects:
        for yy in range(obj['y'] - 2, obj['y'] + 4):
            for xx in range(obj['x'] - 5, obj['x'] + 7):
                if 0 <= xx < W and 0 <= yy < H:
                    shadow[yy, xx] = True
        stamp(scratch, obj, cover)
    clean = compose_ground(tiles, variants)
    baked = np.array(clean.convert('RGB'))
    visible_shadow = shadow & ~cover
    baked[:H][visible_shadow] = native[visible_shadow]
    Image.fromarray(baked, 'RGB').save(HERE / 'chao-0.png')

    # Prova: chão + sprites das árvores batem com o mockup fora de heróis, mobs e suas sombras.
    proof = Image.fromarray(baked, 'RGB').convert('RGBA')
    for obj in sorted(objects, key=lambda item: item['y']):
        stamp(proof, obj)
    proof_rgb = np.array(proof.convert('RGB'))[:H]
    hero_cover = np.zeros((H, W), bool)
    hero_shadow = np.zeros((H, W), bool)
    for name, x, y in [('archer', 276, round(center(276) + 4)), ('spearman', 299, round(center(299) - 5)),
                       ('swordsman', 323, round(center(323) + 4))]:
        blit_mask(hero_cover, Image.open(REAL / f'{name}-frame.png').convert('RGBA'), x, y)
        mark_shadow(hero_shadow, x, y)
    for name, x, y in [('enemy-1-1-pixel-0-native', 397, 220), ('enemy-1-2-pixel-0-native', 447, 259)]:
        blit_mask(hero_cover, Image.open(REAL / f'{name}.png').convert('RGBA'), x, y)
        mark_shadow(hero_shadow, x, y)
    ignore = hero_cover | hero_shadow
    diff = (proof_rgb != native).any(axis=2) & ~ignore
    print('diff outside actors', int(diff.sum()))
    if int(diff.sum()):
        ys, xs = np.where(diff)
        print('sample', list(zip(xs[:8].tolist(), ys[:8].tolist())))
        raise SystemExit('o chão não reproduz o mockup')

    grid = reference_grid(objects)
    source = json.loads((SRC / 'floresta-v2-colisao.json').read_text())['grid']
    if grid != source:
        raise SystemExit('a grade de colisão divergiu do JSON aprovado')
    lines = ["export const CHAO = {w: 640, h: 368, vista: 360};",
             "export const HEROIS = " + json.dumps([
                 {'skin': 'archer', 'x': 276, 'y': 215},
                 {'skin': 'spearman', 'x': 299, 'y': 205},
                 {'skin': 'swordsman', 'x': 323, 'y': 209},
             ], ensure_ascii=False) + ";",
             "export const MOBS_INICIAIS = " + json.dumps([
                 {'kind': 'cogumelo', 'x': 397, 'y': 220},
                 {'kind': 'criatura', 'x': 447, 'y': 259},
             ], ensure_ascii=False) + ";",
             "export const WANG = " + json.dumps(table, ensure_ascii=False) + ";",
             "export const OBJETOS = " + json.dumps(objects, ensure_ascii=False) + ";",
             "export const GRADE = `" + "\\n".join(''.join(str(cell) for cell in row) for row in grid) + "`;",
             ""]
    (HERE / 'canonico.mjs').write_text('\n'.join(lines))
    print('objetos', len(objects), 'variantes', len(variants), 'ok')


def compose_ground(tiles, variants):
    rng = random.Random(149)
    image = Image.new('RGBA', (W, GROUND_H))
    for y in range(0, GROUND_H, T):
        for x in range(0, W, T):
            key = tuple(kind(x + dx, y + dy) for dx, dy in [(0, 0), (T, 0), (0, T), (T, T)])
            tile = tiles[key].copy()
            if len(set(key)) == 1:
                tile = tile.transpose(rng.choice([
                    Image.Transpose.FLIP_LEFT_RIGHT,
                    Image.Transpose.FLIP_TOP_BOTTOM,
                    Image.Transpose.ROTATE_180,
                ]))
                if key[0] == 'upper' and variants:
                    tile = Image.alpha_composite(tile, rng.choice(variants).copy())
            image.alpha_composite(tile, (x, y))
    draw = ImageDraw.Draw(image)
    colors = ['#f4e1ae', '#c783c0', '#9dc255']
    for cx, cy in [(114, 151), (234, 271), (384, 119), (501, 259), (575, 109), (56, 277)]:
        for _ in range(5):
            x = cx + rng.randrange(-15, 16)
            y = cy + rng.randrange(-8, 9)
            color = rng.choice(colors)
            if 0 <= x < W and 0 <= y < H and kind(x, y) == 'upper':
                draw.point((x, y), fill=color)
    return image


def blit_mask(mask, sprite, x, y):
    box = sprite.getbbox()
    if not box:
        return
    left = x - (box[0] + box[2]) // 2
    top = y - box[3]
    alpha = np.array(sprite)[:, :, 3] > 0
    height, width = alpha.shape
    y0, y1 = max(0, top), min(H, top + height)
    x0, x1 = max(0, left), min(W, left + width)
    if y1 > y0 and x1 > x0:
        mask[y0:y1, x0:x1] |= alpha[y0 - top:y1 - top, x0 - left:x1 - left]


def mark_shadow(mask, x, y):
    for yy in range(y - 3, y + 5):
        for xx in range(x - 6, x + 8):
            if 0 <= xx < W and 0 <= yy < H:
                mask[yy, xx] = True


def reference_grid(objects):
    cols, rows = math.ceil(W / T), math.ceil(H / T)
    grid = [[0] * cols for _ in range(rows)]
    for obj in objects:
        if not obj['solid']:
            continue
        name = obj['asset']
        x, y = obj['x'], obj['y']
        # O JSON aprovado só carimba a base quando a âncora cai dentro da imagem.
        if not (0 <= x < W and 0 <= y < H):
            continue
        fw = 8 if name.startswith(('oak', 'birch')) else (12 if name == 'log' else 10)
        fh = 5 if name.startswith(('oak', 'birch')) else 7
        rect = [x - fw // 2, y - fh, x + math.ceil(fw / 2), y]
        for gy in range(max(0, rect[1] // T), min(rows, (rect[3] - 1) // T + 1)):
            for gx in range(max(0, rect[0] // T), min(cols, (rect[2] - 1) // T + 1)):
                grid[gy][gx] = 1
    return grid


if __name__ == '__main__':
    main()
