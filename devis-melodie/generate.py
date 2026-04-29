#!/usr/bin/env python3
import json, re, os, base64, sys

with open(sys.argv[1], 'r') as f:
    data = json.load(f)

base_dir = os.path.dirname(os.path.abspath(__file__)) + '/images'

# Load logo as base64
logo_b64 = ''
logo_path = base_dir + '/logo-vanzon.png'
if os.path.exists(logo_path):
    with open(logo_path, 'rb') as lf:
        logo_b64 = base64.b64encode(lf.read()).decode('ascii')

# Professional title mapping
title_map = {
    "Rouleau Armflex": "Isolation Armaflex 19 mm (rouleaux 3 m x 1 m)",
    "Glissières de tiroir 1m (120 kg)": "Glissieres de tiroir 1000 mm - 120 kg",
    "Contre plaqué 15mm": "Contreplaque 15 mm (panneaux structure)",
    "Contre plaqué 15mm ": "Contreplaque 15 mm (panneaux structure)",
    "Galcière": "Glaciere a compresseur 12V",
    "LED": "Bandeau LED 12V (eclairage interieur)",
    "Colle néoprène spray": "Colle neoprene en spray (feutrine)",
    "Rail rideaux plafond 5m": "Rail de rideau flexible plafond - 5 m",
    "Plat fond": "Panneaux tasseaux bois (habillage plafond)",
    "Plat fond ": "Panneaux tasseaux bois (habillage plafond)",
    "Habillages bois Renault (mur)": "Kit habillage bois mural Renault Trafic",
    "Filet Rangement (lot de 5)": "Filets de rangement (lot de 5)",
    "Rideau": "Store occultant 300 x 150 cm",
    "Rideaux côté": "Rideaux occultants lateraux Trafic",
    "Batterie": "Batterie auxiliaire 12V",
    "Robinet BOXIO": "Point d'eau BOXIO (robinet + reservoir)",
    "Armaflex Tape": "Ruban adhesif Armaflex 15 m x 50 mm",
    "Armaflex Cleaner": "Nettoyant de surface Armaflex (preparation tole)",
    "Colle Sikaflex (tout en un)": "Colle-mastic Sikaflex polyvalente",
    "Sol PVC": "Revetement de sol PVC (lames clipsables)",
    "Matelas sur-mesure": "Matelas pliable sur-mesure (mousse HR)",
    "Tasseau montants": "Tasseaux bois (montants structure)",
    "Tasseau montants ": "Tasseaux bois (montants structure)",
    "Rideaux arrière": "Rideaux occultants portes arriere Trafic",
    "Feutrine": "Feutrine d'habillage 190 x 100 cm",
    "100 vis à bois (12mm)": "Vis a bois 2,5 x 12 mm (lot de 100)",
    "Panneau solaire 195W": "Panneau solaire 195W (installation toiture)",
    "Vernis polyrétane (1L)": "Vernis polyurethane brillant (1 L)",
}

# Desired order: group rideaux together (occultants cote a cote)
desired_order = [
    "Rouleau Armflex",
    "Armaflex Tape",
    "Armaflex Cleaner",
    "Colle néoprène spray",
    "Colle Sikaflex (tout en un)",
    "Contre plaqué 15mm",
    "Contre plaqué 15mm ",
    "Tasseau montants",
    "Tasseau montants ",
    "Plat fond",
    "Plat fond ",
    "Habillages bois Renault (mur)",
    "Feutrine",
    "Sol PVC",
    "Vernis polyrétane (1L)",
    "Glissières de tiroir 1m (120 kg)",
    "Matelas sur-mesure",
    "Rideaux côté",
    "Rideaux arrière",
    "Rideau",
    "Rail rideaux plafond 5m",
    "LED",
    "Batterie",
    "Panneau solaire 195W",
    "Glacière",
    "Galcière",
    "Robinet BOXIO",
    "Filet Rangement (lot de 5)",
    "100 vis à bois (12mm)",
]

