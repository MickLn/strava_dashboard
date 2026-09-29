import { Chart, registerables } from 'chart.js';
import {
  calculateMonthlyElevationGain,
  calculatePaceTrend,
  calculateDistanceBreakdown,
  calculateDayFrequency
} from '../utils/metrics.ts';
import { Activity } from '../types/strava.ts';
import { i18n } from '../utils/i18n.ts';

Chart.register(...registerables);

// Instances de graphiques pour gestion du cycle de vie et destruction propre
let multiYearChart: Chart | null = null;
let elevationChart: Chart | null = null;
let paceTrendChart: Chart | null = null;
let distanceDistributionChart: Chart | null = null;
let dayFrequencyChart: Chart | null = null;

// Années sélectionnées pour le comparatif multi-années (par défaut 2 années récentes)
let selectedCompareYears: number[] = [2026, 2025];

// Palette monochrome élégante pour les années comparées (jusqu'à 3 années actives)
const YEAR_COLORS = [
  { color: '#E05A36', hover: '#C84B2B' }, // Orange Strava (Année principale)
  { color: '#64748B', hover: '#475569' }, // Slate Blue (Comparatif 1)
  { color: '#A8A29E', hover: '#78716C' }  // Warm Stone (Comparatif 2)
];

// Style commun pour les infobulles sur mesure
const customTooltipOptions = {
  backgroundColor: '#1C1E21',
  titleColor: '#FFFFFF',
  bodyColor: '#E2E8F0',
  titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' as const },
  bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
  padding: 10,
  cornerRadius: 8,
  borderColor: 'rgba(255, 255, 255, 0.08)',
  borderWidth: 1,
  boxPadding: 4,
  usePointStyle: true
};

export function renderCharts(activities: Activity[], year: number = 2026): void {
  if (!activities || activities.length === 0) return;
  const isFr = i18n.getLang() === 'fr';

  // 1. Graphique Volume mensuel (Comparatif interactif 2 ou 3 années sélectionnables)
  renderMultiYearChart(activities, isFr);

  // 2. Graphique Dénivelé Positif Mensuel (Monochrome sans dégradé)
  renderElevationChart(activities, year, isFr);

  // 3. Graphique Allure moyenne (Ligne pure sans surface dégradée)
  renderPaceChart(activities, isFr);

  // 4. Graphique Distribution par Typologie de Distance
  renderDistanceTypesChart(activities, isFr);

  // 5. Graphique Jours d'entraînement favoris (Fréquence hebdomadaire)
  renderDayFrequencyChartUI(activities, isFr);
}

/**
 * Calcule les km mensuels pour une année donnée
 */
function getYearMonthlyKm(activities: Activity[], targetYear: number): number[] {
  const km = new Array(12).fill(0);
  activities.forEach(act => {
    if (!act.start_date_local || !act.distance) return;
    const dt = new Date(act.start_date_local);
    if (dt.getFullYear() === targetYear) {
      const m = dt.getMonth();
      if (m >= 0 && m < 12) km[m] += act.distance / 1000;
    }
  });
  return km.map(v => Math.round(v * 10) / 10);
}

/**
 * 1. Volume mensuel (Comparatif interactif de 2 à 3 années)
 */
