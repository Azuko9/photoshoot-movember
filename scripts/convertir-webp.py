#!/usr/bin/env python3
"""Convertit les images d'affichage en WebP (qualité 82, transparence conservée).
Les JPEG d'origine de explications et affiche restent en place : ce sont eux qui sont partagés (Instagram veut du JPEG).
Usage : python3 scripts/convertir-webp.py   (depuis la racine du dépôt ; nécessite Pillow)"""
from PIL import Image
import os
CIBLES = ['infos', 'logo', 'titre', 'empreinte', 'explications', 'affiche', 'fond',
          's1', 's2', 's3', 's4', 's5'] + [f[:-4] for f in sorted(os.listdir('assets')) if f.startswith('m_') and f.endswith('.png')]
for nom in CIBLES:
    src = next(f'assets/{nom}.{e}' for e in ('png', 'jpg') if os.path.exists(f'assets/{nom}.{e}'))
    im = Image.open(src)
    im.save(f'assets/{nom}.webp', 'WEBP', quality=82, method=6)
    print(f'{src}: {os.path.getsize(src)//1024} Ko -> {os.path.getsize(f"assets/{nom}.webp")//1024} Ko')
