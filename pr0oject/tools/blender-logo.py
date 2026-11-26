# Renders the ZEDI wordmark as a solid metal object in Blender (Cycles).
#
#   "C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b -P tools/blender-logo.py -- out=assets/img/logo3d
#
# Options after "--":  out=<folder>  looks=day,night  frames=9  width=1800  samples=128  test=1
# Reads the stroke definitions in tools/logo-strokes.json (written by tools/gen-logo.js). Writes <look>-<n>.webp: the logo
# turned from -YAW to +YAW degrees, on a transparent background, for assets/js/metal.js.
# A development helper only: the site itself just shows the finished images.
import bpy
import bmesh
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
args = dict(a.split('=', 1) for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []) if '=' in a)
OUT = os.path.join(ROOT, args.get('out', 'assets/img/logo3d'))
LOOKS = args.get('looks', 'day,night').split(',')
FRAMES = int(args.get('frames', 9))
RES_X = int(args.get('width', 1800))
SAMPLES = int(args.get('samples', 128))
TEST = args.get('test') == '1'

YAW = 20.0          # degrees either side; keep in step with assets/js/metal.js
PITCH = 7.0         # the top leans back a little, so the upper bevels catch the light
MARGIN = 0.06       # empty border around the logo, as a share of its width (each side)
UNIT = 1 / 100      # artwork units to metres
DEPTH = 0.34        # thickness of the metal
BEVEL = 0.07        # depth and inset of the bevelled edge

data = json.load(open(os.path.join(HERE, 'logo-strokes.json')))
ART_W, ART_H = data['width'] * UNIT, data['height'] * UNIT

# ----------------------------------------------------------------- scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ----------------------------------------------------------------- geometry
# Every brush stroke is built as its own solid: a straight wall at the back, then a bevel made
# of layers that pull the outline in towards the front (a soft chamfer, not a pillow). The
# strokes are then united into one piece; where they meet, their bevels cut into each other
# like welded metal. Same curve and width maths as tools/gen-logo.js.
N = data['samples']
CAP = data['cap']
B = BEVEL / UNIT            # bevel in artwork units
D = DEPTH / UNIT
SEG = 5
MIN_HALF = 0.15             # thorn tips keep a hair of width so the mesh stays valid

def bez(p, t):
    u = 1 - t
    a, b, c, d = u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t
    return (a * p[0] + b * p[2] + c * p[4] + d * p[6], a * p[1] + b * p[3] + c * p[5] + d * p[7])

def tangent(p, t):
    u = 1 - t
    x = 3 * u * u * (p[2] - p[0]) + 6 * u * t * (p[4] - p[2]) + 3 * t * t * (p[6] - p[4])
    y = 3 * u * u * (p[3] - p[1]) + 6 * u * t * (p[5] - p[3]) + 3 * t * t * (p[7] - p[5])
    l = math.hypot(x, y) or 1
    return (x / l, y / l)

def width(w, t):
    m = 2 * w[1] - 0.5 * (w[0] + w[2])
    u = 1 - t
    return u * u * w[0] + 2 * u * t * m + t * t * w[2]

def outline(stroke, shrink):
    p, w = stroke['pts'], stroke['w']
    left, right = [], []
    for i in range(N + 1):
        t = i / N
        c, d = bez(p, t), tangent(p, t)
        h = max(width(w, t) / 2 - shrink, MIN_HALF)
        left.append((c[0] - d[1] * h, c[1] + d[0] * h))
        right.append((c[0] + d[1] * h, c[1] - d[0] * h))
    def tip(t, sign):
        c, d = bez(p, t), tangent(p, t)
        k = CAP * 2 * max(width(w, t) / 2 - shrink, MIN_HALF) * sign
        return (c[0] + d[0] * k, c[1] + d[1] * k)
    start = [tip(0, -1)] if stroke['cap'] and w[0] > 0 else []
    end = [tip(1, 1)] if w[2] > 0 else []
    return start + left + end + right[::-1]