function renderMultiYearChart(activities: Activity[], isFr: boolean): void {
  const ctx = document.getElementById('chart-multiyear-comparison') as HTMLCanvasElement;
  if (!ctx) return;

  // Détection des années disponibles dans le dataset
  const yearsSet = new Set<number>();
  activities.forEach(act => {
    if (act.start_date_local) {
      const y = parseInt(act.start_date_local.substring(0, 4), 10);
      if (!isNaN(y) && y > 2000) yearsSet.add(y);
    }
  });
  const allAvailableYears = Array.from(yearsSet).sort((a, b) => b - a);

  // Pour ne pas encombrer l'écran si 10 ans de données, on limite les boutons aux 4 années les plus récentes
  const visiblePillYears = allAvailableYears.slice(0, 4);

  // S'assurer que les années sélectionnées sont valides
  if (selectedCompareYears.length === 0) {
    selectedCompareYears = allAvailableYears.slice(0, 2);
  }

  // Rendu de la barre de boutons/pilules de sélection d'années
  const selectorContainer = document.getElementById('year-compare-selector');
  if (selectorContainer) {
    selectorContainer.innerHTML = '';
    visiblePillYears.forEach(year => {
      const isSelected = selectedCompareYears.includes(year);
      const activeIdx = selectedCompareYears.indexOf(year);
      const dotColor = isSelected ? YEAR_COLORS[activeIdx % YEAR_COLORS.length].color : 'var(--border-medium)';

      const btn = document.createElement('button');
      btn.className = `year-compare-btn ${isSelected ? 'active' : ''}`;
      btn.setAttribute('type', 'button');
      btn.setAttribute('data-year', String(year));

      const label = year === 2026 ? (isFr ? '2026 (En cours)' : '2026 (Current)') : `${year}`;
      btn.innerHTML = `<span class="year-compare-dot" style="background-color: ${dotColor}"></span><span>${label}</span>`;

      btn.addEventListener('click', () => {
        if (selectedCompareYears.includes(year)) {
          // Si déjà sélectionnée, la retirer seulement s'il reste au moins 1 année
          if (selectedCompareYears.length > 1) {
            selectedCompareYears = selectedCompareYears.filter(y => y !== year);
          }
        } else {
          // Si pas sélectionnée, max 3 années comparables simultanément
          if (selectedCompareYears.length >= 3) {
            // Remplacer la plus ancienne sélectionnée
            selectedCompareYears = [selectedCompareYears[0], selectedCompareYears[1], year];
          } else {
            selectedCompareYears.push(year);
          }
          selectedCompareYears.sort((a, b) => b - a);
        }
        renderMultiYearChart(activities, isFr);
      });

      selectorContainer.appendChild(btn);
    });
  }

  if (multiYearChart) {
    multiYearChart.destroy();
    multiYearChart = null;
  }

  const monthsFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonthsFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const fullMonthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Construction des datasets selon les années sélectionnées
  const datasets: any[] = [];
  const yearDataMap = new Map<number, number[]>();

  selectedCompareYears.forEach((year, idx) => {
    const kmList = getYearMonthlyKm(activities, year);
    yearDataMap.set(year, kmList);
    const colorCfg = YEAR_COLORS[idx % YEAR_COLORS.length];
    const isCurrent = year === 2026;
    const yearLabel = isCurrent ? (isFr ? '2026 (En cours)' : '2026 (Current)') : `${year}`;

    datasets.push({
      label: yearLabel,
      data: kmList,
      backgroundColor: colorCfg.color,
      hoverBackgroundColor: colorCfg.hover,
      borderRadius: 4,
      borderSkipped: false,
      maxBarThickness: selectedCompareYears.length === 1 ? 24 : (selectedCompareYears.length === 2 ? 14 : 10)
    });
  });

  // Calculs des indicateurs du footer
  const primaryYear = selectedCompareYears[0];
  const primaryKmList = yearDataMap.get(primaryYear) || new Array(12).fill(0);
  const primaryTotal = Math.round(primaryKmList.reduce((acc, v) => acc + v, 0));

  let peakKm = 0;
  let peakIdx = 0;
  primaryKmList.forEach((v, idx) => {
    if (v > peakKm) {
      peakKm = v;
      peakIdx = idx;
    }
  });

  const badgeEl = document.getElementById('lbl-multiyear-badge');
  const totalEl = document.getElementById('val-multiyear-total');
  const totalLbl = document.getElementById('lbl-multiyear-stat-total');
  const compEl = document.getElementById('val-multiyear-comp');
  const compLbl = document.getElementById('lbl-multiyear-stat-comp');
  const peakEl = document.getElementById('val-multiyear-peak');
  const peakLbl = document.getElementById('lbl-multiyear-stat-peak');

  if (totalLbl) totalLbl.textContent = `${isFr ? 'Total' : 'Total'} ${primaryYear}`;
  if (totalEl) totalEl.textContent = `${primaryTotal.toLocaleString('fr-FR')} km`;
  if (peakLbl) peakLbl.textContent = isFr ? 'Pic mensuel' : 'Monthly peak';
  if (peakEl) peakEl.textContent = `${Math.round(peakKm)} km (${isFr ? fullMonthsFr[peakIdx] : fullMonthsEn[peakIdx]})`;

  if (selectedCompareYears.length >= 2) {
    const secondaryYear = selectedCompareYears[1];
    const secondaryKmList = yearDataMap.get(secondaryYear) || new Array(12).fill(0);

    let activeSum1 = 0;
    let activeSum2 = 0;
    primaryKmList.forEach((v, idx) => {
      if (v > 0) {
        activeSum1 += v;
        activeSum2 += secondaryKmList[idx];
      }
    });

    const pctComp = activeSum2 > 0 ? Math.round(((activeSum1 - activeSum2) / activeSum2) * 100) : 0;
    const sign = pctComp > 0 ? '+' : '';

    if (badgeEl) badgeEl.textContent = `${sign}${pctComp}% vs ${secondaryYear}`;
    if (compLbl) compLbl.textContent = `${isFr ? 'Progression vs' : 'Growth vs'} ${secondaryYear}`;
    if (compEl) compEl.textContent = `${sign}${pctComp}% (${isFr ? 'à date' : 'to date'})`;
  } else {
    if (badgeEl) badgeEl.textContent = `${primaryTotal.toLocaleString('fr-FR')} km en ${primaryYear}`;
    if (compLbl) compLbl.textContent = isFr ? 'Comparatif' : 'Comparison';
    if (compEl) compEl.textContent = `--`;
  }

  multiYearChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: isFr ? monthsFr : monthsEn,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          ...customTooltipOptions,
          callbacks: {
            label: (context) => {
              const val = context.parsed.y;
              if (val === 0) return ` ${context.dataset.label} : 0 km`;
              return ` ${context.dataset.label} : ${val} km`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#8C929C', font: { family: 'Plus Jakarta Sans', size: 10, weight: 'bold' } }
        },
        y: {
          grid: { color: 'rgba(35, 25, 15, 0.05)', strokeDash: [4, 4] } as any,
          ticks: {
            color: '#8C929C',
            font: { family: 'Plus Jakarta Sans', size: 10 },
            callback: (val) => `${val} km`
          },
          beginAtZero: true
        }
      }
    }
  });
}

