#!/usr/bin/env python3
"""Crée les icônes (favicon, apple-touch-icon, icône d'appli) à partir de l'empreinte et l'image d'aperçu de lien
(og.jpg, 1200x630) à partir du logo et du titre. Usage : python3 scripts/creer-icones.py (racine du dépôt, Pillow requis)."""
from PIL import Image
BLEU = (25, 118, 181)
emp = Image.open('assets/empreinte.webp').convert('RGBA')
def icone(taille, nom):
    fond = Image.new('RGBA', (taille, taille), BLEU + (255,))
    e = emp.copy(); e.thumbnail((int(taille * .78),) * 2, Image.LANCZOS)
    fond.alpha_composite(e, ((taille - e.width) // 2, (taille - e.height) // 2))
    fond.convert('RGB').save(nom)
icone(32, 'assets/favicon-32.png'); icone(180, 'assets/apple-touch-icon.png'); icone(192, 'assets/icon-192.png')
og = Image.new('RGB', (1200, 630), BLEU)
logo = Image.open('assets/logo.webp').convert('RGBA'); titre = Image.open('assets/titre.webp').convert('RGBA')
logo.thumbnail((380, 380), Image.LANCZOS); titre.thumbnail((640, 260), Image.LANCZOS)
og.paste(logo, (90, (630 - logo.height) // 2), logo); og.paste(titre, (520, (630 - titre.height) // 2), titre)
og.save('assets/og.jpg', quality=88)
