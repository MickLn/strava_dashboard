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

  // Panes Leaflet personnalisés avec zIndex stricts pour garantir que les tracés gris sont toujours en-dessous du tracé orange
  mapInstance.createPane('bgTracksPane');
  const bgPane = mapInstance.getPane('bgTracksPane');
  if (bgPane) {
    bgPane.style.zIndex = '350';
  }

  mapInstance.createPane('featuredTrackPane');
  const featPane = mapInstance.getPane('featuredTrackPane');
  if (featPane) {
    featPane.style.zIndex = '450';
  }

  mapInstance.createPane('featuredMarkersPane');
  const featMarkersPane = mapInstance.getPane('featuredMarkersPane');
  if (featMarkersPane) {
    featMarkersPane.style.zIndex = '480';
  }

  bgTracksLayerGroup = L.layerGroup().addTo(mapInstance);
  currentLayerGroup = L.layerGroup().addTo(mapInstance);

  return mapInstance;
}

// Couche dédiée aux tracés secondaires d'arrière-plan pour bascule interactive
let bgTracksLayerGroup: L.LayerGroup | null = null;
let isBgTracksVisible: boolean = true;

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

  const isMobile = window.innerWidth <= 768;
  const paddingBottom = isMobile ? Math.round(window.innerHeight * 0.45) : 30;
  const paddingTop = isMobile ? 80 : 20;

  if (lastFeaturedTargetBounds && lastFeaturedTargetBounds.isValid()) {
    mapInstance.flyToBounds(lastFeaturedTargetBounds.pad(0.20), {
      paddingTopLeft: [20, paddingTop],
      paddingBottomRight: [20, paddingBottom],
      maxZoom: 15,
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
      mapInstance.flyToBounds(lastFeaturedTargetBounds.pad(0.20), {
        paddingTopLeft: [20, paddingTop],
        paddingBottomRight: [20, paddingBottom],
        maxZoom: 15,
        duration: 0.8
      });
    }
  }
}