/**
 * 2. Dénivelé Positif Mensuel (Simple & Épuré, couleur monochrome sans dégradé)
 */
function renderElevationChart(activities: Activity[], year: number, isFr: boolean): void {
  const ctx = document.getElementById('chart-monthly-elevation') as HTMLCanvasElement;
  if (!ctx) return;

  if (elevationChart) {
    elevationChart.destroy();
    elevationChart = null;
  }

  const data = calculateMonthlyElevationGain(activities, year);

  // Mise à jour des statistiques textuelles
  const badgeEl = document.getElementById('lbl-elevation-badge');
  const avgEl = document.getElementById('val-elev-avg');
  const peakEl = document.getElementById('val-elev-peak');
  const ratioEl = document.getElementById('val-elev-ratio');

  if (badgeEl) badgeEl.textContent = `+${data.totalElevation.toLocaleString('fr-FR')} m D+ en ${year}`;
  if (avgEl) avgEl.textContent = `${data.avgElevation.toLocaleString('fr-FR')} m / ${isFr ? 'mois' : 'mo'}`;
  if (peakEl) peakEl.textContent = `+${data.peakElevation.toLocaleString('fr-FR')} m (${isFr ? data.peakMonthFr : data.peakMonthEn})`;
  if (ratioEl) ratioEl.textContent = `${data.avgPerRun} m / ${isFr ? 'sortie' : 'run'}`;

  // Couleur monochrome solide pure (aucun dégradé)
  elevationChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: isFr ? data.labelsFr : data.labelsEn,
      datasets: [
        {
          label: isFr ? 'Dénivelé positif (m D+)' : 'Elevation gain (m D+)',
          data: data.elevation,
          backgroundColor: '#E05A36',
          hoverBackgroundColor: '#C84B2B',
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 28
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          ...customTooltipOptions,
          callbacks: {
            label: (context) => {
              const val = context.parsed.y ?? 0;
              return ` +${val.toLocaleString('fr-FR')} m D+ ${isFr ? 'courus' : 'climbed'}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#8C929C', font: { family: 'Plus Jakarta Sans', size: 10, weight: 'bold' } }
        },
        y: {
          grid: { color: 'rgba(35, 25, 15, 0.05)', strokeDash: [4, 4] } as any,
          ticks: {
            color: '#8C929C',
            font: { family: 'Plus Jakarta Sans', size: 10 },
            callback: (val) => `${val} m`
          },
          beginAtZero: true
        }
      }
    }
  });
}

/**
 * 3. Allure moyenne (Ligne épurée sans surface dégradée)
 */
function renderPaceChart(activities: Activity[], isFr: boolean): void {
  const ctx = document.getElementById('chart-pace-trend') as HTMLCanvasElement;
  if (!ctx) return;

  if (paceTrendChart) {
    paceTrendChart.destroy();
    paceTrendChart = null;
  }

  const data = calculatePaceTrend(activities, 12);

  // Mise à jour des indicateurs textuels
  const badgeEl = document.getElementById('lbl-pace-badge');
  const curEl = document.getElementById('val-pace-cur');
  const bestEl = document.getElementById('val-pace-best');
  const rangeEl = document.getElementById('val-pace-range');

  if (badgeEl) badgeEl.textContent = `${isFr ? 'Allure pic' : 'Peak pace'} : ${data.bestPaceFormatted} /km`;
  if (curEl) curEl.textContent = `${data.currentPaceFormatted} /km`;
  if (bestEl) bestEl.textContent = `${data.bestPaceFormatted} /km (${isFr ? data.bestMonthLabelFr : data.bestMonthLabelEn})`;
  if (rangeEl) rangeEl.textContent = `${data.paceRangeSeconds}s /km`;

  paceTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: isFr ? data.labelsFr : data.labelsEn,
      datasets: [
        {
          label: isFr ? 'Allure moyenne' : 'Average pace',
          data: data.paceSeconds,
          borderColor: '#E05A36',
          borderWidth: 3,
          fill: false, // Pas de fond orange-vers-blanc, rendu sobre et net
          tension: 0.35,
          pointBackgroundColor: '#E05A36',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          ...customTooltipOptions,
          callbacks: {
            label: (context) => {
              const idx = context.dataIndex;
              const paceStr = data.paceFormatted[idx];
              const km = data.kmList[idx];
              return ` ${paceStr} /km • ${km} km ${isFr ? 'courus ce mois' : 'run this month'}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#8C929C', font: { family: 'Plus Jakarta Sans', size: 10, weight: 'bold' } }
        },
        y: {
          // En course à pied, courir plus vite (ex: 5:20) est en haut
          reverse: true,
          grid: { color: 'rgba(35, 25, 15, 0.05)', strokeDash: [4, 4] } as any,
          ticks: {
            color: '#8C929C',
            font: { family: 'Plus Jakarta Sans', size: 10 },
            callback: (val) => {
              const sec = Number(val);
              const m = Math.floor(sec / 60);
              const s = Math.floor(sec % 60);
              return `${m}:${String(s).padStart(2, '0')} /km`;
            }
          }
        }
      }
    }
  });
}

