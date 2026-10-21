"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { categoryOf } from "@/lib/categories";
import type { Plan } from "@/lib/types";
import { formatWhen } from "./PlanCard";

interface Props {
  plans: Plan[];
  activeId: number | null;
  onActive: (id: number | null) => void;
  me: { lat: number; lng: number } | null;
}

/**
 * Map of the feed. Positions are whatever the server returned, so strangers only ever get the ~1 km rounded
 * point and the area label here, never the exact spot.
 */
export default function PlansMap({ plans, activeId, onActive, me }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const meLayerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef(new Map<number, Marker>());
  const lastFitRef = useRef("");
  const fitRef = useRef<(() => void) | null>(null);
  const plansRef = useRef(plans);
  const meRef = useRef(me);
  const onActiveRef = useRef(onActive);
  const routerRef = useRef(router);
  const [ready, setReady] = useState(false);

  // Hover handlers and the latest plans are read from refs so changing them never rebuilds the map.
  useEffect(() => {
    plansRef.current = plans;
    meRef.current = me;
    onActiveRef.current = onActive;
    routerRef.current = router;
  });

  const planKey = plans.map((p) => `${p.id}:${p.lat}:${p.lng}`).join("|");

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    const markers = markersRef.current;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      // Start on something real (you, else the first plan); the pins effect then fits all plans in view.
      const first = plansRef.current[0];
      const start: [number, number] | null = meRef.current
        ? [meRef.current.lat, meRef.current.lng]
        : first
          ? [first.lat, first.lng]
          : null;
      const map = L.map(containerRef.current, { zoomControl: false }).setView(start ?? [20, 0], start ? 12 : 2);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      meLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      // The map sits in a box that changes size (mobile List/Map toggle, window resize). If it was hidden when the
      // plans arrived, the first fit was computed against a 0-size box, so refit the moment it becomes visible.
      const el = containerRef.current;
      let lastWidth = el.clientWidth;
      observer = new ResizeObserver(() => {
        map.invalidateSize();
        if (lastWidth === 0 && el.clientWidth > 0) fitRef.current?.();
        lastWidth = el.clientWidth;
      });
      observer.observe(el);
      setReady(true);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      markers.clear();
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      meLayerRef.current = null;
      setReady(false);
    };
  }, []);

  // Rebuild pins when the set of plans (or their positions) changes.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !map || !layer) return;

    import("leaflet").then((L) => {
      layer.clearLayers();
      markersRef.current.clear();
      const points: [number, number][] = [];

      for (const plan of plansRef.current) {
        const cat = categoryOf(plan.category);
        const marker = L.marker([plan.lat, plan.lng], {
          icon: L.divIcon({
            className: "pin-wrap",
            html: `<div class="pin" style="--c:${cat.color}"><span>${cat.emoji}</span></div>`,
            iconSize: [38, 38],
            iconAnchor: [19, 40],
            popupAnchor: [0, -38],
          }),
          riseOnHover: true,
        });
        marker.on("mouseover", () => onActiveRef.current(plan.id));
        marker.on("mouseout", () => onActiveRef.current(null));
        marker.bindPopup(buildPopup(plan, (href) => routerRef.current.push(href)), { closeButton: false });
        marker.addTo(layer);
        markersRef.current.set(plan.id, marker);
        points.push([plan.lat, plan.lng]);
      }

      const fit = () => {
        if (points.length > 0) {
          const bounds = L.latLngBounds(points);
          if (me) bounds.extend([me.lat, me.lng]);
          map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
        } else if (me) {
          map.setView([me.lat, me.lng], 12);
        }
      };
      fitRef.current = fit;

      // Re-fit only when the set of plans actually changed, not on every re-render.
      if (lastFitRef.current !== planKey) {
        lastFitRef.current = planKey;
        fit();
      }
    });
    // `me` is only used for the initial fit; planKey captures every change that should rebuild pins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, planKey]);

  // "You are here" dot.
  useEffect(() => {
    const layer = meLayerRef.current;
    if (!ready || !layer) return;
    import("leaflet").then((L) => {
      layer.clearLayers();
      if (me) {
        L.circleMarker([me.lat, me.lng], {
          radius: 8,
          color: "#fff",
          weight: 3,
          fillColor: "#2563eb",
          fillOpacity: 1,
        }).addTo(layer);
      }
    });
  }, [ready, me]);

  // Highlight the pin that matches the hovered card (and the other way round, via onActive).
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    // Pins are created asynchronously after planKey changes, so wait a tick before touching them.
    const id = window.setTimeout(() => {
      markersRef.current.forEach((marker, planId) => {
        const on = planId === activeId;
        marker.getElement()?.querySelector(".pin")?.classList.toggle("pin-active", on);
        marker.setZIndexOffset(on ? 1000 : 0);
      });
      const active = activeId == null ? undefined : markersRef.current.get(activeId);
      if (active && !map.getBounds().contains(active.getLatLng())) {
        map.panTo(active.getLatLng());
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [ready, activeId, planKey]);

  return <div ref={containerRef} className="h-full w-full" />;
}

/** Built with DOM APIs, not an HTML string, because titles and area names are user-written. */
function buildPopup(plan: Plan, go: (href: string) => void) {
  const cat = categoryOf(plan.category);
  const wrap = document.createElement("div");
  wrap.className = "plan-popup";

  const title = document.createElement("strong");
  title.textContent = `${cat.emoji} ${plan.title}`;
  const when = document.createElement("div");
  when.textContent = formatWhen(plan.startsAt);
  const where = document.createElement("div");
  where.textContent = `📍 ${plan.placeName}${plan.locationExact ? "" : " (approx.)"}`;
  const spots = document.createElement("div");
  spots.textContent = plan.spotsLeft === 0 ? "Full" : `${plan.spotsLeft} of ${plan.capacity} spots left`;

  const link = document.createElement("a");
  const href = `/plans/${plan.id}`;
  link.href = href;
  link.textContent = "View plan →";
  link.addEventListener("click", (e) => {
    e.preventDefault();
    go(href);
  });

  wrap.append(title, when, where, spots, link);
  return wrap;
}
