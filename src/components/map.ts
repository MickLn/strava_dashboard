import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity } from '../types/strava.ts';
import { decodePolyline } from '../utils/polyline.ts';
import { formatDistance, formatPace, formatTimeShort, formatDate } from '../utils/metrics.ts';
import { i18n } from '../utils/i18n.ts';

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

// Référence de l'activité cible active
let lastFeaturedTargetBounds: L.LatLngBounds | null = null;
let lastFullscreenTargetBounds: L.LatLngBounds | null = null;
let lastAtlasAllBounds: L.LatLngBounds | null = null;
let lastAtlasLatestBounds: L.LatLngBounds | null = null;

export function recenterFeaturedMap(activities: Activity[], highlightActivityId?: number): void {
  if (!mapInstance || !activities || activities.length === 0) return;

  if (lastFeaturedTargetBounds && lastFeaturedTargetBounds.isValid()) {
    mapInstance.flyToBounds(lastFeaturedTargetBounds.pad(0.25), {
      padding: [30, 30],
      maxZoom: 14,
      duration: 0.8
    });
    return;
  }

  const sortedByDate = [...activities].sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime());
  const targetActivity = highlightActivityId
    ? activities.find(a => a.id === highlightActivityId) || sortedByDate[0]
    : sortedByDate[0];

  if (targetActivity?.map?.summary_polyline) {
    const coords = decodePolyline(targetActivity.map.summary_polyline);
    if (coords.length > 0) {
      const poly = L.polyline(coords);
      lastFeaturedTargetBounds = poly.getBounds();
      mapInstance.flyToBounds(lastFeaturedTargetBounds.pad(0.25), {
        padding: [30, 30],
        maxZoom: 14,
        duration: 0.8
      });
    }
  }
}