raw_items = []
mat_total = 0
for i, r in enumerate(data['records']):
    f = r['fields']
    name = f.get('Name', f'Item {i}')
    qty = f.get('Notes', '1')
    price = f.get('Assignee', 0)

    name_clean = name.encode('utf-8', errors='replace').decode('utf-8')

    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', name_clean.strip())[:40]
    photos = f.get('Photo', [])
    ext = 'jpg'
    if photos:
        ext = photos[0].get('filename', 'img.jpg').split('.')[-1]

    img_path = f'{base_dir}/{safe_name}.{ext}'

    img_b64 = ''
    mime = 'image/jpeg'
    if ext == 'png':
        mime = 'image/png'
    elif ext == 'webp':
        mime = 'image/webp'

    if os.path.exists(img_path):
        with open(img_path, 'rb') as ff:
            img_b64 = base64.b64encode(ff.read()).decode('ascii')

    try:
        price_val = float(price)
    except:
        price_val = 0

    mat_total += price_val

    pro_title = title_map.get(name_clean.strip(), name_clean.strip())

    raw_items.append({
        'original_name': name_clean,
        'name': pro_title,
        'qty': qty,
        'price': price_val,
        'img_b64': img_b64,
        'mime': mime
    })

# Sort items by desired order
def sort_key(item):
    orig = item['original_name'].strip()
    for i, name in enumerate(desired_order):
        if orig == name:
            return i
    return 100  # unknown items at the end

items = sorted(raw_items, key=sort_key)

# Remove duplicates (same original_name stripped)
seen = set()
deduped = []
for item in items:
    key = item['original_name'].strip()
    if key not in seen:
        seen.add(key)
        deduped.append(item)
items = deduped

labor_total = 5500 - mat_total
grand_total = 5500
deposit = grand_total / 2

# Build rows
rows_parts = []
for idx, item in enumerate(items):
    img_html = ''
    if item['img_b64']:
        img_html = f'<img src="data:{item["mime"]};base64,{item["img_b64"]}" alt="" />'

    safe_n = item['name'].replace('<', '&lt;').replace('>', '&gt;')

    row = f'''<tr>
<td class="num">{idx+1}</td>
<td class="img-cell">{img_html}</td>
<td class="details"><strong>{safe_n}</strong></td>
<td class="qty">{item['qty']}</td>
<td class="price">{item['price']:.2f} \u20ac</td>
</tr>'''
    rows_parts.append(row)

rows_html = '\n'.join(rows_parts)

logo_img = ''
if logo_b64:
    logo_img = f'<img src="data:image/png;base64,{logo_b64}" alt="Vanzon Explorer" class="logo" />'

html = f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Devis VZN-2026-001 - Melodie Ait Herrou</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: 'Inter', sans-serif; background: white; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
.page {{ max-width: 860px; margin: 0 auto; background: white; padding: 50px; }}

