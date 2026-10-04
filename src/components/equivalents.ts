import { Activity } from '../types/strava.ts';
import { i18n } from '../utils/i18n.ts';

export interface DistanceMilestone {
  id: string;
  nameFr: string;
  nameEn: string;
  subtitleFr: string;
  subtitleEn: string;
  targetKm: number;
  viewBox: string;
  pathD: string;
}

export interface ElevationMilestone {
  id: string;
  nameFr: string;
  nameEn: string;
  altitudeMeters: number;
  viewBox: string;
  svgContent: string;
}

// 1. Échelons de distance avec contours vectoriels stylisés et fidèles
export const DISTANCE_MILESTONES: DistanceMilestone[] = [
  {
    id: 'paris-100',
    nameFr: 'Grand Paris',
    nameEn: 'Greater Paris',
    subtitleFr: 'Boucle métropolitaine (~100 km)',
    subtitleEn: 'Metropolitan Belt (~100 km)',
    targetKm: 100,
    viewBox: '0 0 400 300',
    // Tracé de boucle elliptique organique avec méandres évoquant la Seine et la petite couronne
    pathD: 'M 190 45 C 260 40, 340 75, 355 130 C 370 185, 335 240, 275 255 C 220 270, 160 255, 110 240 C 60 220, 40 175, 45 125 C 50 75, 120 50, 190 45 Z'
  },
  {
    id: 'london-300',
    nameFr: 'Tour de Londres',
    nameEn: 'London Orbital',
    subtitleFr: 'La grande boucle London M25 (~300 km)',
    subtitleEn: 'London Orbital Ring M25 (~300 km)',
    targetKm: 300,
    viewBox: '0 0 400 300',
    // Contour ovale élargi avec inflexions nord-sud évoquant le ring londonien
    pathD: 'M 200 35 C 290 35, 365 80, 365 145 C 365 210, 290 265, 195 265 C 105 265, 35 210, 35 145 C 35 80, 110 35, 200 35 Z'
  },
  {
    id: 'amsterdam-500',
    nameFr: 'Paris ➔ Amsterdam',
    nameEn: 'Paris ➔ Amsterdam',
    subtitleFr: 'Traversée des Capitales via Bruxelles (~500 km)',
    subtitleEn: 'Capital Traverse via Brussels (~500 km)',
    targetKm: 500,
    viewBox: '0 0 400 300',
    // Route Nord-Nord-Est Paris -> Lille -> Bruxelles -> Rotterdam -> Amsterdam
    pathD: 'M 80 260 C 110 230, 140 190, 175 160 C 210 130, 250 115, 280 80 C 305 50, 325 35, 340 25'
  },
  {
    id: 'marseille-1000',
    nameFr: 'Paris ➔ Marseille',
    nameEn: 'Paris ➔ Marseille',
    subtitleFr: 'L\'Axe Royal Nord-Sud (~1 000 km)',
    subtitleEn: 'North-South Royal Spine (~1,000 km)',
    targetKm: 1000,
    viewBox: '0 0 400 300',
    // Route Nord-Sud courbée descendant le couloir rhodanien
    pathD: 'M 180 30 C 190 70, 200 110, 220 150 C 240 190, 235 230, 250 270'
  },
  {
    id: 'tourdefrance-3500',
    nameFr: 'Tour de France',
    nameEn: 'Tour de France',
    subtitleFr: 'Le Grand Hexagone complet (~3 500 km)',
    subtitleEn: 'The Legendary Hexagon Loop (~3,500 km)',
    targetKm: 3500,
    viewBox: '0 0 400 300',
    // Silhouette de l'Hexagone français (Nord, Grand Est, Alpes, Côte d'Azur, Pyrénées, Bretagne)
    pathD: 'M 200 25 C 240 20, 280 40, 310 70 C 330 95, 345 130, 340 160 C 335 190, 315 210, 305 240 C 295 265, 260 275, 230 275 C 190 275, 145 285, 120 270 C 95 255, 90 220, 85 190 C 80 160, 45 145, 55 110 C 65 80, 120 70, 150 50 C 175 35, 185 25, 200 25 Z'
  }
];

