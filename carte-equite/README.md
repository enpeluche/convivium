# Carte de l'équité

Carte interactive des notions d'équité pour le partage de biens indivisibles, en français et en anglais. Elle couvre les définitions, les implications avec leurs preuves pas à pas, les contre-exemples, les échelles d'approximation et des algorithmes animés. Elle accompagne la thèse et évoluera avec elle.

## Lancer

Il suffit d'ouvrir `index.html` dans un navigateur, sans serveur ni connexion Internet : la police, le logo et KaTeX sont dans `assets/`. Pour l'héberger, on copie le dossier tel quel.

Adresses utiles : `#biens`, `#corvees`, `#ponderee`, `#valuations`, `#algorithmes` et `#definitions`. On peut forcer la langue avec `?lang=fr` ou `?lang=en`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `assets/donnees.js` | Tout le contenu, en français : notions, implications, preuves, exemples, échelles d'approximation |
| `assets/donnees-en.js` | La couche anglaise, posée par-dessus les données françaises. Les formules des preuves sont reprises des données françaises, seul le texte change |
| `assets/langue.js` | Textes de l'interface (FR/EN), traduction des algorithmes, changement de langue |
| `assets/moteur.js` | Dessin du graphe, cartes, sélecteur de valuations, onglet Algorithmes |
| `assets/definitions.js` | Onglet Définitions, généré à partir des données |
| `assets/style.css` | Direction artistique reprise d'enpeluche.github.io |
| `assets/vendor/katex/` | KaTeX 0.16.11 (licence MIT) |

## Ajouter une notion ou un lien

1. L'écrire dans `donnees.js`, au même format que ses voisines.
2. Ajouter sa traduction dans `donnees-en.js`, sous la même clé. Pour les preuves, `P(liens, clé, [...])` ne remplace que le texte de chaque étape.

Une clé absente de la couche anglaise reste affichée en français.

La version d'origine, en un seul fichier, est archivée dans `../archive/fairness_indivisible_map.html`.
