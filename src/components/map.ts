import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity } from '../types/strava.ts';
import { decodePolyline } from '../utils/polyline.ts';
import { formatDistance, formatPace, formatTimeShort, formatDate } from '../utils/metrics.ts';

let mapInstance: L.Map | null = null;
let currentLayerGroup: L.LayerGroup | null = null;

let atlasMapInstance: L.Map | null = null;
let atlasLayerGroup: L.LayerGroup | null = null;

export function initMap(elementId: string = 'leaflet-map'): L.Map | null {
  const container = document.getElementById(elementId);
  if (!container) return null;

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  // Initialisation de la carte avec zoom et contrôles minimaux
  mapInstance = L.map(elementId, {
    zoomControl: true,
    attributionControl: false
  }).setView([48.8566, 2.3522], 12);

  // Fond de carte ultra-épuré (Base seule : zéro bâtiment, zéro restaurant/commerce, zéro texte de route)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    attribution: '&copy; Esri World Light Gray Base'
  }).addTo(mapInstance);

  currentLayerGroup = L.layerGroup().addTo(mapInstance);

  return mapInstance;
}

export function invalidateMapSize(): void {
  if (mapInstance) {
    mapInstance.invalidateSize();
  }
  if (atlasMapInstance) {
    atlasMapInstance.invalidateSize();
  }
}

