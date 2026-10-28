# photoshoot-movember

Appli web de l'association Bear LGBTQIA+ Nous Nours 64 / 40 pour Movember 2026 : on se prend en photo (ou on choisit une photo), l'appli détoure la personne, place une moustache et compose un portrait 1080×1350 à partager avec deux images d'information. **Tout se passe dans le navigateur : aucune photo n'est envoyée.**

Site d'origine : https://meydur64.github.io/photoshoot-movember/ (créé par Meydur64).
Version retravaillée (branche `azuko/photoshoot-2026`, fork Azuko9, pull request en brouillon) : https://azuko9.github.io/photoshoot-movember/

**Affichage** : pensé pour le téléphone ; à partir de 1000 px de large (ordinateur, tablette en paysage), l'accueil passe en deux colonnes, les étapes se placent côte à côte et le résultat s'affiche en deux colonnes. Les téléphones ne sont pas concernés. Après une mise à jour, recharger deux fois (service worker ; `VERSION` dans `sw.js`, v35).

## Structure

| Fichier / dossier | Rôle |
|---|---|
| `index.html` | structure, balises `<meta>` (sécurité, aperçu de lien), aucun script ni style en ligne |
| `style.css`, `app.js` | styles et code de l'appli |
| `sw.js`, `manifest.webmanifest` | fonctionnement hors ligne après une visite ; icône d'appli |
| `confidentialite.html` | page de confidentialité et mentions (champs « À COMPLÉTER ») |
| `vendor/mediapipe-tasks/` | détourage et suivi du visage (MediaPipe Tasks Vision 1.1.0 et ses deux modèles), hébergés ici (plus aucun service extérieur) |
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
- **Limites à connaître** : (1) GitHub Pages ne permet pas de régler les en-têtes HTTP ; une CSP en `<meta>` ne gère ni `frame-ancestors`, ni `report-uri`, ni `sandbox` ; un hébergeur comme Cloudflare Pages ou Netlify le permettrait. (2) La CSP n'a pas besoin de `'unsafe-eval'` (la migration vers MediaPipe Tasks l'a rendu inutile), seulement de `'wasm-unsafe-eval'`. (3) La permission caméra est partagée par tout `meydur64.github.io` : un domaine dédié est recommandé.
- Les fichiers de `vendor/` sont ceux de Google (Apache-2.0), non modifiés. Pour mettre MediaPipe à jour : prendre une version publiée depuis plus de deux semaines, remplacer `vision_bundle.js` et `wasm/`, retester le détourage et le placement de la moustache sur une vraie photo de visage.

## Crédits et licences

Voir `LICENSES.md` : MediaPipe (Apache-2.0, Google), polices Fredoka et Geist (SIL OFL), images et logos de l'association.

## Réalisation

Projet créé par Meydur64 (association Nous Nours), retravaillé par Azuko9 avec son accord, avec Claude Code (IA d'Anthropic) : sécurité, accessibilité (Android testé sur Pixel 6a et sur un second téléphone ; iPhone et VoiceOver non testés), page de confidentialité, petits écrans, version ordinateur. Les champs « À COMPLÉTER » de `confidentialite.html` restent à remplir par l'association.
