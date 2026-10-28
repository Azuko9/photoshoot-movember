# Licences des composants tiers

## Polices

Polices hébergées dans `fonts/` (sous-ensemble latin, woff2), licence SIL Open Font License 1.1 (texte : `fonts/OFL.txt`).

| Police | Graisses | Licence | Source | Version |
|---|---|---|---|---|
| Fredoka | 500, 600, 700 | SIL OFL 1.1 | paquet npm `@fontsource/fredoka` (https://github.com/hafontia/Fredoka-One) | 5.3.0 |
| Geist | 400, 600 | SIL OFL 1.1 | paquet npm `@fontsource/geist` (https://github.com/vercel/geist-font) | 5.3.0 |

## MediaPipe

Fichiers hébergés dans `vendor/mediapipe-tasks/`, copiés sans modification, sous licence **Apache-2.0** (Copyright Google LLC) :

| Élément | Version / source | Fichiers |
|---|---|---|
| `@mediapipe/tasks-vision` (bibliothèque et WASM) | 1.1.0, registre npm | `vision_bundle.js`, `wasm/` |
| Modèle de détourage `selfie_segmenter` (float16) | storage.googleapis.com/mediapipe-models, téléchargé le 2026-10-28 | `selfie_segmenter.tflite` |
| Modèle de visage `face_landmarker` (float16) | storage.googleapis.com/mediapipe-models, téléchargé le 2026-10-28 | `face_landmarker.task` |

Texte de la licence : https://www.apache.org/licenses/LICENSE-2.0
**À vérifier par une personne** : la licence des deux modèles est annoncée Apache-2.0 sur leurs fiches (« model cards ») Google ; je n'ai pas pu relire ces fiches ici.
