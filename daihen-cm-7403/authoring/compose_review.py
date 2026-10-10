"""Compose only our own rendered model images; never package OEM reference media.
Usage: python3 compose_review.py REVIEW_DIRECTORY OUTPUT_DIRECTORY
Expects before-iso.png and final/{iso,side,rear,front,spool}.png.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import sys
src,out=map(Path,sys.argv[1:]);out.mkdir(parents=True,exist_ok=True)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def f(size):return ImageFont.truetype(font,size)
def sheet(name,title,items,cols,size=800):
    rows=(len(items)+cols-1)//cols
    im=Image.new('RGB',(cols*size,100+rows*(size+58)),(239,243,247));draw=ImageDraw.Draw(im)
    draw.text((28,27),title,font=f(32),fill=(22,40,56))
    for i,(label,path) in enumerate(items):
        x=(i%cols)*size;y=100+(i//cols)*(size+58)
        pic=Image.open(path).convert('RGB');pic.thumbnail((size,size));im.paste(pic,(x+(size-pic.width)//2,y))
        draw.text((x+22,y+size+12),label,font=f(23),fill=(28,43,58))
    im.save(out/name)
sheet('before-after.png','DAIHEN CM-7403 | independently authored geometry',[
 ('BEFORE | unchanged camera and lighting',src/'before-iso.png'),
 ('AFTER | 254 x 611 x 393 mm visual envelope',src/'final/iso.png')],2)
sheet('detail-views.png','CM-7403 | photo-estimated details; legacy URDF preserved',[
 ('SIDE | approximate exposed feed mechanism',src/'final/side.png'),
 ('REAR | supported spindle and wound spool',src/'final/rear.png'),
 ('FRONT | visual outlet differs from legacy frame',src/'final/front.png'),
 ('SPOOL | independent flanges, hub and winding',src/'final/spool.png')],2,700)