export function renderActivityTraces(activities: Activity[], highlightActivityId?: number) {
  if (!mapInstance || !currentLayerGroup || !activities || activities.length === 0) return;

  currentLayerGroup.clearLayers();

  const targetActivity = highlightActivityId
    ? activities.find(a => a.id === highlightActivityId) || activities[0]
    : activities[0];

  let targetBounds: L.LatLngBounds | null = null;

  // 1. Dessiner l'ensemble de tous les tracés de course depuis le début (Heatmap personnelle épurée)
  activities.forEach(activity => {
    if (activity.id !== targetActivity?.id && activity.map?.summary_polyline) {
      const coords = decodePolyline(activity.map.summary_polyline);
      if (coords.length > 0) {
        const polyline = L.polyline(coords, {
          color: '#717885',
          weight: 2.2,
          opacity: 0.45,
          lineJoin: 'round'
        });

        polyline.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 170px; padding: 2px;">
            <strong style="font-size: 0.88rem; color: #1C1E21; display: block; margin-bottom: 2px;">${activity.name}</strong>
            <div style="font-size: 0.75rem; color: #5C626C; margin-bottom: 4px;">${formatDate(activity.start_date_local)}</div>
            <div style="font-size: 0.8rem; font-weight: 700; color: #E05A36;">
              ${formatDistance(activity.distance)} • ${formatTimeShort(activity.moving_time)} • ${formatPace(activity.average_speed)}
            </div>
          </div>
        `);

        polyline.addTo(currentLayerGroup!);
      }
    }
  });

  // 2. Dessiner la séance sélectionnée (en Terracotta vibrant au premier plan)
  if (targetActivity && targetActivity.map?.summary_polyline) {
    const coords = decodePolyline(targetActivity.map.summary_polyline);
    if (coords.length > 0) {
      const mainPolyline = L.polyline(coords, {
        color: '#E05A36',
        weight: 5,
        opacity: 1,
        lineJoin: 'round'
      });

      mainPolyline.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 190px; padding: 4px;">
          <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: #E05A36; margin-bottom: 2px;">Selected run</div>
          <strong style="font-size: 0.92rem; color: #1C1E21; display: block; margin-bottom: 4px;">${targetActivity.name}</strong>
          <div style="font-size: 0.78rem; color: #5C626C; margin-bottom: 6px;">${formatDate(targetActivity.start_date_local)}</div>
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; border-top: 1px solid #ECE6DC; padding-top: 6px;">
            <span><strong>${formatDistance(targetActivity.distance)}</strong></span>
            <span><strong>${formatTimeShort(targetActivity.moving_time)}</strong></span>
            <span><strong>${formatPace(targetActivity.average_speed)}</strong></span>
          </div>
        </div>
      `);

      mainPolyline.addTo(currentLayerGroup!);
      targetBounds = mainPolyline.getBounds();

      // Marqueur de départ (vert forêt)
      const startPt = coords[0];
      L.circleMarker(startPt, {
        radius: 7,
        color: '#FFFFFF',
        weight: 2.5,
        fillColor: '#2E6B56',
        fillOpacity: 1
      }).bindTooltip("Start", { permanent: false }).addTo(currentLayerGroup!);

      // Marqueur d'arrivée (terracotta)
      const endPt = coords[coords.length - 1];
      L.circleMarker(endPt, {
        radius: 7,
        color: '#FFFFFF',
        weight: 2.5,
        fillColor: '#E05A36',
        fillOpacity: 1
      }).bindTooltip("Finish", { permanent: false }).addTo(currentLayerGroup!);
    }
  }

  // 3. Cadrage épuré centré sur la zone de course
  if (targetBounds && targetBounds.isValid()) {
    mapInstance.fitBounds(targetBounds.pad(0.25), {
      padding: [25, 25],
      maxZoom: 14
    });
  }
}

/**
 * Initialise la carte Atlas GPS sur la Page 5
 */
export function initPageAtlasMap(elementId: string = 'page-heatmap-container', activities: Activity[] = []): void {
  const container = document.getElementById(elementId);
  if (!container) return;

  if (!atlasMapInstance) {
    atlasMapInstance = L.map(elementId, {
      zoomControl: true,
      attributionControl: false
    }).setView([48.8566, 2.3522], 12);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 17,
      attribution: '&copy; Esri World Light Gray Base'
    }).addTo(atlasMapInstance);

    atlasLayerGroup = L.layerGroup().addTo(atlasMapInstance);
  } else {
    atlasMapInstance.invalidateSize();
  }

  if (atlasLayerGroup && activities.length > 0) {
    atlasLayerGroup.clearLayers();
    const polylines: L.Polyline[] = [];

    activities.forEach(act => {
      if (act.map?.summary_polyline) {
        const coords = decodePolyline(act.map.summary_polyline);
        if (coords.length > 0) {
          const polyline = L.polyline(coords, {
            color: '#E05A36',
            weight: 3.2,
            opacity: 0.65,
            lineJoin: 'round'
          });

          polyline.bindPopup(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 170px; padding: 2px;">
              <strong style="font-size: 0.9rem; color: #1C1E21; display: block; margin-bottom: 2px;">${act.name}</strong>
              <div style="font-size: 0.76rem; color: #5C626C; margin-bottom: 4px;">${formatDate(act.start_date_local)}</div>
              <div style="font-size: 0.82rem; font-weight: 700; color: #E05A36;">
                ${formatDistance(act.distance)} • ${formatTimeShort(act.moving_time)} • ${formatPace(act.average_speed)}
              </div>
            </div>
          `);

          polyline.addTo(atlasLayerGroup!);
          polylines.push(polyline);
        }
      }
    });

    if (polylines.length > 0) {
      const group = L.featureGroup(polylines);
      atlasMapInstance.fitBounds(group.getBounds().pad(0.08));
    }
  }
}

let fullscreenMapInstance: L.Map | null = null;
let fullscreenLayerGroup: L.LayerGroup | null = null;

export function openFullscreenHeatmap(activities: Activity[]) {
  const modal = document.getElementById('heatmap-modal');
  if (!modal) return;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    if (!fullscreenMapInstance) {
      fullscreenMapInstance = L.map('fullscreen-heatmap-container', {
        zoomControl: true,
        attributionControl: false
      }).setView([48.8566, 2.3522], 12);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 17,
        attribution: '&copy; Esri World Light Gray Base'
      }).addTo(fullscreenMapInstance);

      fullscreenLayerGroup = L.layerGroup().addTo(fullscreenMapInstance);
    } else {
      fullscreenMapInstance.invalidateSize();
    }

    if (fullscreenLayerGroup) {
      fullscreenLayerGroup.clearLayers();
      const polylines: L.Polyline[] = [];

      activities.forEach(act => {
        if (act.map?.summary_polyline) {
          const coords = decodePolyline(act.map.summary_polyline);
          if (coords.length > 0) {
            const polyline = L.polyline(coords, {
              color: '#E05A36',
              weight: 3.2,
              opacity: 0.65,
              lineJoin: 'round'
            });

            polyline.bindPopup(`
              <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 170px; padding: 2px;">
                <strong style="font-size: 0.9rem; color: #1C1E21; display: block; margin-bottom: 2px;">${act.name}</strong>
                <div style="font-size: 0.76rem; color: #5C626C; margin-bottom: 4px;">${formatDate(act.start_date_local)}</div>
                <div style="font-size: 0.82rem; font-weight: 700; color: #E05A36;">
                  ${formatDistance(act.distance)} • ${formatTimeShort(act.moving_time)} • ${formatPace(act.average_speed)}
                </div>
              </div>
            `);

            polyline.addTo(fullscreenLayerGroup!);
            polylines.push(polyline);
          }
        }
      });

      if (polylines.length > 0) {
        const group = L.featureGroup(polylines);
        fullscreenMapInstance.fitBounds(group.getBounds().pad(0.08));
      }
    }
  }, 100);
}

export function closeFullscreenHeatmap() {
  const modal = document.getElementById('heatmap-modal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}
