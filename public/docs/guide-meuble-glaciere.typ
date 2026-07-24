// ─── Guide de montage — Meuble Glacière (MG) ───
// Style IKEA : visuel, minimal, pictogrammes
// Compile: typst compile guide-meuble-glaciere.typ

#set page(
  paper: "a4",
  margin: (top: 2cm, bottom: 2cm, left: 2cm, right: 2cm),
  fill: white,
)

#set text(font: "Inter", size: 10pt, fill: rgb("#333333"))

// ─── Couleurs ───
#let grey-bg = rgb("#F5F5F5")
#let accent = rgb("#2B5EA7")
#let light-accent = rgb("#E8F0FE")
#let border-color = rgb("#DDDDDD")
#let tasseau-color = rgb("#A0784C")
#let planche-color = rgb("#CCCCCC")
#let highlight-color = rgb("#FFD54F")

// ─── Helpers ───
#let icon-screw = text(size: 14pt)[🔩]
#let icon-drill = text(size: 14pt)[🪛]
#let icon-warn = text(size: 14pt)[⚠️]
#let icon-check = text(size: 14pt)[✅]

#let step-number(n) = {
  box(
    width: 36pt,
    height: 36pt,
    radius: 18pt,
    fill: accent,
    stroke: none,
    align(center + horizon, text(fill: white, weight: "bold", size: 16pt)[#n])
  )
}

#let piece-tag(name, dims, qty: 1) = {
  box(
    inset: 6pt,
    radius: 4pt,
    fill: grey-bg,
    stroke: 0.5pt + border-color,
  )[
    #text(weight: "bold", size: 9pt)[#name] \
    #text(size: 8pt, fill: rgb("#666"))[#dims #if qty > 1 [— ×#qty]]
  ]
}

#let note-box(body) = {
  block(
    width: 100%,
    inset: 10pt,
    radius: 4pt,
    fill: rgb("#FFF8E1"),
    stroke: 0.5pt + rgb("#FFB300"),
  )[
    #icon-warn #h(4pt) #text(size: 9pt)[#body]
  ]
}

#let tool-box(..tools) = {
  block(
    width: 100%,
    inset: 10pt,
    radius: 4pt,
    fill: light-accent,
    stroke: 0.5pt + accent,
  )[
    #text(weight: "bold", size: 9pt)[Outils nécessaires :] \
    #for tool in tools.pos() {
      text(size: 9pt)[• #tool \ ]
    }
  ]
}

// ─── SVG path base ───
#let svg-path = "svg-mg/"

// ─── Pièce avec SVG ───
#let piece-card(number, name, dims, svg-file, qty: 1) = {
  block(
    width: 100%,
    inset: 12pt,
    radius: 6pt,
    stroke: 0.5pt + border-color,
    fill: white,
    below: 8pt,
  )[
    #grid(
      columns: (auto, 1fr, auto),
      gutter: 12pt,
      align(horizon)[
        #box(
          width: 28pt,
          height: 28pt,
          radius: 14pt,
          fill: grey-bg,
          stroke: 0.5pt + border-color,
          align(center + horizon, text(weight: "bold", size: 11pt, fill: accent)[#number])
        )
      ],
      align(horizon)[
        #text(weight: "bold", size: 11pt)[#name] \
        #text(size: 9pt, fill: rgb("#666"))[#dims] #if qty > 1 [#h(6pt) #text(fill: accent, weight: "bold", size: 9pt)[×#qty]]
      ],
      align(horizon + right)[
        #box(
          width: 80pt,
          height: 50pt,
          clip: true,
          radius: 4pt,
          stroke: 0.5pt + border-color,
          fill: rgb("#FAFAFA"),
          align(center + horizon,
            image(svg-path + svg-file, width: 70pt)
          )
        )
      ],
    )
  ]
}

// ─── Étape d'assemblage ───
#let assembly-step(number, title, description, pieces: (), visual: none) = {
  block(
    width: 100%,
    inset: 0pt,
    below: 16pt,
  )[
    #grid(
      columns: (42pt, 1fr),
      gutter: 12pt,
      align(top + center)[#step-number(number)],
      [
        #text(weight: "bold", size: 12pt)[#title]
        #v(4pt)
        #text(size: 10pt)[#description]
        #if pieces.len() > 0 {
          v(6pt)
          for p in pieces {
            piece-tag(p.at("name"), p.at("dims"), qty: p.at("qty", default: 1))
            h(6pt)
          }
        }
        #if visual != none {
          v(8pt)
          visual
        }
      ]
    )
    #v(4pt)
    #line(length: 100%, stroke: 0.3pt + rgb("#EEEEEE"))
  ]
}