/**
 * 4. Distribution par Typologie de Distance (< 6k, 6-12k, 12-18k, > 18k)
 */
function renderDistanceTypesChart(activities: Activity[], isFr: boolean): void {
  const ctx = document.getElementById('chart-distance-types') as HTMLCanvasElement;
  if (!ctx) return;

  if (distanceDistributionChart) {
    distanceDistributionChart.destroy();
    distanceDistributionChart = null;
  }

  const data = calculateDistanceBreakdown(activities);

  // Mise à jour de la liste de cartes / tuiles détaillées
  const breakdownWrap = document.getElementById('dist-types-breakdown');
  if (breakdownWrap) {
    const cats = [
      { name: isFr ? 'Courtes (< 6 km)' : 'Short (< 6 km)', count: data.shortCount, pct: data.shortPct, km: data.shortKm, color: '#F59E0B' },
      { name: isFr ? 'Moyennes (6 – 12 km)' : 'Mid (6 – 12 km)', count: data.midCount, pct: data.midPct, km: data.midKm, color: '#E05A36' },
      { name: isFr ? 'Longues (12 – 18 km)' : 'Long (12 – 18 km)', count: data.longCount, pct: data.longPct, km: data.longKm, color: '#8B5CF6' },
      { name: isFr ? 'Semi & XL (> 18 km)' : 'Half & XL (> 18 km)', count: data.xlCount, pct: data.xlPct, km: data.xlKm, color: '#10B981' }
    ];

    breakdownWrap.innerHTML = cats.map(c => `
      <div class="dist-type-card">
        <div class="dist-type-left">
          <span class="dist-type-dot" style="background-color: ${c.color};"></span>
          <span class="dist-type-name">${c.name}</span>
        </div>
        <div class="dist-type-right">
          <span class="dist-type-runs">${c.count}</span>
          <span class="dist-type-pct">(${c.pct}%)</span>
        </div>
      </div>
    `).join('');
  }

  const catLabels = isFr
    ? ['Courtes (< 6 km)', 'Moyennes (6-12 km)', 'Longues (12-18 km)', 'Semi & XL (+18 km)']
    : ['Short (< 6 km)', 'Mid (6-12 km)', 'Long (12-18 km)', 'Half & XL (> 18 km)'];

  distanceDistributionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: catLabels,
      datasets: [
        {
          label: isFr ? 'Nombre de séances' : 'Sessions count',
          data: [data.shortCount, data.midCount, data.longCount, data.xlCount],
          backgroundColor: ['#F59E0B', '#E05A36', '#8B5CF6', '#10B981'],
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 20
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...customTooltipOptions,
          callbacks: {
            label: (context) => {
              const idx = context.dataIndex;
              const counts = [data.shortCount, data.midCount, data.longCount, data.xlCount];
              const pcts = [data.shortPct, data.midPct, data.longPct, data.xlPct];
              const kms = [data.shortKm, data.midKm, data.longKm, data.xlKm];
              return ` ${counts[idx]} ${isFr ? 'sorties' : 'runs'} (${pcts[idx]}%) • ${kms[idx]} km`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(35, 25, 15, 0.05)', strokeDash: [4, 4] } as any,
          ticks: { color: '#8C929C', font: { family: 'Plus Jakarta Sans', size: 10 } },
          beginAtZero: true
        },
        y: {
          grid: { display: false },
          ticks: { color: '#1C1E21', font: { family: 'Plus Jakarta Sans', size: 10, weight: 'bold' } }
        }
      }
    }
  });
}

