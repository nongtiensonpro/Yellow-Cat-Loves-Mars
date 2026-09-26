"""Build biome-patches.png from NASA PIA02031 MOLA map (public domain).
Run: python scripts/build-mola-height.py  (needs Pillow; downloads source if missing)"""
import math, colorsys, pathlib, json, urllib.request
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT/"assets"/"textures"; SRC = ASSETS/"_src_pia02031.jpg"
URL = "https://upload.wikimedia.org/wikipedia/commons/1/1d/Mars_Map.JPG"
if not SRC.exists():
    req = urllib.request.Request(URL, headers={"User-Agent":"YellowCatLovesMars-dev/0.4"})
    SRC.write_bytes(urllib.request.urlopen(req, timeout=120).read())
X0,X1,Y0,Y1 = 148,2093,63,1133
M70 = math.log(math.tan(math.radians(45+35)))
RAMP = [(245,-7500),(230,-6200),(210,-5200),(195,-4300),(170,-3600),(140,-2800),
        (105,-1900),(75,-1000),(55,-300),(38,800),(26,2000),(15,4200),(6,6500),(0,8500)]
def elev_from_rgb(r,g,b):
    h,s,v = colorsys.rgb_to_hsv(r/255,g/255,b/255); h*=360
    if v<0.10 or s<0.10: return None
    if h>=330: return 9000.0
    if h>=RAMP[0][0]: return float(RAMP[0][1])
    if h<=RAMP[-1][0]: return float(RAMP[-1][1])
    for (h1,e1),(h2,e2) in zip(RAMP,RAMP[1:]):
        if h2<=h<=h1:
            t=(h-h2)/(h1-h2); return e2+t*(e1-e2)
    return float(RAMP[-1][1])
def lon_to_x(lonE):
    ls = lonE if lonE<=180 else lonE-360
    return X0+(0.5+ls/360)*(X1-X0)
def lat_to_y(lat):
    lat=max(-69.9,min(69.9,lat))
    m=math.log(math.tan(math.radians(45+lat/2)))
    return Y0+((M70-m)/(2*M70))*(Y1-Y0)
im = Image.open(SRC).convert("RGB"); px = im.load()
def sample_elev(lonE,lat):
    x=max(0,min(im.width-1,int(round(lon_to_x(lonE))))); y=max(0,min(im.height-1,int(round(lat_to_y(lat)))))
    return elev_from_rgb(*px[x,y])
PATCHES = {"arcadia":dict(lon0=178.0,lat0=46.0,half=7.0,relief=55),"valles":dict(lon0=297.0,lat0=-8.0,half=8.0,relief=95),
 "olympus":dict(lon0=226.2,lat0=18.6,half=4.0,relief=150),"polar":dict(lon0=160.0,lat0=-66.0,half=5.0,relief=60),
 "storm":dict(lon0=70.0,lat0=10.0,half=6.0,relief=50)}
N=56; sheet=Image.new("L",(N*len(PATCHES),N))
for bi,(k,v) in enumerate(PATCHES.items()):
    cell=v["half"]*2/(N-1); elevs=[]
    for j in range(N):
        lat=v["lat0"]-(j-(N-1)/2)*cell
        elevs.append([ (e := sample_elev((v["lon0"]+(i-(N-1)/2)*cell)%360, lat)) or 0.0 for i in range(N)])
    mn=min(map(min,elevs)); mx=max(map(max,elevs))
    for j in range(N):
        for i in range(N):
            val=0 if mx<=mn else (elevs[j][i]-mn)/(mx-mn)
            sheet.putpixel((bi*N+i,j),int(val*255+0.5))
    print(k,"elev",round(mn),"..",round(mx),"m")
sheet.save(ASSETS/"biome-patches.png"); print("wrote biome-patches.png")