// ════════════════════════════════════════════
//  PAGE 1 — COUVERTURE
// ════════════════════════════════════════════

#align(center)[
  #v(3cm)
  #text(size: 36pt, weight: "bold", fill: accent)[VANZON]
  #v(4pt)
  #text(size: 14pt, fill: rgb("#888"), tracking: 4pt)[EXPLORER]
  #v(2cm)
  #line(length: 40%, stroke: 1pt + accent)
  #v(1.5cm)
  #text(size: 22pt, weight: "bold")[Guide de montage]
  #v(8pt)
  #text(size: 16pt, fill: rgb("#666"))[Meuble Glacière — MG]
  #v(2cm)

  // Icônes style IKEA
  #grid(
    columns: (1fr, 1fr, 1fr),
    gutter: 20pt,
    [
      #align(center)[
        #text(size: 28pt)[📦] \
        #v(4pt)
        #text(size: 9pt, fill: rgb("#666"))[14 pièces]
      ]
    ],
    [
      #align(center)[
        #text(size: 28pt)[🔩] \
        #v(4pt)
        #text(size: 9pt, fill: rgb("#666"))[Vis 3,5×30 & 4×40]
      ]
    ],
    [
      #align(center)[
        #text(size: 28pt)[⏱️] \
        #v(4pt)
        #text(size: 9pt, fill: rgb("#666"))[~2 heures]
      ]
    ],
  )

  #v(3cm)
  #text(size: 9pt, fill: rgb("#AAAAAA"))[v1.0 — Juin 2026]
]


// ════════════════════════════════════════════
//  PAGE 2 — INVENTAIRE DES PIÈCES
// ════════════════════════════════════════════

#pagebreak()

#text(size: 18pt, weight: "bold", fill: accent)[1. Inventaire des pièces]
#v(4pt)
#text(size: 10pt, fill: rgb("#666"))[Vérifiez que toutes les pièces sont présentes avant de commencer.]
#v(12pt)

#text(size: 13pt, weight: "bold")[Planches (contreplaqué 15mm)]
#v(8pt)

#piece-card("A", "Planche bas", "345 × 540 mm", "124_Planche bas MG.svg")
#piece-card("B", "Planche haut", "330,5 × 540 mm", "121_Planche haut MG.svg")
#piece-card("C", "Planche gauche", "500 × 540 mm", "123_Planche gauche MG.svg")
#piece-card("D", "Planche droite", "540 × 500 mm", "125_Planche droite MG.svg")
#piece-card("E", "Planche fond", "360 × 500 mm", "126_Planche fond MG.svg")
#piece-card("F", "Planche face", "360 × 500 mm", "122_Planche face MG.svg")
#piece-card("G", "Porte placard", "340,7 × 270,8 mm", "127_Porte placard MG.svg")

#pagebreak()

#text(size: 13pt, weight: "bold")[Tasseaux (section 15 mm)]
#v(8pt)

#piece-card("H", "Tasseau gauche glacière", "525 × 15 mm", "128_Tasseau gauche glaci_re.svg")
#piece-card("I", "Tasseau droite glacière", "525 × 15 mm", "129_Tasseau droite glaci_re.svg")
#piece-card("J", "Tasseau vertical fond droite", "15 × 255 mm", "130_Tasseau vertical fond droite MG.svg", qty: 2)
#piece-card("K", "Tasseau horizontal avant haut", "330 × 15 mm", "134_Tasseau horizontal avant haut MG.svg")
#piece-card("L", "Tasseau horizontal arrière haut", "315 × 15 mm", "135_Tasseau horizontal arri_re haut  MG.svg")

#v(16pt)

#text(size: 13pt, weight: "bold")[Accessoire]
#v(8pt)

#piece-card("★", "Glacière", "—", "142_Glaci_re.svg")


// ════════════════════════════════════════════
//  PAGE 3 — QUINCAILLERIE & OUTILS
// ════════════════════════════════════════════

#pagebreak()

