"""Tracks the clothing in the hero video and writes public/video/tracks.json.

Boxes are placed by hand on the first frame (hat, both chest pockets, the
crossed sleeves) and followed through every frame with OpenCV's CSRT tracker.
The site plays the boxes back in sync with the video, so the tracker overlay
sits on the person's clothes instead of guessing from brightness.

Usage: python3 scripts/track-video.py   (needs opencv-contrib-python)
"""
import json
import cv2

SRC = 'public/video/hero.mp4'
START = {  # x, y, w, h on the 1280 x 720 first frame
    'hat': ((620, 20, 240, 150), 'BUCKET HAT', 'COTTON TWILL'),
    'pocket-l': ((580, 370, 130, 110), 'POCKET', 'DENIM 14OZ'),
    'pocket-r': ((800, 350, 140, 110), 'FLAP POCKET', 'DENIM 14OZ'),
    'sleeve': ((640, 540, 300, 130), 'SLEEVE', 'WASHED DENIM'),
}

cap = cv2.VideoCapture(SRC)
fps = cap.get(cv2.CAP_PROP_FPS)
ok, frame = cap.read()
trackers, frames = {}, {}
for key, (box, _, _) in START.items():
    t = cv2.TrackerCSRT_create()
    t.init(frame, box)
    trackers[key], frames[key] = t, [list(box)]
while True:
    ok, frame = cap.read()
    if not ok:
        break
    for key, t in trackers.items():
        found, box = t.update(frame)
        frames[key].append([int(v) for v in box] if found else frames[key][-1])

out = {'fps': fps / 2, 'w': int(cap.get(3)), 'h': int(cap.get(4)), 'tracks': []}
for key, (_, label, sub) in START.items():
    boxes = []
    for x, y, w, h in frames[key][::2]:  # every second frame is enough
        if key == 'hat':  # the tracker locks on the face; lift the box onto the hat
            y, h, x, w = max(0, int(y - h * 0.55)), int(h * 0.85), int(x - w * 0.08), int(w * 1.16)
        boxes.append([x, y, w, h])
    out['tracks'].append({'id': key, 'label': label, 'sub': sub, 'f': boxes})
json.dump(out, open('public/video/tracks.json', 'w'), separators=(',', ':'))
print('frames', len(frames['hat']))
