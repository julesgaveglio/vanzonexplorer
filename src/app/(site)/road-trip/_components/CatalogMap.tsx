"use client";
import { useEffect, useRef } from "react";
import type maplibregl from "maplibre-gl";
import { REGION_CENTROIDS } from "./regionData";

interface Article {
  id: string;
  title: string;
  regionSlug: string;
  articleSlug: string;
  regionName?: string;
  duree?: number;
  style?: string;
}

interface CatalogMapProps {
  articles: Article[];
  flyTo?: { coords: [number, number]; zoom: number } | null;
}

export default function CatalogMap({ articles, flyTo }: CatalogMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

    import("maplibre-gl").then((ml) => {
      const map = new ml.Map({
        container: mapContainer.current!,
        style: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`,
        center: [2.3, 46.5],
        zoom: 5,
        minZoom: 4.5,
        maxBounds: [[-7, 40.5], [11, 52]],
        attributionControl: false,
      });

      map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new ml.AttributionControl({ compact: true }), "bottom-right");

      mapRef.current = map;

      map.on("load", () => {
        // Groupe les articles par région
        const byRegion: Record<string, Article[]> = {};
        for (const a of articles) {
          if (!byRegion[a.regionSlug]) byRegion[a.regionSlug] = [];
          byRegion[a.regionSlug].push(a);
        }

        // Ajouter un marqueur par région avec des articles
        for (const [regionSlug, regionArticles] of Object.entries(byRegion)) {
          const coords = REGION_CENTROIDS[regionSlug];
          if (!coords) continue;

          const count = regionArticles.length;
          const regionName = regionArticles[0]?.regionName || regionSlug;

          // Marqueur HTML personnalisé
          const el = document.createElement("div");
          el.className = "catalog-marker";
          el.style.cssText = `
            width: ${count > 1 ? "40px" : "36px"};
            height: ${count > 1 ? "40px" : "36px"};
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            font-weight: 700;
            font-size: ${count > 1 ? "14px" : "12px"};
            color: white;
            font-family: system-ui, sans-serif;
            transition: transform 0.15s;
          `;
          el.textContent = count > 1 ? String(count) : "1";
          el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.15)"; });
          el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });

          // Popup
          const listItems = regionArticles
            .map(a => `<a href="/road-trip/${a.regionSlug}/${a.articleSlug}" style="display:block;padding:6px 0;border-bottom:1px solid #f1f5f9;color:#1e40af;text-decoration:none;font-size:12px;font-weight:500;line-height:1.4;" onmouseover="this.style.color='#1d4ed8'" onmouseout="this.style.color='#1e40af'">
              ${a.title}${a.duree ? ` <span style="color:#64748b;font-weight:400;">(${a.duree}j)</span>` : ""}
            </a>`)
            .join("");

          const popup = new ml.Popup({
            offset: 22,
            closeButton: true,
            maxWidth: "260px",
          }).setHTML(`
            <div style="font-family:system-ui,sans-serif;padding:4px 0;">
              <p style="font-weight:700;font-size:13px;color:#0f172a;margin:0 0 8px 0;">${regionName}</p>
              ${listItems}
            </div>
          `);

          new ml.Marker({ element: el })
            .setLngLat(coords)
            .setPopup(popup)
            .addTo(map);
        }
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [articles]);

  // Fly to selected location when search changes
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    const map = mapRef.current;
    const doFly = () =>
      map.flyTo({ center: flyTo.coords, zoom: flyTo.zoom, duration: 1200 });
    if (map.loaded()) {
      doFly();
    } else {
      map.once("load", doFly);
    }
  }, [flyTo]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-md border border-slate-200">
      <div ref={mapContainer} style={{ width: "100%", height: "420px" }} />
      {articles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 rounded-2xl">
          <p className="text-slate-400 text-sm">Aucun itinéraire publié pour l&apos;instant</p>
        </div>
      )}
    </div>
  );
}