#text(size: 18pt, weight: "bold", fill: accent)[2. Quincaillerie & Outils]
#v(12pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 16pt,

  // Quincaillerie
  block(
    width: 100%,
    inset: 14pt,
    radius: 6pt,
    fill: grey-bg,
    stroke: 0.5pt + border-color,
  )[
    #text(weight: "bold", size: 12pt)[🔩 Quincaillerie]
    #v(8pt)
    #table(
      columns: (1fr, auto),
      stroke: none,
      inset: 4pt,
      [Vis à bois 3,5 × 30 mm], [× 40],
      [Vis à bois 4 × 40 mm], [× 20],
      [Charnières piano ou charnières 35mm], [× 2],
      [Aimant de porte (ou loquet push)], [× 1],
      [Colle à bois (optionnel)], [× 1],
    )
  ],

  // Outils
  block(
    width: 100%,
    inset: 14pt,
    radius: 6pt,
    fill: light-accent,
    stroke: 0.5pt + accent,
  )[
    #text(weight: "bold", size: 12pt)[🛠️ Outils]
    #v(8pt)
    #text(size: 10pt)[
      • Visseuse / perceuse \
      • Foret à bois 3 mm (pré-perçage) \
      • Embout cruciforme PH2 \
      • Mètre ruban \
      • Équerre \
      • Crayon \
      • Serre-joints (×2 min.) \
      • Ponceuse / papier 120 \
    ]
  ],
)

#v(16pt)
#note-box[
  *Pré-percez systématiquement* à 3 mm avant chaque vis pour éviter
  de fendre le contreplaqué. Profondeur de pré-perçage : 20 mm.
]


// ════════════════════════════════════════════
//  PAGE 4-5 — ÉTAPES DE MONTAGE
// ════════════════════════════════════════════

#pagebreak()

#text(size: 18pt, weight: "bold", fill: accent)[3. Montage — étape par étape]
#v(4pt)
#text(size: 10pt, fill: rgb("#666"))[Suivez l'ordre. Chaque étape dépend de la précédente.]
#v(16pt)

#assembly-step(1,
  "Assembler le cadre de base",
  [
    Posez la *planche bas* #text(fill: accent, weight: "bold")[\[A\]] à plat. \
    Fixez la *planche gauche* #text(fill: accent, weight: "bold")[\[C\]] verticalement sur le bord gauche, à l'équerre. \
    Pré-percez puis vissez avec 4 vis 4×40 mm depuis le dessous de #text(fill: accent, weight: "bold")[\[A\]] dans le chant de #text(fill: accent, weight: "bold")[\[C\]].
  ],
  pieces: (
    (name: "A — Planche bas", dims: "345×540"),
    (name: "C — Planche gauche", dims: "500×540"),
  ),
  visual: block(
    width: 100%,
    inset: 10pt,
    radius: 4pt,
    fill: rgb("#FAFAFA"),
    stroke: 0.5pt + border-color,
  )[
    #align(center)[
      #box(width: 200pt, height: 100pt)[
        #place(dx: 20pt, dy: 40pt, box(width: 160pt, height: 50pt, fill: planche-color, stroke: 1pt + rgb("#666"), radius: 2pt, align(center + horizon, text(size: 8pt, weight: "bold")[A — bas])))
        #place(dx: 20pt, dy: 0pt, box(width: 10pt, height: 90pt, fill: planche-color, stroke: 1pt + rgb("#666"), radius: 2pt, align(center + horizon, text(size: 6pt, weight: "bold")[C])))
      ]
    ]
  ]
)

#assembly-step(2,
  "Fixer la planche droite",
  [
    Placez la *planche droite* #text(fill: accent, weight: "bold")[\[D\]] en face de #text(fill: accent, weight: "bold")[\[C\]]. \
    Vissez depuis le dessous de #text(fill: accent, weight: "bold")[\[A\]] — 4 vis 4×40 mm. \
    Vérifiez l'équerrage avant de serrer.
  ],
  pieces: (
    (name: "D — Planche droite", dims: "540×500"),
  ),
)

