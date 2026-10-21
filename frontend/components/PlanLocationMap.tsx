"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { categoryOf } from "@/lib/categories";
import type { Category } from "@/lib/types";

interface Props {
  lat: number;
  lng: number;
  /** Exact spots get a pin; approximate ones get a circle so the map never implies more precision than it has. */
  exact: boolean;
  category: Category;
}

/** Small, non-interactive map for the plan page. */
export default function PlanLocationMap({ lat, lng, exact, category }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      const cat = categoryOf(category);
      map = L.map(containerRef.current, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: false,
      }).setView([lat, lng], exact ? 16 : 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      L.control.attribution({ position: "bottomright", prefix: false }).addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      ).addTo(map);

      if (exact) {
        L.marker([lat, lng], {
          icon: L.divIcon({
            className: "pin-wrap",
            html: `<div class="pin" style="--c:${cat.color}"><span>${cat.emoji}</span></div>`,
            iconSize: [38, 38],
            iconAnchor: [19, 40],
          }),
        }).addTo(map);
      } else {
        L.circle([lat, lng], {
          radius: 900,
          color: cat.color,
          weight: 2,
          fillColor: cat.color,
          fillOpacity: 0.2,
        }).addTo(map);
      }
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, exact, category]);

  return <div ref={containerRef} className="h-48 w-full" />;
}