# (depth, inset) from the back to the front face: a wall, then a chamfer softened halfway to round
layers = [(0.0, 0.0), (D - B, 0.0)]
for j in range(1, SEG + 1):
    a = j / SEG
    th = a * math.pi / 2
    layers.append((D - B + B * (0.5 * a + 0.5 * math.sin(th)), B * (0.5 * a + 0.5 * (1 - math.cos(th)))))

def solid(stroke, name):
    bm = bmesh.new()
    rings = []
    for z, inset in layers:
        rings.append([bm.verts.new((x * UNIT - ART_W / 2, ART_H / 2 - y * UNIT, z * UNIT)) for x, y in outline(stroke, inset)])
    m = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(m):
            j = (i + 1) % m
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    return bpy.data.objects.new(name, mesh)

parts = bpy.data.collections.new('parts')
scene.collection.children.link(parts)
pieces = [solid(s, 'stroke%02d' % i) for i, s in enumerate(data['strokes'])]
for p in pieces:
    parts.objects.link(p)

# one solid: the first stroke united with all the others (exact boolean)
logo = pieces[0]
parts.objects.unlink(logo)
scene.collection.objects.link(logo)
logo.name = 'ZEDI'
union = logo.modifiers.new('union', 'BOOLEAN')
union.operation = 'UNION'
union.solver = 'EXACT'
union.operand_type = 'COLLECTION'
union.collection = parts
bpy.context.view_layer.objects.active = logo
logo.select_set(True)
bpy.ops.object.modifier_apply(modifier='union')
for p in pieces[1:]:
    bpy.data.objects.remove(p, do_unlink=True)
bpy.data.collections.remove(parts)

bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=0.0002)
bpy.ops.object.mode_set(mode='OBJECT')

# shading: smooth along the bevels and curved walls, crisp where strokes cut into each other,
# and weighted normals so the flat front faces stay exactly flat (no smudges)
bm = bmesh.new()
bm.from_mesh(logo.data)
for face in bm.faces:
    face.smooth = True
for edge in bm.edges:
    edge.smooth = edge.is_manifold and edge.calc_face_angle(0) < math.radians(48)
bm.to_mesh(logo.data)
bm.free()
weighted = logo.modifiers.new('normals', 'WEIGHTED_NORMAL')
weighted.mode = 'FACE_AREA'
weighted.weight = 50
weighted.keep_sharp = True
bpy.ops.object.modifier_apply(modifier='normals')

# pivot in the middle of the slab so it turns on the spot
logo.location = (0, 0, 0)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.transform.translate(value=(0, 0, -DEPTH / 2))
bpy.ops.object.mode_set(mode='OBJECT')

