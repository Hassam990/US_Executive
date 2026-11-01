from PIL import Image
im = Image.open("_shots/clip.png").convert("L")
w,h = im.size
px = im.load()
pts = [(x,y) for y in range(h) for x in range(w) if px[x,y] > 200]
print("white pixels", len(pts))
if pts:
    print("bbox", min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts))
