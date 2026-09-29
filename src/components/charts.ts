import { Chart, registerables } from 'chart.js';
import {
  calculateMultiYearMonthlyComparison,
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

  // 1. Graphique Comparatif Multi-Années (Km par mois & %)
  renderMultiYearChart(activities, isFr);

  // 2. Graphique Dénivelé Positif Mensuel (Simple & Épuré)
  renderElevationChart(activities, year, isFr);

  // 3. Graphique Évolution de l'allure moyenne dans le temps
  renderPaceChart(activities, isFr);

  // 4. Graphique Distribution par Typologie de Distance
  renderDistanceTypesChart(activities, isFr);

  // 5. Graphique Jours d'entraînement favoris (Fréquence hebdomadaire)
  renderDayFrequencyChartUI(activities, isFr);
}

/**
 * 1. Comparatif Multi-Années (2026 vs 2025 vs 2024 avec pourcentages)
 */
function renderMultiYearChart(activities: Activity[], isFr: boolean): void {
  const ctx = document.getElementById('chart-multiyear-comparison') as HTMLCanvasElement;
  if (!ctx) return;

  if (multiYearChart) {
    multiYearChart.destroy();
    multiYearChart = null;
  }

  const data = calculateMultiYearMonthlyComparison(activities);

  // Mise à jour des badges & compteurs textuels
  const badgeEl = document.getElementById('lbl-multiyear-badge');
  const totalEl = document.getElementById('val-multiyear-total');
  const compEl = document.getElementById('val-multiyear-comp');
  const peakEl = document.getElementById('val-multiyear-peak');

  if (badgeEl) badgeEl.textContent = `+${data.compToDatePct}% vs 2025`;
  if (totalEl) totalEl.textContent = `${data.total2026Km.toLocaleString('fr-FR')} km`;
  if (compEl) compEl.textContent = `+${data.compToDatePct}% (${isFr ? 'à date' : 'to date'})`;
  if (peakEl) peakEl.textContent = `${data.peak2026Km} km (${isFr ? data.peak2026MonthFr : data.peak2026MonthEn})`;

  multiYearChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: isFr ? data.labelsFr : data.labelsEn,
      datasets: [
        {
          label: isFr ? '2026 (En cours)' : '2026 (Current)',
          data: data.km2026,
          backgroundColor: '#E05A36',
          hoverBackgroundColor: '#C84B2B',
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 12
        },
        {
          label: '2025',
          data: data.km2025,
          backgroundColor: '#64748B',
          hoverBackgroundColor: '#475569',
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 12
        },
        {
          label: '2024',
          data: data.km2024,
          backgroundColor: '#D4CEBF',
          hoverBackgroundColor: '#C2BBA8',
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 12
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
              const datasetIdx = context.datasetIndex;
              const monthIdx = context.dataIndex;
              const val = context.parsed.y;
              if (val === 0) return ` ${context.dataset.label} : 0 km`;

              if (datasetIdx === 0) {
                // 2026 : ajouter la variation % vs 2025
                const pct = data.pctChange2026vs2025[monthIdx];
                const pctStr = pct !== null ? ` (${pct > 0 ? '+' : ''}${pct}% vs 2025)` : '';
                return ` 2026 : ${val} km${pctStr}`;
              }
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
 * 2. Dénivelé Positif Mensuel (Simple & Épuré)
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

  // Dégradé vertical pour un rendu haut de gamme
  let barGradient: string | CanvasGradient = '#E05A36';
  const ctx2d = ctx.getContext('2d');
  if (ctx2d) {
    const g = ctx2d.createLinearGradient(0, 0, 0, 220);
    g.addColorStop(0, '#E05A36');
    g.addColorStop(1, 'rgba(224, 90, 54, 0.45)');
    barGradient = g;
  }

  elevationChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: isFr ? data.labelsFr : data.labelsEn,
      datasets: [
        {
          label: isFr ? 'Dénivelé positif (m D+)' : 'Elevation gain (m D+)',
          data: data.elevation,
          backgroundColor: barGradient,
          hoverBackgroundColor: '#B83B19',
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
 * 3. Évolution de l'allure moyenne dans le temps (axe inversé car plus rapide = chiffre plus petit)
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

  // Dégradé pour la surface sous la courbe
  let areaGradient: string | CanvasGradient = 'rgba(224, 90, 54, 0.12)';
  const ctx2d = ctx.getContext('2d');
  if (ctx2d) {
    const g = ctx2d.createLinearGradient(0, 0, 0, 220);
    g.addColorStop(0, 'rgba(224, 90, 54, 0.22)');
    g.addColorStop(1, 'rgba(224, 90, 54, 0.00)');
    areaGradient = g;
  }

  paceTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: isFr ? data.labelsFr : data.labelsEn,
      datasets: [
        {
          label: isFr ? 'Allure moyenne' : 'Average pace',
          data: data.paceSeconds,
          borderColor: '#E05A36',
          backgroundColor: areaGradient,
          borderWidth: 3,
          fill: true,
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
          // En course à pied, courir plus vite (ex: 5:20) doit être EN HAUT du graphique
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