# ----------------------------------------------------------------- material
def metal(name, base, metallic, rough):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*base, 1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = rough
    if args.get('grain') == '0':
        return m
    # fine brushed grain: breaks up the highlights so the faces read as satin, not mirror
    tree = m.node_tree
    noise = tree.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 900.0
    noise.inputs['Detail'].default_value = 2.0
    mapping = tree.nodes.new('ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (1.0, 0.04, 1.0)       # long grain, side to side
    coord = tree.nodes.new('ShaderNodeTexCoord')
    tree.links.new(coord.outputs['Object'], mapping.inputs['Vector'])
    tree.links.new(mapping.outputs['Vector'], noise.inputs['Vector'])
    ramp = tree.nodes.new('ShaderNodeMapRange')
    ramp.inputs['To Min'].default_value = rough - 0.05
    ramp.inputs['To Max'].default_value = rough + 0.07
    tree.links.new(noise.outputs['Fac'], ramp.inputs['Value'])
    tree.links.new(ramp.outputs['Result'], p.inputs['Roughness'])
    return m

LOOK = {
    # dark graphite, soft and satin, for the light page
    'day': dict(base=(0.02, 0.02, 0.022), metallic=0.6, rough=0.32, world=0.1, rim=None),
    # gunmetal with a cold blue edge light, for the black page
    'night': dict(base=(0.05, 0.055, 0.07), metallic=0.85, rough=0.3, world=0.03, rim=(0.12, 0.26, 1.0)),
}

# ----------------------------------------------------------------- lights and camera
def area(name, loc, size, power, colour=(1, 1, 1), size_y=None):
    l = bpy.data.lights.new(name, 'AREA')
    l.shape = 'RECTANGLE'
    l.size = size
    l.size_y = size_y or size
    l.energy = power
    l.color = colour
    o = bpy.data.objects.new(name, l)
    o.location = loc
    scene.collection.objects.link(o)
    track = o.constraints.new('TRACK_TO')
    track.target = logo
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'
    return l

key = area('key', (-5.5, 6.5, 8.0), 6.0, 1300)                 # big soft box, top left
strip = area('strip', (0.0, 7.0, 3.5), 16.0, 2600, size_y=1.6)  # long strip above: lights the upper bevels
fill = area('fill', (5.0, -6.0, 4.0), 8.0, 700)                # soft fill from the lower right
front = area('front', (0.0, 0.5, 14.0), 16.0, 90)             # broad front sheen across the faces
rim_l = area('rimL', (-8.0, 1.0, -3.0), 4.0, 0)
rim_r = area('rimR', (8.0, -1.0, -3.0), 4.0, 0)

frame_w = ART_W * (1 + 2 * MARGIN)
frame_h = ART_H + 2 * MARGIN * ART_W
cam_data = bpy.data.cameras.new('cam')
cam_data.lens = 85
cam_data.sensor_fit = 'HORIZONTAL'
cam_data.sensor_width = 36
dist = frame_w * cam_data.lens / cam_data.sensor_width
cam = bpy.data.objects.new('cam', cam_data)
cam.location = (0, 0, dist)
scene.collection.objects.link(cam)
scene.camera = cam

world = bpy.data.worlds.new('world')
world.use_nodes = True
scene.world = world
bg = world.node_tree.nodes.get('Background')

# ----------------------------------------------------------------- render settings
scene.render.engine = 'CYCLES'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for kind in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
        try:
            prefs.compute_device_type = kind
            prefs.get_devices()
            if any(d.type == kind for d in prefs.devices):
                break
        except Exception:
            continue
    for d in prefs.devices:
        d.use = d.type != 'CPU'
    scene.cycles.device = 'GPU'
except Exception as e:
    print('GPU not available, rendering on the CPU:', e)
scene.cycles.samples = int(args.get("samples", 24)) if TEST else SAMPLES
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = RES_X
scene.render.resolution_y = int(round(RES_X * frame_h / frame_w / 2) * 2)
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.quality = 88

os.makedirs(OUT, exist_ok=True)
yaws = [0.0] if TEST else [(-YAW + 2 * YAW * i / (FRAMES - 1)) for i in range(FRAMES)]
for look in LOOKS:
    L = LOOK[look]
    logo.data.materials.clear()
    logo.data.materials.append(metal(look, L['base'], L['metallic'], L['rough']))
    bg.inputs['Color'].default_value = (0.5, 0.5, 0.52, 1)
    bg.inputs['Strength'].default_value = L['world']
    for rim in (rim_l, rim_r):
        rim.energy = 2600 if L['rim'] else 0
        rim.color = L['rim'] or (1, 1, 1)
    for i, yaw in enumerate(yaws):
        logo.rotation_euler = (math.radians(-PITCH), math.radians(yaw), 0)
        scene.render.filepath = os.path.join(OUT, '%s-%d.webp' % (look, i if not TEST else 99))
        bpy.ops.render.render(write_still=True)
        print('rendered', scene.render.filepath, flush=True)

print('frame', scene.render.resolution_x, scene.render.resolution_y, 'margin', MARGIN, flush=True)