export function renderActivityTraces(activities: Activity[], highlightActivityId?: number, onSelectActivity?: (act: Activity) => void) {
  if (!mapInstance || !currentLayerGroup || !activities || activities.length === 0) return;

  currentLayerGroup.clearLayers();
  if (bgTracksLayerGroup) {
    bgTracksLayerGroup.clearLayers();
  }

  const sortedByDate = [...activities].sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime());
  const targetActivity = highlightActivityId
    ? activities.find(a => a.id === highlightActivityId) || sortedByDate[0]
    : sortedByDate[0];

  let targetBounds: L.LatLngBounds | null = null;

  // 1. Dessiner l'ensemble de tous les autres tracés dans la couche dédiée d'arrière-plan (sous la course orange)
  activities.forEach(activity => {
    if (activity.id !== targetActivity?.id && activity.map?.summary_polyline) {
      const coords = decodePolyline(activity.map.summary_polyline);
      if (coords.length > 0) {
        const polyline = L.polyline(coords, {
          pane: 'bgTracksPane',
          color: '#717885',
          weight: 2.2,
          opacity: 0.40,
          lineJoin: 'round'
        });

        polyline.on('click', () => {
          if (onSelectActivity) {
            onSelectActivity(activity);
          }
        });

        polyline.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 175px; padding: 2px;">
            <strong style="font-size: 0.88rem; color: #1C1E21; display: block; margin-bottom: 2px;">${activity.name}</strong>
            <div style="font-size: 0.75rem; color: #5C626C; margin-bottom: 4px;">${formatDate(activity.start_date_local)}</div>
            <div style="font-size: 0.8rem; font-weight: 700; color: #E05A36; margin-bottom: 6px;">
              ${formatDistance(activity.distance)} • ${formatTimeShort(activity.moving_time)} • ${formatPace(activity.average_speed)}
            </div>
            <button id="btn-select-map-run-${activity.id}" style="width: 100%; padding: 5px 8px; font-size: 0.76rem; font-weight: 700; background: #E05A36; color: #FFFFFF; border: none; border-radius: 4px; cursor: pointer;">
              ${i18n.getLang() === 'fr' ? 'Afficher cette course' : 'Select this run'}
            </button>
          </div>
        `);

        polyline.on('popupopen', () => {
          const btn = document.getElementById(`btn-select-map-run-${activity.id}`);
          if (btn) {
            btn.onclick = () => {
              mapInstance?.closePopup();
              if (onSelectActivity) {
                onSelectActivity(activity);
              }
            };
          }
        });

        if (bgTracksLayerGroup) {
          polyline.addTo(bgTracksLayerGroup);
        }
      }
    }
  });

  // Appliquer la visibilité actuelle de la couche d'arrière-plan
  if (mapInstance && bgTracksLayerGroup) {
    if (isBgTracksVisible) {
      if (!mapInstance.hasLayer(bgTracksLayerGroup)) {
        bgTracksLayerGroup.addTo(mapInstance);
      }
    } else {
      if (mapInstance.hasLayer(bgTracksLayerGroup)) {
        mapInstance.removeLayer(bgTracksLayerGroup);
      }
    }
  }

  // 2. Dessiner la séance sélectionnée au premier plan en Terracotta vibrant (au-dessus des autres tracés)
  if (targetActivity && targetActivity.map?.summary_polyline) {
    const coords = decodePolyline(targetActivity.map.summary_polyline);
    if (coords.length > 0) {
      playbackCurrentCoords = coords;
      resetFeaturedTrackAnimation();
      featuredMainPolyline = L.polyline(coords, {
        pane: 'featuredTrackPane',
        color: '#E05A36',
        weight: 5,
        opacity: 1,
        lineJoin: 'round'
      });
      const mainPolyline = featuredMainPolyline;

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

      // Marqueur de départ (vert forêt) au premier plan (au-dessus du tracé)
      const startPt = coords[0];
      L.circleMarker(startPt, {
        pane: 'featuredMarkersPane',
        radius: 7.5,
        color: '#FFFFFF',
        weight: 2.5,
        fillColor: '#2E6B56',
        fillOpacity: 1
      }).bindTooltip("Start", { permanent: false }).addTo(currentLayerGroup!);

      // Marqueur d'arrivée (terracotta) au premier plan (au-dessus du tracé)
      const endPt = coords[coords.length - 1];
      L.circleMarker(endPt, {
        pane: 'featuredMarkersPane',
        radius: 7.5,
        color: '#FFFFFF',
        weight: 2.5,
        fillColor: '#E05A36',
        fillOpacity: 1
      }).bindTooltip("Finish", { permanent: false }).addTo(currentLayerGroup!);
    }
  }

  // 3. Cadrage épuré centré sur la zone de course
  if (targetBounds && targetBounds.isValid()) {
    const isMobile = window.innerWidth <= 768;
    const paddingBottom = isMobile ? Math.round(window.innerHeight * 0.45) : 25;
    const paddingTop = isMobile ? 80 : 20;
    mapInstance.fitBounds(targetBounds.pad(0.20), {
      paddingTopLeft: [20, paddingTop],
      paddingBottomRight: [20, paddingBottom],
      maxZoom: 15
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

      // Marqueurs Départ et Arrivée en SVG circleMarker natifs synchrones
      const startPt = coords[0];
      const endPt = coords[coords.length - 1];

      L.circleMarker(startPt, {
        radius: 7,
        color: '#FFFFFF',
        weight: 2.5,
        fillColor: '#2E6B56',
        fillOpacity: 1
      }).bindTooltip("Start", { permanent: false }).addTo(atlasLayerGroup!);

      L.circleMarker(endPt, {
        radius: 7,
        color: '#FFFFFF',
        weight: 2.5,
        fillColor: '#E05A36',
        fillOpacity: 1
      }).bindTooltip("Finish", { permanent: false }).addTo(atlasLayerGroup!);

      lastAtlasLatestBounds = mainPolyline.getBounds();
      if (lastAtlasLatestBounds.isValid()) {
        atlasMapInstance.flyToBounds(lastAtlasLatestBounds.pad(0.20), {
          padding: [50, 50],
          maxZoom: 15,
          duration: 0.8
        });
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

/**
 * Bascule l'affichage de l'ensemble des autres traces en arrière-plan
 */
export function toggleBackgroundTracks(): boolean {
  isBgTracksVisible = !isBgTracksVisible;
  if (mapInstance && bgTracksLayerGroup) {
    if (isBgTracksVisible) {
      if (!mapInstance.hasLayer(bgTracksLayerGroup)) {
        bgTracksLayerGroup.addTo(mapInstance);
      }
    } else {
      if (mapInstance.hasLayer(bgTracksLayerGroup)) {
        mapInstance.removeLayer(bgTracksLayerGroup);
      }
    }
  }

  const btnToggle = document.getElementById('btn-toggle-bg-tracks');
  if (btnToggle) {
    btnToggle.classList.toggle('active', isBgTracksVisible);
  }

  return isBgTracksVisible;
}

// Variables pour l'animation Playback de la course
let featuredMainPolyline: L.Polyline | null = null;
let playbackAnimationId: number | null = null;
let playbackCurrentCoords: [number, number][] = [];
let playbackPolyline: L.Polyline | null = null;
let playbackRunnerMarker: L.CircleMarker | null = null;
let playbackProgress: number = 0; // 0 à 1
let playbackIsPlaying: boolean = false;
let playbackDurationMs: number = 5500;

/**
 * Réinitialise complètement l'état de l'animation Playback
 */
export function resetFeaturedTrackAnimation(): void {
  if (playbackAnimationId !== null) {
    cancelAnimationFrame(playbackAnimationId);
    playbackAnimationId = null;
  }
  playbackIsPlaying = false;
  playbackProgress = 0;

  if (featuredMainPolyline) {
    featuredMainPolyline.setStyle({ opacity: 1 });
  }

  if (mapInstance) {
    if (playbackPolyline && mapInstance.hasLayer(playbackPolyline)) {
      mapInstance.removeLayer(playbackPolyline);
    }
    if (playbackRunnerMarker && mapInstance.hasLayer(playbackRunnerMarker)) {
      mapInstance.removeLayer(playbackRunnerMarker);
    }
  }
  playbackPolyline = null;
  playbackRunnerMarker = null;

  updatePlayButtonUI('play');
}

/**
 * Met à jour l'icône et l'état du bouton Play
 */
function updatePlayButtonUI(state: 'play' | 'pause' | 'replay'): void {
  const btn = document.getElementById('btn-play-featured-track');
  if (!btn) return;

  btn.classList.toggle('active', state === 'pause');
  btn.classList.toggle('is-playing', state === 'pause');

  if (state === 'pause') {
    btn.setAttribute('title', 'Mettre en pause');
    btn.setAttribute('aria-label', 'Mettre en pause');
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <rect x="6" y="4" width="4" height="16" rx="1.5"></rect>
        <rect x="14" y="4" width="4" height="16" rx="1.5"></rect>
      </svg>
    `;
  } else if (state === 'replay') {
    btn.setAttribute('title', 'Rejouer le tracé');
    btn.setAttribute('aria-label', 'Rejouer le tracé');
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 4v6h6"></path>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
      </svg>
    `;
  } else {
    btn.setAttribute('title', 'Rejouer le parcours de la course');
    btn.setAttribute('aria-label', 'Rejouer le parcours de la course');
    btn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="margin-left: 2px;">
        <polygon points="6 3 20 12 6 21 6 3"></polygon>
      </svg>
    `;
  }
}

/**
 * Bascule lecture / pause du parcours de la course
 */
export function togglePlayFeaturedTrack(): void {
  if (!mapInstance || playbackCurrentCoords.length < 2) return;

  if (playbackIsPlaying) {
    pauseFeaturedTrack();
  } else {
    playFeaturedTrack();
  }
}

export function pauseFeaturedTrack(): void {
  if (playbackAnimationId !== null) {
    cancelAnimationFrame(playbackAnimationId);
    playbackAnimationId = null;
  }
  playbackIsPlaying = false;
  updatePlayButtonUI('play');
}

export function playFeaturedTrack(): void {
  if (!mapInstance || playbackCurrentCoords.length < 2) return;

  if (playbackProgress >= 1) {
    playbackProgress = 0;
    if (playbackPolyline) {
      playbackPolyline.setLatLngs([]);
    }
  }

  // Faire disparaître le tracé orange statique pour qu'il soit retracé en direct
  if (featuredMainPolyline) {
    featuredMainPolyline.setStyle({ opacity: 0 });
  }

  // Création du tracé orange dynamique redessiné progressivement
  if (!playbackPolyline) {
    playbackPolyline = L.polyline([], {
      pane: 'featuredTrackPane',
      color: '#E05A36',
      weight: 5.5,
      opacity: 1,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(mapInstance);
  }

  if (!playbackRunnerMarker) {
    playbackRunnerMarker = L.circleMarker(playbackCurrentCoords[0], {
      pane: 'featuredMarkersPane',
      radius: 7.5,
      color: '#FFFFFF',
      weight: 2.5,
      fillColor: '#E05A36',
      fillOpacity: 1
    }).addTo(mapInstance);
  }

  playbackIsPlaying = true;
  updatePlayButtonUI('pause');

  const totalPoints = playbackCurrentCoords.length;
  // Durée d'animation fluide et naturelle (entre 3.5s et 7s)
  playbackDurationMs = Math.max(3500, Math.min(7000, totalPoints * 16));

  let lastTimestamp: number | null = null;

  const animate = (timestamp: number) => {
    if (!playbackIsPlaying) return;

    if (lastTimestamp === null) {
      lastTimestamp = timestamp;
    }
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    playbackProgress += delta / playbackDurationMs;

    if (playbackProgress >= 1) {
      playbackProgress = 1;
      playbackIsPlaying = false;

      // Rétablir le tracé principal complet à 100%
      if (featuredMainPolyline) {
        featuredMainPolyline.setStyle({ opacity: 1 });
      }
      if (mapInstance) {
        if (playbackPolyline && mapInstance.hasLayer(playbackPolyline)) {
          mapInstance.removeLayer(playbackPolyline);
        }
        if (playbackRunnerMarker && mapInstance.hasLayer(playbackRunnerMarker)) {
          mapInstance.removeLayer(playbackRunnerMarker);
        }
      }
      playbackPolyline = null;
      playbackRunnerMarker = null;

      updatePlayButtonUI('replay');
      return;
    }

    const floatIndex = playbackProgress * (totalPoints - 1);
    const currIdx = Math.floor(floatIndex);
    const nextIdx = Math.min(totalPoints - 1, currIdx + 1);
    const t = floatIndex - currIdx;

    const p1 = playbackCurrentCoords[currIdx];
    const p2 = playbackCurrentCoords[nextIdx];

    const currentLat = p1[0] + (p2[0] - p1[0]) * t;
    const currentLng = p1[1] + (p2[1] - p1[1]) * t;
    const currentPoint: [number, number] = [currentLat, currentLng];

    const drawnPoints = playbackCurrentCoords.slice(0, currIdx + 1);
    drawnPoints.push(currentPoint);

    if (playbackPolyline) {
      playbackPolyline.setLatLngs(drawnPoints);
    }
    if (playbackRunnerMarker) {
      playbackRunnerMarker.setLatLng(currentPoint);
    }

    playbackAnimationId = requestAnimationFrame(animate);
  };

  playbackAnimationId = requestAnimationFrame(animate);
}
