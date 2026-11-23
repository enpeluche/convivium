# Simulateur de frustration

Simulateur interactif qui accompagne la thèse : n agents partagent une ressource, et on sert à chaque instant l'agent dont l'état normalisé u/λ est le plus grand. Le modèle complet est décrit dans l'onglet « Modèle » de la page.

## Lancer

Il suffit d'ouvrir `index.html` dans un navigateur, sans serveur ni connexion Internet : la police, le logo et KaTeX sont dans `assets/`. Pour l'héberger, on copie le dossier tel quel (GitHub Pages, site Inria…).

## Fichiers

| Fichier | Rôle |
|---|---|
| `assets/model.js` | Dynamique, politique argmax u/λ avec la fonction de choix χ, charge X, parts de référence, détection de période |
| `assets/charts.js` | Tracés canvas : courbes (survol, halo, infobulle, bande des agents servis) et histogramme besoins / parts |
| `assets/app.js` | Interface : éditeur d'agents, lecture, tableaux, exports, sauvegarde. **Le bloc `ABOUT` en tête définit le nom, le rôle et les liens.** |
| `assets/i18n.js` | Les textes de l'interface, en français et en anglais |
| `assets/model-text.js` | La page « Modèle », en LaTeX (rendu par KaTeX), en français et en anglais, avec la figure de la dynamique |
| `assets/vendor/katex/` | KaTeX 0.16.11 (licence MIT), embarqué pour marcher hors ligne |
| `assets/style.css` | Direction artistique reprise d'enpeluche.github.io |

## Ajouter un scénario

1. Ajouter une entrée dans `PRESETS` (`app.js`) : `[u(0), λ, σ]` par agent, avec σ > λ.
2. Ajouter son nom et sa description dans `presets`, en français et en anglais (`i18n.js`).

## Raccourcis

- Espace : lecture et pause
- ← et → : reculer ou avancer d'un instant
- Début : revenir à t = 0