#assembly-step(3,
  "Poser les tasseaux de support glacière",
  [
    Les tasseaux #text(fill: accent, weight: "bold")[\[H\]] et #text(fill: accent, weight: "bold")[\[I\]] servent de rails pour poser la glacière. \
    Vissez-les *horizontalement* sur les faces internes de #text(fill: accent, weight: "bold")[\[C\]] et #text(fill: accent, weight: "bold")[\[D\]], à la hauteur souhaitée pour la glacière (mesurer depuis le bas). \
    3 vis 3,5×30 mm par tasseau. Vérifiez qu'ils sont *parfaitement de niveau* entre eux.
  ],
  pieces: (
    (name: "H — Tasseau gauche", dims: "525×15"),
    (name: "I — Tasseau droite", dims: "525×15"),
  ),
  visual: block(
    width: 100%,
    inset: 10pt,
    radius: 4pt,
    fill: rgb("#FAFAFA"),
    stroke: 0.5pt + border-color,
  )[
    #align(center)[
      #box(width: 200pt, height: 110pt)[
        // Base
        #place(dx: 20pt, dy: 70pt, box(width: 160pt, height: 30pt, fill: planche-color, stroke: 1pt + rgb("#666"), radius: 2pt, align(center + horizon, text(size: 7pt)[A])))
        // Left wall
        #place(dx: 20pt, dy: 0pt, box(width: 10pt, height: 100pt, fill: planche-color, stroke: 1pt + rgb("#666"), radius: 2pt))
        // Right wall
        #place(dx: 170pt, dy: 0pt, box(width: 10pt, height: 100pt, fill: planche-color, stroke: 1pt + rgb("#666"), radius: 2pt))
        // Tasseau left
        #place(dx: 30pt, dy: 45pt, box(width: 4pt, height: 60pt, fill: tasseau-color, stroke: 0.5pt + rgb("#666"), radius: 1pt))
        // Tasseau right
        #place(dx: 166pt, dy: 45pt, box(width: 4pt, height: 60pt, fill: tasseau-color, stroke: 0.5pt + rgb("#666"), radius: 1pt))
        // Labels
        #place(dx: 36pt, dy: 55pt, text(size: 6pt, fill: tasseau-color, weight: "bold")[H])
        #place(dx: 155pt, dy: 55pt, text(size: 6pt, fill: tasseau-color, weight: "bold")[I])
        // Level indicator
        #place(dx: 50pt, dy: 48pt, line(length: 100pt, stroke: (paint: accent, thickness: 0.5pt, dash: "dashed")))
        #place(dx: 85pt, dy: 42pt, text(size: 6pt, fill: accent)[niveau ↔])
      ]
    ]
  ]
)

#pagebreak()

#assembly-step(4,
  "Fixer le fond",
  [
    Glissez la *planche fond* #text(fill: accent, weight: "bold")[\[E\]] entre #text(fill: accent, weight: "bold")[\[C\]] et #text(fill: accent, weight: "bold")[\[D\]], côté arrière. \
    Vissez dans les chants de #text(fill: accent, weight: "bold")[\[C\]] et #text(fill: accent, weight: "bold")[\[D\]] — 3 vis 3,5×30 mm par côté. \
    Vissez aussi dans le chant arrière de #text(fill: accent, weight: "bold")[\[A\]] — 3 vis.
  ],
  pieces: (
    (name: "E — Planche fond", dims: "360×500"),
  ),
)

#assembly-step(5,
  "Renforcer avec les tasseaux verticaux arrière",
  [
    Fixez les 2 *tasseaux verticaux* #text(fill: accent, weight: "bold")[\[J\]] dans les angles arrière internes
    (jonction fond / côtés). \
    Ils renforcent la rigidité du caisson. \
    2 vis 3,5×30 mm par tasseau.
  ],
  pieces: (
    (name: "J — Tasseau vertical fond", dims: "15×255", qty: 2),
  ),
)

#assembly-step(6,
  "Poser la planche du haut",
  [
    Posez la *planche haut* #text(fill: accent, weight: "bold")[\[B\]] sur le dessus du caisson. \
    Avant de visser, fixez les *tasseaux horizontaux* #text(fill: accent, weight: "bold")[\[K\]] (avant) et #text(fill: accent, weight: "bold")[\[L\]] (arrière)
    sous la planche #text(fill: accent, weight: "bold")[\[B\]], au ras des bords — ils servent de butée et de renfort. \
    Puis vissez #text(fill: accent, weight: "bold")[\[B\]] dans les chants de #text(fill: accent, weight: "bold")[\[C\]], #text(fill: accent, weight: "bold")[\[D\]] et #text(fill: accent, weight: "bold")[\[E\]] — 4 vis 4×40 mm par côté.
  ],
  pieces: (
    (name: "B — Planche haut", dims: "330,5×540"),
    (name: "K — Tasseau avant haut", dims: "330×15"),
    (name: "L — Tasseau arrière haut", dims: "315×15"),
  ),
)

