"""
Google Search Console — Export complet des données
Usage: python scripts/gsc_export.py
"""

import json
import pandas as pd
from datetime import datetime, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build

# ─── CONFIG ────────────────────────────────────────────────────────────────────
SERVICE_ACCOUNT_FILE = "gsc_credentials.json"  # ton fichier JSON ici
SITE_URL = "https://vanzon.fr/"                # ou "sc-domain:vanzon.fr"
DATE_START = (datetime.today() - timedelta(days=480)).strftime("%Y-%m-%d")
DATE_END = datetime.today().strftime("%Y-%m-%d")
ROW_LIMIT = 25000
# ───────────────────────────────────────────────────────────────────────────────

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]


def build_service():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build("searchconsole", "v1", credentials=creds)


def fetch_performance(service, dimensions):
    """Récupère les données de performance pour des dimensions données."""
    rows = []
    start_row = 0

    while True:
        body = {
            "startDate": DATE_START,
            "endDate": DATE_END,
            "dimensions": dimensions,
            "rowLimit": ROW_LIMIT,
            "startRow": start_row,
        }
        response = (
            service.searchanalytics()
            .query(siteUrl=SITE_URL, body=body)
            .execute()
        )
        batch = response.get("rows", [])
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < ROW_LIMIT:
            break
        start_row += ROW_LIMIT

    records = []
    for row in rows:
        record = {dim: row["keys"][i] for i, dim in enumerate(dimensions)}
        record["clics"] = row["clicks"]
        record["impressions"] = row["impressions"]
        record["ctr"] = round(row["ctr"] * 100, 2)
        record["position"] = round(row["position"], 1)
        records.append(record)

    return pd.DataFrame(records)


def fetch_sitemaps(service):
    response = service.sitemaps().list(siteUrl=SITE_URL).execute()
    sitemaps = response.get("sitemap", [])
    records = []
    for s in sitemaps:
        records.append({
            "path": s.get("path"),
            "lastSubmitted": s.get("lastSubmitted"),
            "lastDownloaded": s.get("lastDownloaded"),
            "isPending": s.get("isPending"),
            "isSitemapsIndex": s.get("isSitemapsIndex"),
            "warnings": s.get("warnings", 0),
            "errors": s.get("errors", 0),
        })
    return pd.DataFrame(records)


def main():
    print("🔌 Connexion à Google Search Console...")
    service = build_service()

    output = {}

    # 1. Requêtes
    print("📊 Récupération des requêtes...")
    df_queries = fetch_performance(service, ["query"])
    df_queries = df_queries.sort_values("impressions", ascending=False)
    output["requetes"] = df_queries
    print(f"   → {len(df_queries)} requêtes trouvées")

    # 2. Pages
    print("📄 Récupération des pages...")
    df_pages = fetch_performance(service, ["page"])
    df_pages = df_pages.sort_values("clics", ascending=False)
    output["pages"] = df_pages
    print(f"   → {len(df_pages)} pages trouvées")

    # 3. Requêtes + Pages (top 5000)
    print("🔗 Récupération requêtes × pages...")
    df_combined = fetch_performance(service, ["query", "page"])
    df_combined = df_combined.sort_values("clics", ascending=False).head(5000)
    output["requetes_par_page"] = df_combined
    print(f"   → {len(df_combined)} combinaisons trouvées")

    # 4. Pays
    print("🌍 Récupération par pays...")
    df_countries = fetch_performance(service, ["country"])
    df_countries = df_countries.sort_values("clics", ascending=False)
    output["pays"] = df_countries

    # 5. Devices
    print("📱 Récupération par appareil...")
    df_devices = fetch_performance(service, ["device"])
    output["appareils"] = df_devices

    # 6. Évolution temporelle
    print("📈 Récupération évolution dans le temps...")
    df_dates = fetch_performance(service, ["date"])
    df_dates = df_dates.sort_values("date")
    output["evolution"] = df_dates

    # 7. Sitemaps
    print("🗺️  Récupération sitemaps...")
    try:
        df_sitemaps = fetch_sitemaps(service)
        output["sitemaps"] = df_sitemaps
    except Exception as e:
        print(f"   ⚠️  Sitemaps non disponibles: {e}")

    # Export Excel (un onglet par type de données)
    filename = f"gsc_export_{datetime.today().strftime('%Y%m%d')}.xlsx"
    print(f"\n💾 Export vers {filename}...")
    with pd.ExcelWriter(filename, engine="openpyxl") as writer:
        for sheet_name, df in output.items():
            if not df.empty:
                df.to_excel(writer, sheet_name=sheet_name, index=False)

    print(f"✅ Export terminé : {filename}")
    print("\n📋 Résumé :")
    for name, df in output.items():
        print(f"   - {name}: {len(df)} lignes")


if __name__ == "__main__":
    main()