// 2. Silhouettes vectorielles fidèles de monuments et montagnes
export const ELEVATION_MILESTONES: ElevationMilestone[] = [
  {
    id: 'eiffel',
    nameFr: 'Tour Eiffel',
    nameEn: 'Eiffel Tower',
    altitudeMeters: 330,
    viewBox: '0 0 160 220',
    // Silhouette géométrique élégante de la Tour Eiffel
    svgContent: `
      <path d="M 80 15 L 80 35 M 76 35 L 84 35 L 82 70 L 78 70 Z M 74 70 L 86 70 L 85 110 L 75 110 Z M 71 110 L 89 110 M 70 115 L 90 115 L 105 185 L 55 185 Z M 63 185 C 63 150, 97 150, 97 185 Z M 48 185 L 112 185 L 120 205 L 100 205 L 94 185 M 66 185 L 60 205 L 40 205 L 48 185 Z" />
    `
  },
  {
    id: 'puy-de-dome',
    nameFr: 'Puy de Dôme',
    nameEn: 'Puy de Dôme',
    altitudeMeters: 1465,
    viewBox: '0 0 240 180',
    // Silhouette du dôme volcanique avec l'observatoire / antenne au sommet
    svgContent: `
      <path d="M 10 160 L 50 150 Q 80 140, 105 105 Q 115 80, 120 70 L 120 45 L 122 45 L 122 70 Q 128 80, 135 105 Q 160 140, 190 150 L 230 160 Z" />
    `
  },
  {
    id: 'mont-ventoux',
    nameFr: 'Mont Ventoux',
    nameEn: 'Mont Ventoux',
    altitudeMeters: 1910,
    viewBox: '0 0 240 180',
    // Silhouette de la crête pierreuse du Ventoux et de sa tour blanche/rouge
    svgContent: `
      <path d="M 10 165 C 50 155, 80 145, 110 95 L 115 70 L 115 40 L 122 40 L 122 70 L 126 95 C 150 140, 185 155, 230 165 Z" />
    `
  },
  {
    id: 'mont-blanc',
    nameFr: 'Mont Blanc',
    nameEn: 'Mont Blanc',
    altitudeMeters: 4807,
    viewBox: '0 0 260 180',
    // Silhouette alpine du massif du Mont Blanc avec dôme glaciaire et aiguilles
    svgContent: `
      <path d="M 10 165 L 45 145 L 75 125 L 95 105 L 120 65 Q 130 50, 140 60 L 165 95 L 195 115 L 220 145 L 250 165 Z" />
    `
  },
  {
    id: 'everest',
    nameFr: 'Mont Everest',
    nameEn: 'Mount Everest',
    altitudeMeters: 8848,
    viewBox: '0 0 260 180',
    // Pyramide himalayenne abrupte de l'Everest
    svgContent: `
      <path d="M 10 165 L 60 135 L 90 115 L 125 40 L 140 70 L 175 105 L 210 130 L 250 165 Z" />
    `
  },
  {
    id: 'stratosphere',
    nameFr: 'La Stratosphère',
    nameEn: 'The Stratosphere',
    altitudeMeters: 15000,
    viewBox: '0 0 260 180',
    // Échelon ultime : ascension stylisée traversant les nuages vers l'espace
    svgContent: `
      <path d="M 15 165 C 40 150, 65 150, 85 160 C 110 145, 140 145, 160 160 C 185 145, 220 145, 245 165 Z M 120 130 L 130 25 L 140 130 Z M 130 15 L 132 20 L 130 25 L 128 20 Z" />
    `
  }
];

let selectedDistId = 'tourdefrance-3500';
let selectedElevId = 'mont-blanc';