#assembly-step(7,
  "Monter la face avant",
  [
    Fixez la *planche face* #text(fill: accent, weight: "bold")[\[F\]] à l'avant du caisson. \
    Elle doit couvrir la zone *au-dessus* de l'espace porte. \
    Vissez dans les chants de #text(fill: accent, weight: "bold")[\[C\]], #text(fill: accent, weight: "bold")[\[D\]] et le dessous de #text(fill: accent, weight: "bold")[\[B\]] — vis 3,5×30 mm.
  ],
  pieces: (
    (name: "F — Planche face", dims: "360×500"),
  ),
)

#assembly-step(8,
  "Installer la porte",
  [
    Fixez les *charnières* sur le bord de la *porte* #text(fill: accent, weight: "bold")[\[G\]]. \
    Positionnez la porte dans l'ouverture basse du meuble. \
    Vissez les charnières sur le montant #text(fill: accent, weight: "bold")[\[C\]] ou #text(fill: accent, weight: "bold")[\[D\]] (selon le sens d'ouverture souhaité). \
    Installez l'*aimant / loquet* du côté opposé pour maintenir la porte fermée.
  ],
  pieces: (
    (name: "G — Porte placard", dims: "340,7×270,8"),
  ),
)

#assembly-step(9,
  "Placer la glacière",
  [
    Glissez la *glacière* #text(fill: accent, weight: "bold")[\[★\]] sur les tasseaux-rails #text(fill: accent, weight: "bold")[\[H\]] et #text(fill: accent, weight: "bold")[\[I\]]. \
    Elle doit pouvoir coulisser facilement pour être retirée. \
    #icon-check Vérifiez que le câble d'alimentation 12V passe par l'arrière.
  ],
  pieces: (
    (name: "★ — Glacière", dims: "—"),
  ),
)


// ════════════════════════════════════════════
//  PAGE FINALE — RÉSULTAT & NOTES
// ════════════════════════════════════════════

#pagebreak()

#text(size: 18pt, weight: "bold", fill: accent)[4. Vérifications finales]
#v(12pt)

#block(
  width: 100%,
  inset: 14pt,
  radius: 6pt,
  fill: rgb("#E8F5E9"),
  stroke: 0.5pt + rgb("#4CAF50"),
)[
  #text(weight: "bold", size: 12pt)[Checklist #icon-check]
  #v(8pt)
  #text(size: 10pt)[
    #box(width: 12pt, height: 12pt, stroke: 0.5pt + rgb("#666"), radius: 2pt) #h(4pt) Équerrage vérifié (diagonales égales) \
    #v(3pt)
    #box(width: 12pt, height: 12pt, stroke: 0.5pt + rgb("#666"), radius: 2pt) #h(4pt) Toutes les vis sont serrées \
    #v(3pt)
    #box(width: 12pt, height: 12pt, stroke: 0.5pt + rgb("#666"), radius: 2pt) #h(4pt) La glacière coulisse sans forcer sur les rails H / I \
    #v(3pt)
    #box(width: 12pt, height: 12pt, stroke: 0.5pt + rgb("#666"), radius: 2pt) #h(4pt) La porte s'ouvre et se ferme correctement \
    #v(3pt)
    #box(width: 12pt, height: 12pt, stroke: 0.5pt + rgb("#666"), radius: 2pt) #h(4pt) Le câble 12V de la glacière est accessible \
    #v(3pt)
    #box(width: 12pt, height: 12pt, stroke: 0.5pt + rgb("#666"), radius: 2pt) #h(4pt) Le meuble est stable et ne bouge pas \
  ]
]

#v(20pt)

#note-box[
  *Fixation au van :* Ce meuble doit être solidement fixé au plancher et/ou aux parois du van
  avec des équerres métalliques et boulons M6. Ne jamais laisser un meuble libre en roulant.
]

#v(20pt)

#align(center)[
  #text(size: 10pt, fill: rgb("#AAAAAA"))[
    Guide généré par Vanzon Explorer — vanzonexplorer.com \
    Pièces modélisées dans SketchUp — SVG exportés pour découpe
  ]
]
