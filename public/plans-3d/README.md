# Plans 3D — modèles

Modèles d'aménagement servis au viewer `src/components/vba/Van3DViewer.tsx`
(page : `/admin/plan-3d`). Un dossier par plan, un seul fichier par plan :

```
public/plans-3d/
├── meuble-glaciere/
│   ├── meuble-glaciere.dae             # export SketchUp COLLADA
│   └── textures/texture-bois-plank.jpg
└── lit-peigne/
    ├── lit-peigne.dae
    └── textures/
```

## Ajouter ou remplacer un plan

```bash
npx tsx scripts/prepare-plan-3d.ts "~/Downloads/Mon export.dae" mon-slug "Mon plan"
```

Le script **vide le dossier de destination** avant d'écrire (réimporter remplace
donc proprement la version précédente), copie le modèle, réduit et déduplique
les textures (SketchUp les exporte en pleine résolution — 18 Mo par JPEG),
réécrit les `<init_from>`, et affiche l'arborescence que le viewer va lire.
Accepte `.dae`, `.glb` et `.gltf`. Option `--exclude=Nom` pour retirer un nœud
de la scène (personnage d'échelle, mobilier voisin). macOS uniquement (`sips`).

## Structure SketchUp attendue

Le viewer ne lit **que** la hiérarchie de l'Outliner — les calques/tags ne sont
pas exportés en COLLADA — sur **trois niveaux** :

```
Meuble                    ← groupe racine, ignoré par le viewer
├── Étape 1               ← niveau 1
│   ├── Planches          ← niveau 2 (famille)
│   │   └── Planche haut  ← niveau 3 (pièce, nom de la DÉFINITION du composant)
│   └── Tasseaux
└── Étape 2
```

- Pour un composant, seul le nom de la **définition** est exporté — renommer
  l'instance dans l'Outliner ne change rien.
- Deux exemplaires du même composant portent le même nom dans le panneau.
- Un groupe n'est dépliable que s'il contient au moins 2 pièces.
- Options d'export : « faces bifaces » indifférent (le viewer détecte le cas),
  **décocher** « exporter les arêtes » (le viewer calcule ses propres contours),
  **cocher** « conserver la hiérarchie des composants ».

## Ouvrants animés

Un composant dont le nom commence par `Porte`, `Portière`, `Trappe`, `Abattant`
ou `Tiroir` devient cliquable avec l'outil **Interagir**. Deux règles :

1. **Modéliser en position fermée** — c'est la référence, le viewer ouvre.
2. **La poignée est dans le composant**, sous forme d'un volume nettement plus
   petit que le panneau : la charnière se place automatiquement à l'opposé.
   Poignée au centre haut → abattant ; poignée sur un côté → vantail.

## Provenance

- **meuble-glaciere** — export SketchUp 26.2 du 23/07/2026 (10 h 25), 38 × 64 ×
  52 cm, 21 pièces, portière ouvrante et grilles d'aération. Unité pouce, Z-UP.
- **lit-peigne** — export du 23/07/2026, 183 × 80 × 40 cm, organisé en 5 étapes
  de montage. Peigne à 15 dents de 12 cm.

⚠️ Ces fichiers sont **publics**. En production VBA, les plans passeront par
Supabase Storage en privé + route API derrière `profiles.plan = "vba_member"`.