export function renderActivityTraces(activities: Activity[], highlightActivityId?: number) {
  if (!mapInstance || !currentLayerGroup || !activities || activities.length === 0) return;

  currentLayerGroup.clearLayers();

  const sortedByDate = [...activities].sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime());
  const targetActivity = highlightActivityId
    ? activities.find(a => a.id === highlightActivityId) || sortedByDate[0]
    : sortedByDate[0];

  let targetBounds: L.LatLngBounds | null = null;

  // 1. Dessiner l'ensemble de tous les tracés en gris épuré translucide en arrière-plan
  activities.forEach(activity => {
    if (activity.id !== targetActivity?.id && activity.map?.summary_polyline) {
      const coords = decodePolyline(activity.map.summary_polyline);
      if (coords.length > 0) {
        const polyline = L.polyline(coords, {
          color: '#717885',
          weight: 2.2,
          opacity: 0.40,
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

  // 2. Dessiner la séance sélectionnée au premier plan en Terracotta vibrant
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
      lastFeaturedTargetBounds = targetBounds;

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

  // Mise à jour de la pilule du total de courses sur la carte (ex: 282 courses)
  const cardMapCountEl = document.getElementById('lbl-card-map-count');
  if (cardMapCountEl) {
    const bgCount = activities.length > 1 ? activities.length - 1 : activities.length;
    cardMapCountEl.textContent = `${bgCount} courses`;
  }
}

/**
 * Initialise la carte Atlas GPS sur la Page 5 (Mode Immersif Plein Écran)
 */
export function renderAtlasAllTracks(activities: Activity[]): void {
  if (!atlasMapInstance || !atlasLayerGroup || !activities || activities.length === 0) return;

  atlasLayerGroup.clearLayers();
  const polylines: L.Polyline[] = [];

  // Par défaut et au clic sur "Tous les tracés" : TOUTES les courses sont en Terracotta Orange
  activities.forEach(act => {
    if (act.map?.summary_polyline) {
      const coords = decodePolyline(act.map.summary_polyline);
      if (coords.length > 0) {
        const polyline = L.polyline(coords, {
          color: '#E05A36',
          weight: 2.6,
          opacity: 0.65,
          lineJoin: 'round'
        });

        polyline.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 175px; padding: 2px;">
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
    lastAtlasAllBounds = group.getBounds();
    if (lastAtlasAllBounds.isValid()) {
      atlasMapInstance.flyToBounds(lastAtlasAllBounds.pad(0.08), { duration: 0.8 });
    }
  }

  const atlasCountPill = document.getElementById('lbl-atlas-count-pill');
  if (atlasCountPill) {
    atlasCountPill.textContent = i18n.t().runsCountBadge(activities.length);
  }
}

export function renderAtlasLatestTrack(activities: Activity[]): void {
  if (!atlasMapInstance || !atlasLayerGroup || !activities || activities.length === 0) return;

  atlasLayerGroup.clearLayers();

  const sortedByDate = [...activities].sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime());
  const latest = sortedByDate[0];

  // 1. Dessiner d'abord tous les autres tracés en gris
  activities.forEach(act => {
    if (act.id !== latest?.id && act.map?.summary_polyline) {
      const coords = decodePolyline(act.map.summary_polyline);
      if (coords.length > 0) {
        const polyline = L.polyline(coords, {
          color: '#717885',
          weight: 2.2,
          opacity: 0.35,
          lineJoin: 'round'
        });

        polyline.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 175px; padding: 2px;">
            <strong style="font-size: 0.9rem; color: #1C1E21; display: block; margin-bottom: 2px;">${act.name}</strong>
            <div style="font-size: 0.76rem; color: #5C626C; margin-bottom: 4px;">${formatDate(act.start_date_local)}</div>
            <div style="font-size: 0.82rem; font-weight: 700; color: #E05A36;">
              ${formatDistance(act.distance)} • ${formatTimeShort(act.moving_time)} • ${formatPace(act.average_speed)}
            </div>
          </div>
        `);

        polyline.addTo(atlasLayerGroup!);
      }
    }
  });

  // 2. Dessiner la dernière course en DERNIER au premier plan (z-index maximal) en Terracotta vibrant
  if (latest && latest.map?.summary_polyline) {
    const coords = decodePolyline(latest.map.summary_polyline);
    if (coords.length > 0) {
      const mainPolyline = L.polyline(coords, {
        color: '#E05A36',
        weight: 5.5,
        opacity: 1,
        lineJoin: 'round'
      });

      mainPolyline.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 190px; padding: 4px;">
          <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: #E05A36; margin-bottom: 2px;">Dernière course</div>
          <strong style="font-size: 0.95rem; color: #1C1E21; display: block; margin-bottom: 4px;">${latest.name}</strong>
          <div style="font-size: 0.78rem; color: #5C626C; margin-bottom: 6px;">${formatDate(latest.start_date_local)}</div>
          <div style="display: flex; justify-content: space-between; font-size: 0.84rem; border-top: 1px solid #ECE6DC; padding-top: 6px;">
            <span><strong>${formatDistance(latest.distance)}</strong></span>
            <span><strong>${formatTimeShort(latest.moving_time)}</strong></span>
            <span><strong>${formatPace(latest.average_speed)}</strong></span>
          </div>
        </div>
      `);

      mainPolyline.addTo(atlasLayerGroup!);
      mainPolyline.bringToFront();

      // Marqueurs Départ et Arrivée en SVG circleMarker (garantit un verrouillage absolu aux coordonnées GPS sans dérive)
      const startPt = coords[0];
      const endPt = coords[coords.length - 1];

      let pinsAdded = false;
      const addPins = () => {
        if (pinsAdded || !atlasLayerGroup) return;
        pinsAdded = true;

        L.circleMarker(startPt, {
          radius: 7,
          color: '#FFFFFF',
          weight: 2.5,
          fillColor: '#2E6B56',
          fillOpacity: 1
        }).bindTooltip("Start", { permanent: false }).addTo(atlasLayerGroup);

        L.circleMarker(endPt, {
          radius: 7,
          color: '#FFFFFF',
          weight: 2.5,
          fillColor: '#E05A36',
          fillOpacity: 1
        }).bindTooltip("Finish", { permanent: false }).addTo(atlasLayerGroup);
      };

      lastAtlasLatestBounds = mainPolyline.getBounds();
      if (lastAtlasLatestBounds.isValid()) {
        atlasMapInstance.flyToBounds(lastAtlasLatestBounds.pad(0.20), {
          padding: [50, 50],
          maxZoom: 15,
          duration: 0.8
        });

        // Ajouter les marqueurs à la fin du zoom de recentrage pour éviter le grossissement d'échelle temporaire
        const onMoveEnd = () => {
          atlasMapInstance?.off('moveend', onMoveEnd);
          addPins();
        };

        atlasMapInstance.once('moveend', onMoveEnd);
        setTimeout(addPins, 850);
      } else {
        addPins();
      }
    }
  }

  const atlasCountPill = document.getElementById('lbl-atlas-count-pill');
  if (atlasCountPill) {
    atlasCountPill.textContent = i18n.t().runsCountBadge(activities.length);
  }
}

export function initPageAtlasMap(elementId: string = 'page-heatmap-container', activities: Activity[] = []): void {
  const container = document.getElementById(elementId);
  if (!container) return;

  if (!atlasMapInstance) {
    atlasMapInstance = L.map(elementId, {
      zoomControl: false,
      attributionControl: false
    }).setView([48.8566, 2.3522], 12);

    L.control.zoom({ position: 'bottomleft' }).addTo(atlasMapInstance);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 17,
      attribution: '&copy; Esri World Light Gray Base'
    }).addTo(atlasMapInstance);

    atlasLayerGroup = L.layerGroup().addTo(atlasMapInstance);
  }

  atlasMapInstance.invalidateSize();

  // Par défaut à l'ouverture : TOUTES les courses sont en orange
  if (activities.length > 0) {
    renderAtlasAllTracks(activities);
  }
}

export function recenterAtlasMap(activities?: Activity[]): void {
  if (!atlasMapInstance) return;
  atlasMapInstance.invalidateSize();
  if (activities && activities.length > 0) {
    renderAtlasAllTracks(activities);
  } else if (lastAtlasAllBounds && lastAtlasAllBounds.isValid()) {
    atlasMapInstance.flyToBounds(lastAtlasAllBounds.pad(0.08), { duration: 0.8 });
  }
}

export function recenterAtlasToLatest(activities?: Activity[]): void {
  if (!atlasMapInstance) return;
  atlasMapInstance.invalidateSize();
  if (activities && activities.length > 0) {
    renderAtlasLatestTrack(activities);
  } else if (lastAtlasLatestBounds && lastAtlasLatestBounds.isValid()) {
    atlasMapInstance.flyToBounds(lastAtlasLatestBounds.pad(0.20), { maxZoom: 15, duration: 0.8 });
  }
}

let fullscreenMapInstance: L.Map | null = null;
let fullscreenLayerGroup: L.LayerGroup | null = null;

export function openFullscreenHeatmap(activities: Activity[], highlightActivityId?: number) {
  const modal = document.getElementById('heatmap-modal');
  if (!modal || !activities || activities.length === 0) return;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  const modalPill = document.getElementById('lbl-modal-heatmap-pill');
  if (modalPill) {
    const bgCount = activities.length > 1 ? activities.length - 1 : activities.length;
    modalPill.textContent = `${bgCount} courses`;
  }

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

      const sortedByDate = [...activities].sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime());
      const targetActivity = highlightActivityId
        ? activities.find(a => a.id === highlightActivityId) || sortedByDate[0]
        : sortedByDate[0];

      // 1. Tracés de toutes les autres courses en gris translucide
      activities.forEach(act => {
        if (act.id !== targetActivity?.id && act.map?.summary_polyline) {
          const coords = decodePolyline(act.map.summary_polyline);
          if (coords.length > 0) {
            const polyline = L.polyline(coords, {
              color: '#717885',
              weight: 2.4,
              opacity: 0.35,
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
          }
        }
      });

      // 2. Course actuelle en Orange Terracotta vibrant au premier plan
      if (targetActivity && targetActivity.map?.summary_polyline) {
        const coords = decodePolyline(targetActivity.map.summary_polyline);
        if (coords.length > 0) {
          const mainPolyline = L.polyline(coords, {
            color: '#E05A36',
            weight: 5.5,
            opacity: 1,
            lineJoin: 'round'
          });

          mainPolyline.bindPopup(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 190px; padding: 4px;">
              <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: #E05A36; margin-bottom: 2px;">Selected run</div>
              <strong style="font-size: 0.95rem; color: #1C1E21; display: block; margin-bottom: 4px;">${targetActivity.name}</strong>
              <div style="font-size: 0.78rem; color: #5C626C; margin-bottom: 6px;">${formatDate(targetActivity.start_date_local)}</div>
              <div style="display: flex; justify-content: space-between; font-size: 0.84rem; border-top: 1px solid #ECE6DC; padding-top: 6px;">
                <span><strong>${formatDistance(targetActivity.distance)}</strong></span>
                <span><strong>${formatTimeShort(targetActivity.moving_time)}</strong></span>
                <span><strong>${formatPace(targetActivity.average_speed)}</strong></span>
              </div>
            </div>
          `);

          mainPolyline.addTo(fullscreenLayerGroup!);
          lastFullscreenTargetBounds = mainPolyline.getBounds();

          // Pins Départ et Arrivée
          L.circleMarker(coords[0], {
            radius: 8,
            color: '#FFFFFF',
            weight: 2.5,
            fillColor: '#2E6B56',
            fillOpacity: 1
          }).addTo(fullscreenLayerGroup!);

          L.circleMarker(coords[coords.length - 1], {
            radius: 8,
            color: '#FFFFFF',
            weight: 2.5,
            fillColor: '#E05A36',
            fillOpacity: 1
          }).addTo(fullscreenLayerGroup!);

          fullscreenMapInstance.fitBounds(lastFullscreenTargetBounds.pad(0.20), {
            padding: [40, 40],
            maxZoom: 14
          });
        }
      }
    }
  }, 100);
}

export function recenterFullscreenMap(): void {
  if (fullscreenMapInstance && lastFullscreenTargetBounds && lastFullscreenTargetBounds.isValid()) {
    fullscreenMapInstance.flyToBounds(lastFullscreenTargetBounds.pad(0.20), {
      padding: [40, 40],
      maxZoom: 14,
      duration: 0.8
    });
  }
}

export function closeFullscreenHeatmap() {
  const modal = document.getElementById('heatmap-modal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
  if (fullscreenMapInstance) {
    fullscreenMapInstance.closePopup();
  }
}
