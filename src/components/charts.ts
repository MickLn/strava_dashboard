import { Chart, registerables } from 'chart.js';
import { calculateYtdMonthlyData } from '../utils/metrics.ts';
import { Activity } from '../types/strava.ts';
import { i18n } from '../utils/i18n.ts';

Chart.register(...registerables);

let ytdCumulativeChart: Chart | null = null;
let monthlyVolumeChart: Chart | null = null;

export function renderCharts(activities: Activity[], year: number = 2026) {
  const data = calculateYtdMonthlyData(activities, year);
  const isFr = i18n.getLang() === 'fr';

  // 1. Graphique Évolution YTD Cumulée
  const ctxCumulative = document.getElementById('chart-ytd-cumulative') as HTMLCanvasElement;
  if (ctxCumulative) {
    if (ytdCumulativeChart) {
      ytdCumulativeChart.destroy();
    }

    ytdCumulativeChart = new Chart(ctxCumulative, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: isFr ? 'Distance Cumulée (km)' : 'Cumulative Distance (km)',
            data: data.cumulativeDistance,
            borderColor: '#E05A36',
            backgroundColor: 'rgba(224, 90, 54, 0.08)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#E05A36',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
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
            backgroundColor: '#1C1E21',
            titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
            bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => ` ${context.parsed.y} km ${isFr ? 'cumulés' : 'cumulative'}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#8C929C', font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          y: {
            grid: { color: '#EAE5DB' },
            ticks: {
              color: '#8C929C',
              font: { family: 'Plus Jakarta Sans', size: 11 },
              callback: (val) => `${val} km`
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  // 2. Graphique Bento Volume Mensuel (Kilométrage & Dénivelé)
  const ctxVolume = (document.getElementById('chart-monthly-volume') || document.getElementById('chart-monthly-distribution')) as HTMLCanvasElement;
  if (ctxVolume) {
    if (monthlyVolumeChart) {
      monthlyVolumeChart.destroy();
    }

    // Mise à jour de la bande de statistiques Bento sous le graphique
    const avgPill = document.getElementById('lbl-monthly-avg');
    const peakEl = document.getElementById('stat-val-peak');
    const avgRunsEl = document.getElementById('stat-val-avg-runs');
    const elevEl = document.getElementById('stat-val-elev');
    const activeEl = document.getElementById('stat-val-active');

    if (avgPill) avgPill.textContent = isFr ? `Moyenne : ${data.stats.avgDistanceKm} km / mois` : `Avg: ${data.stats.avgDistanceKm} km / mo`;
    if (peakEl) peakEl.textContent = `${data.stats.peakDistanceKm} km (${isFr ? data.stats.peakMonthNameFr : data.stats.peakMonthName})`;
    if (avgRunsEl) avgRunsEl.textContent = `${data.stats.avgRunsPerMonth} ${isFr ? 'sorties' : 'runs'}`;
    if (elevEl) elevEl.textContent = `+${data.stats.totalElevationYtd.toLocaleString('fr-FR')} m`;
    if (activeEl) activeEl.textContent = `${data.stats.activeMonthsCount} / 12 ${isFr ? 'mois' : 'mo'}`;

    monthlyVolumeChart = new Chart(ctxVolume, {
      type: 'bar',
      data: {
        labels: isFr ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'] : data.labels,
        datasets: [
          {
            label: isFr ? 'Volume mensuel (km)' : 'Monthly volume (km)',
            data: data.distances,
            backgroundColor: data.distances.map(d => d === data.stats.peakDistanceKm ? '#C84B2B' : '#E05A36'),
            hoverBackgroundColor: '#B83B19',
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 34
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
            backgroundColor: '#1C1E21',
            titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
            bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const idx = context.dataIndex;
                const km = data.distances[idx];
                const rCount = data.runs[idx];
                const dPlus = data.elevation[idx];
                return [
                  ` ${km} km ${isFr ? 'parcourus' : 'total'}`,
                  ` ${rCount} ${isFr ? 'séances de course' : 'run sessions'}`,
                  ` +${dPlus} m ${isFr ? 'dénivelé D+' : 'elevation gain'}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#8C929C', font: { family: 'Plus Jakarta Sans', size: 11, weight: 'bold' } }
          },
          y: {
            grid: { color: '#EAE5DB' },
            ticks: {
              color: '#8C929C',
              font: { family: 'Plus Jakarta Sans', size: 11 },
              callback: (val) => `${val} km`
            },
            beginAtZero: true
          }
        }
      }
    });
  }
}