.header {{ display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 30px; border-bottom: 1px solid #e5e5e5; }}
.logo {{ height: 40px; }}
.header-right {{ text-align: right; }}
.header-right .doc-type {{ font-size: 28px; font-weight: 700; color: #111; letter-spacing: -0.5px; }}
.header-right .meta {{ font-size: 12px; color: #888; margin-top: 6px; line-height: 1.8; }}

.info-section {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; padding: 30px 0; border-bottom: 1px solid #e5e5e5; }}
.info-block label {{ font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; font-weight: 600; display: block; margin-bottom: 8px; }}
.info-block p {{ font-size: 12.5px; line-height: 1.7; color: #333; }}
.info-block strong {{ color: #111; font-size: 13px; }}

.section-label {{ font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-top: 30px; margin-bottom: 12px; }}

table {{ width: 100%; border-collapse: collapse; }}
thead th {{ text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #aaa; padding: 8px 6px; border-bottom: 1px solid #e5e5e5; font-weight: 600; }}
thead th.right {{ text-align: right; }}
thead th.center {{ text-align: center; }}
tbody tr {{ border-bottom: 1px solid #f3f3f3; }}
tbody tr:last-child {{ border-bottom: 1px solid #e5e5e5; }}
td {{ padding: 10px 6px; vertical-align: middle; }}
td.num {{ font-size: 10px; color: #ccc; width: 24px; text-align: center; }}
td.img-cell {{ width: 50px; }}
td.img-cell img {{ width: 42px; height: 42px; object-fit: cover; border-radius: 4px; }}
td.details strong {{ font-size: 12.5px; font-weight: 500; color: #222; }}
td.qty {{ text-align: center; font-weight: 500; font-size: 12.5px; width: 40px; color: #555; }}
td.price {{ text-align: right; font-weight: 600; font-size: 12.5px; white-space: nowrap; width: 90px; color: #111; }}
.subtotal-row {{ background: #fafafa; }}
.subtotal-row td {{ font-weight: 600; font-size: 13px; padding: 12px 6px; }}

.estimation-note {{ font-size: 11px; color: #999; font-style: italic; margin-top: 8px; margin-bottom: 20px; }}

.labor-table td {{ padding: 12px 6px; }}

.totals-section {{ display: flex; justify-content: flex-end; margin-top: 20px; }}
.totals-box {{ width: 280px; }}
.totals-box .row {{ display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }}
.totals-box .row .lbl {{ color: #777; }}
.totals-box .row .amt {{ font-weight: 600; color: #111; }}
.totals-box .divider {{ border-top: 2px solid #111; margin-top: 6px; padding-top: 10px; }}
.totals-box .grand {{ font-size: 20px; font-weight: 700; }}
.totals-box .tva-note {{ font-size: 10px; color: #aaa; text-align: right; margin-top: 4px; }}

.conditions {{ margin-top: 35px; padding-top: 25px; border-top: 1px solid #e5e5e5; }}
.conditions h3 {{ font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 16px; }}
.conditions-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }}
.condition-item {{ font-size: 12px; line-height: 1.6; color: #555; padding: 10px 14px; background: #fafafa; border-radius: 6px; }}
.condition-item strong {{ color: #111; display: block; margin-bottom: 2px; }}

.signature-section {{ display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 35px; padding-top: 25px; border-top: 1px solid #e5e5e5; }}
.sig-box {{ border: 1px solid #e5e5e5; border-radius: 8px; padding: 18px; min-height: 110px; }}
.sig-box .sig-label {{ font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #aaa; font-weight: 600; margin-bottom: 5px; }}
.sig-box .sig-name {{ font-size: 12.5px; font-weight: 600; color: #111; }}
.sig-box .sig-mention {{ font-size: 10px; color: #bbb; margin-top: 45px; font-style: italic; }}

.footer {{ margin-top: 30px; padding-top: 18px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 9.5px; color: #bbb; line-height: 1.9; }}

@media print {{
  body {{ padding: 0; }}
  .page {{ padding: 40px; max-width: 100%; }}
}}
</style>
</head>
<body>
<div class="page">

<div class="header">
  <div class="header-left">
    {logo_img}
  </div>
  <div class="header-right">
    <div class="doc-type">Devis</div>
    <div class="meta">
      N\u00b0 VZN-2026-001<br>
      13 avril 2026<br>
      Valable 30 jours
    </div>
  </div>
</div>

<div class="info-section">
  <div class="info-block">
    <label>\u00c9metteur</label>
    <p>
      <strong>Vanzon Explorer SAS</strong><br>
      1 Ter Chemin Musdehalsuen Borda<br>
      64250 Cambo-les-Bains<br>
      SIRET 943 719 724 0001X<br>
      RCS Bayonne
    </p>
  </div>
  <div class="info-block">
    <label>Client</label>
    <p>
      <strong>M\u00e9lodie Ait Herrou</strong><br>
      235 Chemin Bide Zaharra<br>
      64240 Hasparren<br>
      melodieaitherrou6@gmail.com<br>
      06 99 30 75 91
    </p>
  </div>
  <div class="info-block">
    <label>Objet</label>
    <p>
      <strong>Am\u00e9nagement complet</strong><br>
      Renault Trafic L1H1<br>
      Mat\u00e9riel + main-d\u2019\u0153uvre<br>
      Dur\u00e9e : 6 semaines
    </p>
  </div>
</div>

<div class="section-label">Mat\u00e9riel &amp; fournitures</div>
<div class="estimation-note">* Le mat\u00e9riel list\u00e9 ci-dessous est une estimation. Les r\u00e9f\u00e9rences exactes peuvent varier selon la disponibilit\u00e9.</div>

<table>
<thead><tr><th class="center">#</th><th></th><th>D\u00e9signation</th><th class="center">Qt\u00e9</th><th class="right">Prix</th></tr></thead>
<tbody>
{rows_html}
<tr class="subtotal-row"><td colspan="4" style="text-align:right;padding-right:16px;">Sous-total mat\u00e9riel</td><td class="price">{mat_total:.2f} \u20ac</td></tr>
</tbody>
</table>

<div class="section-label" style="margin-top:25px;">Main-d\u2019\u0153uvre</div>

<table class="labor-table">
<tbody>
<tr>
<td class="num"></td>
<td class="img-cell"></td>
<td class="details"><strong>Am\u00e9nagement complet : conception, isolation, habillage, \u00e9lectricit\u00e9 12V, solaire, menuiserie, finitions</strong></td>
<td class="qty">1</td>
<td class="price">{labor_total:.2f} \u20ac</td>
</tr>
</tbody>
</table>

<div class="totals-section">
  <div class="totals-box">
    <div class="row"><span class="lbl">Mat\u00e9riel</span><span class="amt">{mat_total:.2f} \u20ac</span></div>
    <div class="row"><span class="lbl">Main-d\u2019\u0153uvre</span><span class="amt">{labor_total:.2f} \u20ac</span></div>
    <div class="divider">
      <div class="row grand"><span class="lbl">Total</span><span class="amt">5 500,00 \u20ac</span></div>
    </div>
    <div class="tva-note">TVA non applicable \u2014 Art. 293 B du CGI</div>
  </div>
</div>

<div class="conditions">
  <h3>Conditions</h3>
  <div class="conditions-grid">
    <div class="condition-item"><strong>Acompte 50 %</strong>{deposit:,.2f} \u20ac \u00e0 r\u00e9gler \u00e0 la signature du devis.</div>
    <div class="condition-item"><strong>Solde \u00e0 la livraison</strong>{deposit:,.2f} \u20ac restants \u00e0 la remise du v\u00e9hicule.</div>
    <div class="condition-item"><strong>D\u00e9lai</strong>6 semaines \u00e0 compter de la r\u00e9ception de l\u2019acompte et du v\u00e9hicule.</div>
    <div class="condition-item"><strong>Validit\u00e9</strong>Ce devis est valable 30 jours \u00e0 compter de son \u00e9mission.</div>
  </div>
</div>

<div class="signature-section">
  <div class="sig-box">
    <div class="sig-label">Le prestataire</div>
    <div class="sig-name">Jules Gaveglio \u2014 Vanzon Explorer</div>
    <div class="sig-mention">Date et signature</div>
  </div>
  <div class="sig-box">
    <div class="sig-label">Le client</div>
    <div class="sig-name">M\u00e9lodie Ait Herrou</div>
    <div class="sig-mention">\u00ab Bon pour accord \u00bb, date et signature</div>
  </div>
</div>

<div class="footer">
  Vanzon Explorer SAS \u2014 Capital 100,00 \u20ac \u2014 SIRET 943 719 724 0001X \u2014 RCS Bayonne<br>
  1 Ter Chemin Musdehalsuen Borda, 64250 Cambo-les-Bains \u2014 jules@vanzonexplorer.com \u2014 vanzonexplorer.com
</div>

</div>
</body>
</html>'''

out_path = os.path.dirname(os.path.abspath(__file__)) + '/devis-melodie.html'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(html)

print(f'OK: {out_path}')
print(f'  {len(items)} articles')
print(f'  Materiel: {mat_total:.2f} EUR')
print(f'  Main-d oeuvre: {labor_total:.2f} EUR')
print(f'  TOTAL: 5500.00 EUR')
