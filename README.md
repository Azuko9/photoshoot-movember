# photoshoot-movember

Appli web de l'association Bear LGBTQIA+ Nous Nours 64 / 40 pour Movember 2026 : on se prend en photo (ou on choisit une photo), l'appli détoure la personne, place une moustache et compose un portrait 1080×1350 à partager avec deux images d'information. **Tout se passe dans le navigateur : aucune photo n'est envoyée.**

Site : https://meydur64.github.io/photoshoot-movember/

## Structure

| Fichier / dossier | Rôle |
|---|---|
| `index.html` | structure, balises `<meta>` (sécurité, aperçu de lien), aucun script ni style en ligne |
| `style.css`, `app.js` | styles et code de l'appli |
| `sw.js`, `manifest.webmanifest` | fonctionnement hors ligne après une visite ; icône d'appli |
| `confidentialite.html` | page de confidentialité et mentions (champs « À COMPLÉTER ») |
| `vendor/mediapipe/` | détourage et suivi du visage MediaPipe, hébergés ici (plus aucun service extérieur) |
| `fonts/` | polices Fredoka et Geist (SIL OFL) |
| `assets/` | images en WebP ; `explications.jpg` et `affiche.jpg` (JPEG) servent au partage |
| `scripts/` | outils : `extraire-assets.mjs` (historique), `convertir-webp.py`, `creer-icones.py` |
| `docs/captures/` | captures de contrôle (bureau, iPhone et Pixel émulés) |
| `LICENSES.md` | licences et crédits |

## Lancer en local

```
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000/. La caméra exige `localhost` ou HTTPS ; ouvrir `index.html` directement (file://) ne marche pas.

## Mise à jour l'an prochain

- **Moustaches** : remplacer/ajouter les images `assets/m_<id>.webp` (PNG converti par `scripts/convertir-webp.py`, transparence conservée), puis la liste `MUSTACHES` en haut de `app.js` (nom, description, largeur `wf`, ancrage `ay`) et la liste `COEUR` de `sw.js`.
- **Affiches et images d'info** : remplacer `explications.jpg` et `affiche.jpg` (partage) et relancer `python3 scripts/convertir-webp.py` ; `infos.webp` est l'image de cadre du portrait.
- **Textes** : dates et lieu dans `index.html`, légende dans `CAPTION_BASE` (`app.js`).
- **Toute modification publiée** : changer `VERSION` dans `sw.js` (`'v1'` → `'v2'`), sinon les visiteurs déjà venus gardent l'ancienne version en cache.

## Sécurité

- Politique de sécurité de contenu (CSP) en balise `<meta>` dans chaque page : scripts, styles, images, polices et connexions limités à ce site ; rien de chargé depuis un service extérieur ; pas de cookie ni de statistique ; `referrer` coupé.
- **Limites à connaître** : (1) GitHub Pages ne permet pas de régler les en-têtes HTTP ; une CSP en `<meta>` ne gère ni `frame-ancestors`, ni `report-uri`, ni `sandbox` ; un hébergeur comme Cloudflare Pages ou Netlify le permettrait. (2) La CSP garde `'unsafe-eval'` parce que MediaPipe (version « legacy ») génère du code à la volée ; la migration vers MediaPipe Tasks (étape 11 du plan) n'est pas faite. (3) La permission caméra est partagée par tout `meydur64.github.io` : un domaine dédié est recommandé.
- Les fichiers de `vendor/` sont ceux de Google (Apache-2.0), non modifiés.

## Crédits et licences

Voir `LICENSES.md` : MediaPipe (Apache-2.0, Google), polices Fredoka et Geist (SIL OFL), images et logos de l'association.

## Réalisation

Les correctifs de sécurité, d'accessibilité et de robustesse (branche `correctifs-securite`) ont été réalisés avec Claude Code (IA d'Anthropic), à la demande de l'association.