/**
 * 5. Jours d'entraînement favoris (Fréquence hebdomadaire Lun - Dim)
 */
function renderDayFrequencyChartUI(activities: Activity[], isFr: boolean): void {
  const ctx = document.getElementById('chart-day-frequency') as HTMLCanvasElement;
  if (!ctx) return;

  if (dayFrequencyChart) {
    dayFrequencyChart.destroy();
    dayFrequencyChart = null;
  }

  const data = calculateDayFrequency(activities);

  // Mise à jour des indicateurs textuels
  const badgeEl = document.getElementById('lbl-day-freq-badge');
  const topEl = document.getElementById('val-day-top');
  const splitEl = document.getElementById('val-day-split');
  const restEl = document.getElementById('val-day-rest');

  if (badgeEl) badgeEl.textContent = `${isFr ? data.peakDayFr : data.peakDayEn} n°1 (${data.peakCount} ${isFr ? 'sorties' : 'runs'})`;
  if (topEl) topEl.textContent = `${isFr ? data.peakDayFr : data.peakDayEn} (${data.peakCount} runs)`;
  if (splitEl) splitEl.textContent = `${data.weekdayPct}% / ${data.weekendPct}%`;
  if (restEl) restEl.textContent = `${isFr ? data.restDayFr : data.restDayEn} (${data.restCount} runs)`;

  // Mettre en valeur le jour de pic (Samedi) avec la couleur brand Terracotta
  const barColors = data.counts.map(c => (c === data.peakCount ? '#E05A36' : '#78716C'));
  const hoverColors = data.counts.map(c => (c === data.peakCount ? '#C84B2B' : '#57534E'));

  dayFrequencyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: isFr ? data.labelsFr : data.labelsEn,
      datasets: [
        {
          label: isFr ? 'Nombre de séances' : 'Number of runs',
          data: data.counts,
          backgroundColor: barColors,
          hoverBackgroundColor: hoverColors,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 32
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...customTooltipOptions,
          callbacks: {
            label: (context) => {
              const idx = context.dataIndex;
              const count = data.counts[idx];
              const pct = data.percentages[idx];
              return ` ${count} ${isFr ? 'séances courues' : 'sessions run'} (${pct}% ${isFr ? "du volume" : "of total"})`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#8C929C', font: { family: 'Plus Jakarta Sans', size: 10, weight: 'bold' } }
        },
        y: {
          grid: { color: 'rgba(35, 25, 15, 0.05)', strokeDash: [4, 4] } as any,
          ticks: {
            color: '#8C929C',
            font: { family: 'Plus Jakarta Sans', size: 10 },
            callback: (val) => `${val}`
          },
          beginAtZero: true
        }
      }
    }
  });
}
