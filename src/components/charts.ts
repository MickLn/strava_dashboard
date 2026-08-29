import { Chart, registerables } from 'chart.js';
import { calculateYtdMonthlyData } from '../utils/metrics.ts';
import { Activity } from '../types/strava.ts';

Chart.register(...registerables);

let ytdCumulativeChart: Chart | null = null;
let monthlyDistributionChart: Chart | null = null;

export function renderCharts(activities: Activity[], year: number = 2026) {
  const data = calculateYtdMonthlyData(activities, year);

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
            label: 'Distance Cumulée (km)',
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
              label: (context) => ` ${context.parsed.y} km cumulés`
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

  // 2. Graphique Distribution Mensuelle (Distance & Calories)
  const ctxDistribution = document.getElementById('chart-monthly-distribution') as HTMLCanvasElement;
  if (ctxDistribution) {
    if (monthlyDistributionChart) {
      monthlyDistributionChart.destroy();
    }

    monthlyDistributionChart = new Chart(ctxDistribution, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Distance (km)',
            data: data.distances,
            backgroundColor: '#E05A36',
            borderRadius: 4,
            yAxisID: 'y'
          },
          {
            label: 'Calories (kcal)',
            data: data.calories,
            backgroundColor: '#5C626C',
            borderRadius: 4,
            yAxisID: 'y1'
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
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              font: { family: 'Plus Jakarta Sans', size: 11, weight: 'bold' },
              color: '#5C626C'
            }
          },
          tooltip: {
            backgroundColor: '#1C1E21',
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#8C929C', font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: { color: '#EAE5DB' },
            ticks: { color: '#E05A36', font: { family: 'Plus Jakarta Sans', size: 11 }, callback: (v) => `${v} km` },
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#5C626C', font: { family: 'Plus Jakarta Sans', size: 11 }, callback: (v) => `${v}` },
            beginAtZero: true
          }
        }
      }
    });
  }
}
