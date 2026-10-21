"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

// Bengaluru, as a reasonable default center before the user has picked anything.
const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];

interface Props {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
}

/** Click-to-pick location on an OpenStreetMap tile map. No geocoding API involved — just map tiles. */
export default function LocationPicker({ lat, lng, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      // Leaflet's default marker icon references relative image paths that break under bundlers.
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const start: [number, number] = lat != null && lng != null ? [lat, lng] : DEFAULT_CENTER;
      const map = L.map(containerRef.current).setView(start, lat != null && lng != null ? 15 : 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      if (lat != null && lng != null) {
        markerRef.current = L.marker(start).addTo(map);
      }

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else {
          markerRef.current = L.marker([clickLat, clickLng]).addTo(map);
        }
        onPickRef.current(Number(clickLat.toFixed(5)), Number(clickLng.toFixed(5)));
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Only ever set up once; external lat/lng changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker and view in sync when lat/lng change from outside (e.g. the "Use mine" button).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || lat == null || lng == null) return;
    import("leaflet").then((L) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }
      map.setView([lat, lng], Math.max(map.getZoom(), 15));
    });
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="h-56 w-full overflow-hidden rounded-xl border border-black/15 dark:border-white/20"
    />
  );
}