export function renderEquivalents(activities: Activity[], stats?: any): void {
  const container = document.getElementById('equivalents-content-wrap');
  if (!container) return;

  const isFr = i18n.getLang() === 'fr';

  // 1. Calculs des totaux de carrière
  let totalDistKm = 0;
  let totalElevMeters = 0;

  if (stats?.all_run_totals) {
    totalDistKm = (stats.all_run_totals.distance || 0) / 1000;
    totalElevMeters = stats.all_run_totals.elevation_gain || 0;
  }

  // Vérification sur les activités si les totaux stats sont incomplets
  if (activities && activities.length > 0) {
    const sumKm = activities.reduce((acc, a) => acc + (a.distance || 0), 0) / 1000;
    const sumElev = activities.reduce((acc, a) => acc + (a.total_elevation_gain || 0), 0);
    if (sumKm > totalDistKm) totalDistKm = sumKm;
    if (sumElev > totalElevMeters) totalElevMeters = sumElev;
  }

  totalDistKm = Math.round(totalDistKm);
  totalElevMeters = Math.round(totalElevMeters);

  // Par défaut, sélectionner le défi en cours (le premier non complété, ou le dernier)
  const defaultDist = DISTANCE_MILESTONES.find(m => totalDistKm < m.targetKm) || DISTANCE_MILESTONES[DISTANCE_MILESTONES.length - 1];
  if (!DISTANCE_MILESTONES.some(m => m.id === selectedDistId)) {
    selectedDistId = defaultDist.id;
  }

  const defaultElev = ELEVATION_MILESTONES.find(m => totalElevMeters < m.altitudeMeters) || ELEVATION_MILESTONES[ELEVATION_MILESTONES.length - 1];
  if (!ELEVATION_MILESTONES.some(m => m.id === selectedElevId)) {
    selectedElevId = defaultElev.id;
  }

  container.innerHTML = `
    <div class="equivalents-grid">
      <!-- Volet Gauche : Échelons de Distance (Contours de Ville) -->
      <div class="equiv-module equiv-module-dist">
        <div class="equiv-module-top">
          <div class="equiv-module-header">
            <span class="equiv-module-tag">${isFr ? 'EXPÉDITIONS DE VILLES' : 'CITY EXPEDITIONS'}</span>
            <div class="equiv-status-pill" id="equiv-dist-status-pill"></div>
          </div>
          
          <!-- Sélecteur d'échelons de distance (100km, 300km, 500km, etc.) -->
          <div class="equiv-pills-bar" id="equiv-dist-pills-bar">
            ${DISTANCE_MILESTONES.map(m => {
              const done = totalDistKm >= m.targetKm;
              const active = m.id === selectedDistId;
              const checkIcon = done ? '✓ ' : '';
              return `
                <button class="equiv-pill ${active ? 'active' : ''} ${done ? 'completed' : ''}" data-dist-id="${m.id}" type="button">
                  <span class="equiv-pill-dot"></span>
                  <span>${checkIcon}${m.targetKm} km • ${isFr ? m.nameFr : m.nameEn}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Zone d'affichage du tracé SVG interactif -->
        <div class="equiv-stage-card">
          <div class="equiv-stage-header">
            <div class="equiv-stage-titles">
              <h4 class="equiv-stage-title" id="equiv-dist-title"></h4>
              <p class="equiv-stage-subtitle" id="equiv-dist-sub"></p>
            </div>
            <div class="equiv-stage-pct-wrap">
              <span class="equiv-stage-pct" id="equiv-dist-pct">0%</span>
            </div>
          </div>

          <div class="equiv-visual-box">
            <svg class="equiv-contour-svg" id="equiv-contour-svg" preserveAspectRatio="xMidYMid meet"></svg>
          </div>

          <div class="equiv-stage-footer">
            <div class="equiv-stage-stat">
              <span class="equiv-stage-stat-label">${isFr ? 'Parcouru' : 'Run'}</span>
              <strong class="equiv-stage-stat-val" id="equiv-dist-run"></strong>
            </div>
            <div class="equiv-stage-stat">
              <span class="equiv-stage-stat-label">${isFr ? 'Objectif' : 'Target'}</span>
              <strong class="equiv-stage-stat-val" id="equiv-dist-target"></strong>
            </div>
            <div class="equiv-stage-stat">
              <span class="equiv-stage-stat-label" id="equiv-dist-remaining-lbl">${isFr ? 'Restant' : 'To go'}</span>
              <strong class="equiv-stage-stat-val" id="equiv-dist-remaining"></strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Volet Droit : Dénivelé (Silhouettes Réelles de Monuments & Montagnes) -->
      <div class="equiv-module equiv-module-elev">
        <div class="equiv-module-top">
          <div class="equiv-module-header">
            <span class="equiv-module-tag">${isFr ? 'SOMMETS & MONUMENTS' : 'PEAKS & MONUMENTS'}</span>
            <div class="equiv-status-pill" id="equiv-elev-status-pill"></div>
          </div>

          <!-- Sélecteur des silhouettes de dénivelé -->
          <div class="equiv-pills-bar" id="equiv-elev-pills-bar">
            ${ELEVATION_MILESTONES.map(m => {
              const done = totalElevMeters >= m.altitudeMeters;
              const active = m.id === selectedElevId;
              const checkIcon = done ? '✓ ' : '';
              return `
                <button class="equiv-pill ${active ? 'active' : ''} ${done ? 'completed' : ''}" data-elev-id="${m.id}" type="button">
                  <span class="equiv-pill-dot"></span>
                  <span>${checkIcon}${isFr ? m.nameFr : m.nameEn} (${m.altitudeMeters}m)</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Zone d'affichage de la silhouette SVG -->
        <div class="equiv-stage-card">
          <div class="equiv-stage-header">
            <div class="equiv-stage-titles">
              <h4 class="equiv-stage-title" id="equiv-elev-title"></h4>
              <p class="equiv-stage-subtitle" id="equiv-elev-sub"></p>
            </div>
            <div class="equiv-stage-pct-wrap">
              <span class="equiv-stage-pct" id="equiv-elev-pct">0%</span>
            </div>
          </div>

          <div class="equiv-visual-box">
            <svg class="equiv-mountain-svg" id="equiv-mountain-svg" preserveAspectRatio="xMidYMid meet"></svg>
          </div>

          <div class="equiv-stage-footer">
            <div class="equiv-stage-stat">
              <span class="equiv-stage-stat-label">${isFr ? 'D+ cumulé' : 'Total D+'}</span>
              <strong class="equiv-stage-stat-val" id="equiv-elev-climbed"></strong>
            </div>
            <div class="equiv-stage-stat">
              <span class="equiv-stage-stat-label">${isFr ? 'Altitude' : 'Altitude'}</span>
              <strong class="equiv-stage-stat-val" id="equiv-elev-target"></strong>
            </div>
            <div class="equiv-stage-stat">
              <span class="equiv-stage-stat-label" id="equiv-elev-stat3-lbl">${isFr ? 'Équivalence' : 'Equivalence'}</span>
              <strong class="equiv-stage-stat-val" id="equiv-elev-stat3-val"></strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attacher les écouteurs pour les pilules de distance
  const distPills = container.querySelectorAll<HTMLButtonElement>('[data-dist-id]');
  distPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const id = pill.getAttribute('data-dist-id');
      if (id) {
        selectedDistId = id;
        distPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-dist-id') === id));
        updateDistanceStage(totalDistKm, isFr);
      }
    });
  });

  // Attacher les écouteurs pour les pilules de dénivelé
  const elevPills = container.querySelectorAll<HTMLButtonElement>('[data-elev-id]');
  elevPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const id = pill.getAttribute('data-elev-id');
      if (id) {
        selectedElevId = id;
        elevPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-elev-id') === id));
        updateElevationStage(totalElevMeters, isFr);
      }
    });
  });

  // Rendu initial des deux cartes actives
  updateDistanceStage(totalDistKm, isFr);
  updateElevationStage(totalElevMeters, isFr);
}

/**
 * Met à jour le tracé vectoriel et les stats du défi de distance actif
 */
function updateDistanceStage(totalKm: number, isFr: boolean): void {
  const milestone = DISTANCE_MILESTONES.find(m => m.id === selectedDistId) || DISTANCE_MILESTONES[0];
  const isDone = totalKm >= milestone.targetKm;
  const pct = Math.min(100, Math.round((totalKm / milestone.targetKm) * 100));
  const remaining = Math.max(0, milestone.targetKm - totalKm);

  // Textes & Badges
  const titleEl = document.getElementById('equiv-dist-title');
  const subEl = document.getElementById('equiv-dist-sub');
  const pctEl = document.getElementById('equiv-dist-pct');
  const statusEl = document.getElementById('equiv-dist-status-pill');
  const runEl = document.getElementById('equiv-dist-run');
  const targetEl = document.getElementById('equiv-dist-target');
  const remainingEl = document.getElementById('equiv-dist-remaining');
  const remainingLbl = document.getElementById('equiv-dist-remaining-lbl');

  if (titleEl) titleEl.textContent = isFr ? milestone.nameFr : milestone.nameEn;
  if (subEl) subEl.textContent = isFr ? milestone.subtitleFr : milestone.subtitleEn;
  if (pctEl) {
    pctEl.textContent = `${pct}%`;
    pctEl.className = `equiv-stage-pct ${isDone ? 'completed' : ''}`;
  }

  if (statusEl) {
    if (isDone) {
      statusEl.className = 'equiv-status-pill done';
      statusEl.textContent = isFr ? '✓ Complété' : '✓ Completed';
    } else {
      statusEl.className = 'equiv-status-pill in-progress';
      statusEl.textContent = isFr ? `En cours (${pct}%)` : `In progress (${pct}%)`;
    }
  }

  if (runEl) runEl.textContent = `${totalKm.toLocaleString('fr-FR')} km`;
  if (targetEl) targetEl.textContent = `${milestone.targetKm.toLocaleString('fr-FR')} km`;
  if (remainingEl && remainingLbl) {
    if (isDone) {
      remainingLbl.textContent = isFr ? 'Statut' : 'Status';
      remainingEl.textContent = isFr ? 'Conquis' : 'Conquered';
    } else {
      remainingLbl.textContent = isFr ? 'Restant' : 'To go';
      remainingEl.textContent = `${remaining.toLocaleString('fr-FR')} km`;
    }
  }

  // Rendu du SVG avec contour gris et tracé orange animé
  const svgEl = document.getElementById('equiv-contour-svg');
  if (svgEl) {
    svgEl.setAttribute('viewBox', milestone.viewBox);
    svgEl.innerHTML = `
      <defs>
        <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <!-- Contour de base en gris discret -->
      <path class="contour-base" d="${milestone.pathD}" />
      <!-- Portion de tracé parcourue en orange vif -->
      <path class="contour-fill" id="contour-progress-path" d="${milestone.pathD}" />
      <!-- Point coureur lumineux au bout du tracé -->
      <circle class="contour-runner-dot" id="contour-runner-dot" r="5" cx="0" cy="0" />
    `;

    // Calcul précis du stroke-dashoffset
    const path = document.getElementById('contour-progress-path') as SVGPathElement | null;
    const dot = document.getElementById('contour-runner-dot') as SVGCircleElement | null;

    if (path) {
      const length = path.getTotalLength ? path.getTotalLength() : 800;
      path.style.strokeDasharray = `${length}`;
      
      const offset = isDone ? 0 : length * (1 - pct / 100);
      path.style.strokeDashoffset = `${offset}`;

      // Positionner le point lumineux à la tête du tracé en cours
      if (dot && path.getPointAtLength) {
        if (isDone) {
          dot.style.display = 'none'; // Pas de point si la boucle est complètement fermée
        } else {
          dot.style.display = '';
          const currentPoint = path.getPointAtLength(length * (pct / 100));
          dot.setAttribute('cx', String(currentPoint.x));
          dot.setAttribute('cy', String(currentPoint.y));
        }
      }
    }
  }
}

/**
 * Met à jour la silhouette de montagne/monument et les stats du défi vertical actif
 */
function updateElevationStage(totalMeters: number, isFr: boolean): void {
  const milestone = ELEVATION_MILESTONES.find(m => m.id === selectedElevId) || ELEVATION_MILESTONES[0];
  const isDone = totalMeters >= milestone.altitudeMeters;
  const ratio = (totalMeters / milestone.altitudeMeters).toFixed(1);
  const pct = Math.min(100, Math.round((totalMeters / milestone.altitudeMeters) * 100));
  const remaining = Math.max(0, milestone.altitudeMeters - totalMeters);

  const titleEl = document.getElementById('equiv-elev-title');
  const subEl = document.getElementById('equiv-elev-sub');
  const pctEl = document.getElementById('equiv-elev-pct');
  const statusEl = document.getElementById('equiv-elev-status-pill');
  const climbedEl = document.getElementById('equiv-elev-climbed');
  const targetEl = document.getElementById('equiv-elev-target');
  const stat3Lbl = document.getElementById('equiv-elev-stat3-lbl');
  const stat3Val = document.getElementById('equiv-elev-stat3-val');

  if (titleEl) titleEl.textContent = isFr ? milestone.nameFr : milestone.nameEn;
  if (subEl) subEl.textContent = `${milestone.altitudeMeters.toLocaleString('fr-FR')} m D+ • ${isDone ? (isFr ? 'Sommet conquis' : 'Peak conquered') : (isFr ? 'En ascension' : 'Climbing')}`;
  
  if (pctEl) {
    pctEl.textContent = isDone ? (Number(ratio) > 1 ? `${ratio}x` : '100%') : `${pct}%`;
    pctEl.className = `equiv-stage-pct ${isDone ? 'completed' : ''}`;
  }

  if (statusEl) {
    if (isDone) {
      statusEl.className = 'equiv-status-pill done';
      statusEl.textContent = isFr ? '✓ Complété' : '✓ Completed';
    } else {
      statusEl.className = 'equiv-status-pill in-progress';
      statusEl.textContent = isFr ? `En cours (${pct}%)` : `In progress (${pct}%)`;
    }
  }

  if (climbedEl) climbedEl.textContent = `+${totalMeters.toLocaleString('fr-FR')} m`;
  if (targetEl) targetEl.textContent = `${milestone.altitudeMeters.toLocaleString('fr-FR')} m`;

  if (stat3Lbl && stat3Val) {
    if (isDone) {
      stat3Lbl.textContent = isFr ? 'Équivalence' : 'Equivalence';
      stat3Val.textContent = isFr ? `${ratio}x gravis` : `${ratio}x climbed`;
    } else {
      stat3Lbl.textContent = isFr ? 'Restant' : 'To go';
      stat3Val.textContent = `+${remaining.toLocaleString('fr-FR')} m`;
    }
  }

  // Rendu de la silhouette : remplie en orange quand complète, grise quand incomplète
  const svgEl = document.getElementById('equiv-mountain-svg');
  if (svgEl) {
    svgEl.setAttribute('viewBox', milestone.viewBox);
    const fillColor = isDone ? '#E05A36' : 'rgba(140, 146, 156, 0.22)';
    const strokeColor = isDone ? '#C84B2B' : 'rgba(140, 146, 156, 0.55)';

    svgEl.innerHTML = `
      <g class="mountain-silhouette ${isDone ? 'done' : 'incomplete'}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
        ${milestone.svgContent}
      </g>
    `;
  }
}
