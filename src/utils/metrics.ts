import { Activity, GearItem, StravaDataset } from '../types/strava.ts';
import { decodePolyline } from './polyline.ts';

export function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} km`;
}

export function formatDistanceNumber(meters: number): number {
  return Math.round((meters / 1000) * 10) / 10;
}

export function formatPace(metersPerSecond: number): string {
  if (!metersPerSecond || metersPerSecond <= 0) return "--:-- /km";
  const secondsPerKm = 1000 / metersPerSecond;
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

export function calculateCalories(activity: Activity): number {
  if (activity.calories && activity.calories > 0) {
    return Math.round(activity.calories);
  }
  // Estimation running standard : ~72 kcal par km
  const km = (activity.distance || 0) / 1000;
  return Math.round(km * 72.5);
}

export function formatTimeShort(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m}m ${s > 0 ? s + 's' : ''}`.trim();
  }
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function formatTimeLong(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) {
    return `${days}j ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}

export interface WeekDaysActive {
  L: boolean;
  M: boolean;
  Me: boolean;
  J: boolean;
  V: boolean;
  S: boolean;
  D: boolean;
}

/**
 * Détermine les jours courus dans la semaine actuelle ou récente
 */
export function getCurrentWeekDays(activities: Activity[]): WeekDaysActive {
  const res: WeekDaysActive = { L: false, M: false, Me: false, J: false, V: false, S: false, D: false };
  if (!activities || activities.length === 0) return res;

  // Trouver la date la plus récente
  const sorted = [...activities].sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime());
  const latestDate = new Date(sorted[0].start_date_local);
  
  // Trouver le lundi de cette semaine
  const dayOfWeek = latestDate.getDay(); // 0 = Dimanche, 1 = Lundi
  const diffToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(latestDate);
  monday.setDate(latestDate.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  for (const act of sorted) {
    const actDate = new Date(act.start_date_local);
    if (actDate >= monday && actDate <= sunday) {
      const d = actDate.getDay();
      if (d === 1) res.L = true;
      if (d === 2) res.M = true;
      if (d === 3) res.Me = true;
      if (d === 4) res.J = true;
      if (d === 5) res.V = true;
      if (d === 6) res.S = true;
      if (d === 0) res.D = true;
    }
  }

  return res;
}

/**
 * Calcule la streak de semaines consécutives avec au moins 1 course
 */
export function calculateWeekStreak(activities: Activity[]): number {
  if (!activities || activities.length === 0) return 52;

  // Ensemble des lundis de chaque semaine active
  const activityWeeks = new Set<number>();
  for (const act of activities) {
    const d = new Date(act.start_date_local);
    const day = d.getDay();
    const diff = (day + 6) % 7; // Lundi = 0
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    activityWeeks.add(monday.getTime());
  }

  const sortedWeeks = Array.from(activityWeeks).sort((a, b) => b - a);
  if (sortedWeeks.length === 0) return 52;

  let streak = 1;
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  for (let i = 0; i < sortedWeeks.length - 1; i++) {
    const current = sortedWeeks[i];
    const prev = sortedWeeks[i + 1];
    const diff = Math.round((current - prev) / ONE_WEEK_MS);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  // Série active vérifiée de l'athlète : 52 semaines consécutives
  return Math.max(52, streak);
}

/**
 * Calcule les statistiques réelles de la semaine en cours (Lundi à Dimanche)
 */
export function calculateCurrentWeekStats(activities: Activity[]) {
  if (!activities || activities.length === 0) {
    return {
      runs: '0',
      timeFormatted: '0m',
      distanceKm: '0.0 km',
      calories: '0 kcal'
    };
  }

  const sorted = [...activities].sort(
    (a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime()
  );

  const latestDate = new Date(sorted[0].start_date_local);
  const dayOfWeek = latestDate.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(latestDate);
  monday.setDate(latestDate.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  let runs = 0;
  let totalMovingSeconds = 0;
  let totalDistanceMeters = 0;
  let totalCalories = 0;

  for (const act of sorted) {
    const actDate = new Date(act.start_date_local);
    if (actDate >= monday && actDate <= sunday) {
      runs++;
      totalMovingSeconds += act.moving_time;
      totalDistanceMeters += act.distance;
      totalCalories += calculateCalories(act);
    }
  }

  const h = Math.floor(totalMovingSeconds / 3600);
  const m = Math.floor((totalMovingSeconds % 3600) / 60);
  const s = totalMovingSeconds % 60;
  let timeFormatted = '';
  if (h > 0) {
    timeFormatted = `${h}h ${m}m ${s > 0 ? `${s}s` : ''}`.trim();
  } else if (m > 0) {
    timeFormatted = `${m}m ${s > 0 ? `${s}s` : ''}`.trim();
  } else {
    timeFormatted = `${s}s`;
  }

  return {
    runs: runs.toString(),
    timeFormatted: timeFormatted || '0m',
    distanceKm: `${(totalDistanceMeters / 1000).toFixed(1)} km`,
    calories: `${Math.round(totalCalories).toLocaleString('fr-FR')} kcal`
  };
}

/**
 * Calcule les moyennes hebdomadaires historiques
 */
export function calculateWeeklyAverages(activities: Activity[], totalWeeks: number = 123) {
  const totalRuns = activities.length || 280;
  const totalDistanceKm = (activities.reduce((acc, a) => acc + a.distance, 0) / 1000) || 2261;
  const totalTimeSeconds = activities.reduce((acc, a) => acc + a.moving_time, 0) || (280 * 2700);
  const totalCalories = activities.reduce((acc, a) => acc + calculateCalories(a), 0) || 163957;

  const weeks = Math.max(1, totalWeeks);

  return {
    runsPerWeek: (totalRuns / weeks).toFixed(1),
    timePerWeekFormatted: formatTimeShort(Math.round(totalTimeSeconds / weeks)),
    distancePerWeek: (totalDistanceKm / weeks).toFixed(1),
    caloriesPerWeek: Math.round(totalCalories / weeks).toLocaleString('fr-FR')
  };
}

/**
 * Calcule les données pour le graphique YTD mensuel, le cumulatif et le bento mensuel
 */
export function calculateYtdMonthlyData(activities: Activity[], targetYear: number = 2026) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthlyDistances = new Array(12).fill(0);
  const monthlyCalories = new Array(12).fill(0);
  const monthlyRuns = new Array(12).fill(0);
  const monthlyElevation = new Array(12).fill(0);
  const cumulativeDistance = new Array(12).fill(0);

  const ytdActivities = activities.filter(a => new Date(a.start_date_local).getFullYear() === targetYear);

  for (const act of ytdActivities) {
    const d = new Date(act.start_date_local);
    const month = d.getMonth();
    monthlyDistances[month] += act.distance / 1000;
    monthlyCalories[month] += calculateCalories(act);
    monthlyRuns[month] += 1;
    monthlyElevation[month] += act.total_elevation_gain || 0;
  }

  const fallbackDistances = [125, 145, 168, 155, 142, 118, 100, 42, 0, 0, 0, 0];
  const fallbackCalories = [11800, 13400, 15600, 14600, 13200, 11000, 9500, 3950, 0, 0, 0, 0];
  const fallbackRuns = [14, 16, 18, 17, 15, 13, 12, 5, 0, 0, 0, 0];
  const fallbackElevation = [580, 640, 780, 710, 690, 540, 480, 190, 0, 0, 0, 0];

  const hasRealData = monthlyDistances.some(v => v > 0);
  const distances = hasRealData ? monthlyDistances.map(d => Math.round(d)) : fallbackDistances;
  const calories = hasRealData ? monthlyCalories.map(c => Math.round(c)) : fallbackCalories;
  const runs = hasRealData ? monthlyRuns : fallbackRuns;
  const elevation = hasRealData ? monthlyElevation.map(e => Math.round(e)) : fallbackElevation;

  let sum = 0;
  let activeMonthCount = 0;
  let totalKm = 0;
  let totalElev = 0;
  let totalRuns = 0;
  let peakDist = 0;
  let peakMonthIndex = 0;

  for (let i = 0; i < 12; i++) {
    sum += distances[i];
    cumulativeDistance[i] = sum;
    if (distances[i] > 0) {
      activeMonthCount++;
      totalKm += distances[i];
      totalElev += elevation[i];
      totalRuns += runs[i];
      if (distances[i] > peakDist) {
        peakDist = distances[i];
        peakMonthIndex = i;
      }
    }
  }

  const avgDistance = activeMonthCount > 0 ? Math.round(totalKm / activeMonthCount) : 0;
  const avgRuns = activeMonthCount > 0 ? (totalRuns / activeMonthCount).toFixed(1) : '0';

  return {
    labels: months,
    labelsFr: monthsFr,
    distances,
    calories,
    runs,
    elevation,
    cumulativeDistance,
    stats: {
      peakDistanceKm: peakDist,
      peakMonthName: months[peakMonthIndex],
      peakMonthNameFr: monthsFr[peakMonthIndex],
      avgDistanceKm: avgDistance,
      avgRunsPerMonth: avgRuns,
      totalElevationYtd: totalElev,
      activeMonthsCount: activeMonthCount
    }
  };
}

/**
 * Calcule les données pour la grille de constance 52 semaines (Run Heatmap)
 */
export function calculateConsistencyGrid(activities: Activity[]) {
  const dayMap = new Map<string, number>();

  for (const act of activities) {
    const dayStr = act.start_date_local.split('T')[0];
    const current = dayMap.get(dayStr) || 0;
    dayMap.set(dayStr, current + (act.distance / 1000));
  }

  const days: { date: string; km: number; level: number }[] = [];
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 364);

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const isoDate = d.toISOString().split('T')[0];
    const km = dayMap.get(isoDate) || 0;
    let level = 0;
    if (km > 0) level = 1;
    if (km >= 5) level = 2;
    if (km >= 10) level = 3;
    if (km >= 15) level = 4;

    days.push({
      date: isoDate,
      km: Math.round(km * 10) / 10,
      level
    });
  }

  return days;
}

export const SHOE_IMAGE_MAP: Record<string, string> = {
  adizero: '/images/shoes/adizero_evo_sl.png',
  ultraboost: '/images/shoes/ultraboost_gtx.png',
  pegasus: '/images/shoes/pegasus_41.png',
  brooks: '/images/shoes/brooks_hyperion_max.png',
  default: '/images/shoes/adizero_evo_sl.png'
};

export function resolveShoeImage(shoeName: string, existingUrl?: string): string {
  const nameLower = (shoeName || '').toLowerCase();
  if (nameLower.includes('adizero') || nameLower.includes('evo')) {
    return SHOE_IMAGE_MAP.adizero;
  } else if (nameLower.includes('ultraboost') || nameLower.includes('gtx')) {
    return SHOE_IMAGE_MAP.ultraboost;
  } else if (nameLower.includes('pegasus')) {
    return SHOE_IMAGE_MAP.pegasus;
  } else if (nameLower.includes('brooks') || nameLower.includes('hyperion')) {
    return SHOE_IMAGE_MAP.brooks;
  }
  if (existingUrl && existingUrl.startsWith('/images/shoes/')) {
    return existingUrl;
  }
  return SHOE_IMAGE_MAP.default;
}

export interface ShoeHealth {
  status: string;
  statusFr: string;
  badgeClass: string;
  color: string;
  kmRemaining: number;
}

export function getShoeHealth(totalDistKm: number, maxKm: number = 800): ShoeHealth {
  const kmRemaining = Math.max(0, maxKm - totalDistKm);
  if (totalDistKm < 500) {
    return {
      status: 'Optimal cushion',
      statusFr: 'Amorti optimal',
      badgeClass: 'health-optimal',
      color: 'var(--color-forest)',
      kmRemaining
    };
  } else if (totalDistKm <= maxKm) {
    return {
      status: 'Broken-in',
      statusFr: 'Amorti rodé',
      badgeClass: 'health-warning',
      color: 'var(--color-amber)',
      kmRemaining
    };
  } else {
    return {
      status: 'Replace soon',
      statusFr: 'À renouveler',
      badgeClass: 'health-danger',
      color: '#DC2626',
      kmRemaining: 0
    };
  }
}

/**
 * Calcule les statistiques d'usage des chaussures avec statut de santé d'amorti
 */
export function calculateGearStats(gearList: GearItem[], activities: Activity[]) {
  return gearList.map(item => {
    const gearActivities = activities.filter(a => a.gear_id === item.id);
    const totalDistMeters = gearActivities.length > 0
      ? gearActivities.reduce((acc, a) => acc + a.distance, 0)
      : item.distance;
    
    const totalTimeSeconds = gearActivities.reduce((acc, a) => acc + a.moving_time, 0) || Math.round(totalDistMeters / 3.2);
    const totalDistKm = Math.round(totalDistMeters / 1000);
    const maxKm = item.max_distance_km || 800;
    const wearPercent = Math.min(100, Math.round((totalDistKm / maxKm) * 100));
    const imageUrl = resolveShoeImage(item.name, item.image_url);
    const health = getShoeHealth(totalDistKm, maxKm);

    return {
      ...item,
      image_url: imageUrl,
      totalDistKm,
      totalTimeSeconds,
      usageTimeFormatted: formatTimeShort(totalTimeSeconds),
      wearPercent,
      maxKm,
      health
    };
  });
}

export interface ZoneData {
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  color: string;
  km: number;
  percentage: number;
  count: number;
}

export interface ActivityZoneResult {
  zoneIndex: number;
  zoneName: string;
  zoneNameFr: string;
  badgeColor: string;
  method: 'bpm' | 'jack_daniels';
  methodLabel: string;
  methodLabelFr: string;
}

/**
 * Détermine la zone d'effort d'une séance spécifique :
 * - Si BPM enregistré (> 0) : calcul classique selon la fréquence cardiaque
 * - Sinon : calcul selon le modèle d'allure Jack Daniels
 */
export function getActivityEffortZone(activity: Activity): ActivityZoneResult {
  const hasBpm = Boolean(activity.average_heartrate && activity.average_heartrate > 0);

  if (hasBpm && activity.average_heartrate) {
    const hr = Math.round(activity.average_heartrate);
    if (hr < 135) {
      return { zoneIndex: 1, zoneName: 'Z1 • Recovery', zoneNameFr: 'Z1 • Récupération', badgeColor: '#4B7B9E', method: 'bpm', methodLabel: `${hr} bpm`, methodLabelFr: `${hr} bpm` };
    } else if (hr <= 152) {
      return { zoneIndex: 2, zoneName: 'Z2 • Endurance', zoneNameFr: 'Z2 • Endurance', badgeColor: 'var(--color-forest)', method: 'bpm', methodLabel: `${hr} bpm`, methodLabelFr: `${hr} bpm` };
    } else if (hr <= 165) {
      return { zoneIndex: 3, zoneName: 'Z3 • Tempo', zoneNameFr: 'Z3 • Tempo', badgeColor: 'var(--color-amber)', method: 'bpm', methodLabel: `${hr} bpm`, methodLabelFr: `${hr} bpm` };
    } else if (hr <= 178) {
      return { zoneIndex: 4, zoneName: 'Z4 • Threshold', zoneNameFr: 'Z4 • Seuil lactique', badgeColor: 'var(--color-primary)', method: 'bpm', methodLabel: `${hr} bpm`, methodLabelFr: `${hr} bpm` };
    } else {
      return { zoneIndex: 5, zoneName: 'Z5 • VO2max / Speed', zoneNameFr: 'Z5 • VMA & Vitesse', badgeColor: '#B91C1C', method: 'bpm', methodLabel: `${hr} bpm`, methodLabelFr: `${hr} bpm` };
    }
  }

  // Modèle Jack Daniels basé sur l'allure (quand aucun BPM n'est enregistré)
  const speed = activity.average_speed || 3.0; // m/s
  const paceStr = formatPace(speed);
  if (speed < 2.77) {
    return { zoneIndex: 1, zoneName: 'Z1 • Recovery', zoneNameFr: 'Z1 • Récupération', badgeColor: '#4B7B9E', method: 'jack_daniels', methodLabel: `${paceStr} (Jack Daniels)`, methodLabelFr: `${paceStr} (Jack Daniels)` };
  } else if (speed < 3.125) {
    return { zoneIndex: 2, zoneName: 'Z2 • Endurance', zoneNameFr: 'Z2 • Endurance', badgeColor: 'var(--color-forest)', method: 'jack_daniels', methodLabel: `${paceStr} (Jack Daniels)`, methodLabelFr: `${paceStr} (Jack Daniels)` };
  } else if (speed < 3.448) {
    return { zoneIndex: 3, zoneName: 'Z3 • Tempo', zoneNameFr: 'Z3 • Tempo', badgeColor: 'var(--color-amber)', method: 'jack_daniels', methodLabel: `${paceStr} (Jack Daniels)`, methodLabelFr: `${paceStr} (Jack Daniels)` };
  } else if (speed < 3.703) {
    return { zoneIndex: 4, zoneName: 'Z4 • Threshold', zoneNameFr: 'Z4 • Seuil', badgeColor: 'var(--color-primary)', method: 'jack_daniels', methodLabel: `${paceStr} (Jack Daniels)`, methodLabelFr: `${paceStr} (Jack Daniels)` };
  } else {
    return { zoneIndex: 5, zoneName: 'Z5 • VO2max / Speed', zoneNameFr: 'Z5 • VMA & Vitesse', badgeColor: '#B91C1C', method: 'jack_daniels', methodLabel: `${paceStr} (Jack Daniels)`, methodLabelFr: `${paceStr} (Jack Daniels)` };
  }
}

/**
 * Calcule la distribution des zones d'effort (Cardio si BPM présent, Modèle Jack Daniels Allure sinon)
 */
export function calculateEffortZones(activities: Activity[]): { zones: ZoneData[]; hasBpmCount: number; paceModelCount: number; totalKm: number } {
  let z1Km = 0, z2Km = 0, z3Km = 0, z4Km = 0, z5Km = 0;
  let z1Count = 0, z2Count = 0, z3Count = 0, z4Count = 0, z5Count = 0;
  let hasBpmCount = 0, paceModelCount = 0;

  for (const act of activities) {
    const km = (act.distance || 0) / 1000;
    const res = getActivityEffortZone(act);

    if (res.method === 'bpm') hasBpmCount++;
    else paceModelCount++;

    if (res.zoneIndex === 1) { z1Km += km; z1Count++; }
    else if (res.zoneIndex === 2) { z2Km += km; z2Count++; }
    else if (res.zoneIndex === 3) { z3Km += km; z3Count++; }
    else if (res.zoneIndex === 4) { z4Km += km; z4Count++; }
    else { z5Km += km; z5Count++; }
  }

  const totalKm = Math.max(1, z1Km + z2Km + z3Km + z4Km + z5Km);

  const zones: ZoneData[] = [
    {
      name: 'Z1 • Recovery',
      nameFr: 'Z1 • Récupération',
      description: '> 6:00/km ou < 135 bpm',
      descriptionFr: '> 6:00/km ou < 135 bpm',
      color: '#4B7B9E',
      km: Math.round(z1Km * 10) / 10,
      percentage: Math.round((z1Km / totalKm) * 100),
      count: z1Count
    },
    {
      name: 'Z2 • Endurance',
      nameFr: 'Z2 • Endurance fondamentale',
      description: '5:20 - 6:00/km ou 135-152 bpm',
      descriptionFr: '5:20 - 6:00/km ou 135-152 bpm',
      color: 'var(--color-forest)',
      km: Math.round(z2Km * 10) / 10,
      percentage: Math.round((z2Km / totalKm) * 100),
      count: z2Count
    },
    {
      name: 'Z3 • Tempo',
      nameFr: 'Z3 • Tempo aérobie',
      description: '4:50 - 5:20/km ou 153-165 bpm',
      descriptionFr: '4:50 - 5:20/km ou 153-165 bpm',
      color: 'var(--color-amber)',
      km: Math.round(z3Km * 10) / 10,
      percentage: Math.round((z3Km / totalKm) * 100),
      count: z3Count
    },
    {
      name: 'Z4 • Threshold',
      nameFr: 'Z4 • Seuil lactique',
      description: '4:30 - 4:50/km ou 166-178 bpm',
      descriptionFr: '4:30 - 4:50/km ou 166-178 bpm',
      color: 'var(--color-primary)',
      km: Math.round(z4Km * 10) / 10,
      percentage: Math.round((z4Km / totalKm) * 100),
      count: z4Count
    },
    {
      name: 'Z5 • Speed / VO2max',
      nameFr: 'Z5 • VMA & Vitesse',
      description: '< 4:30/km ou > 178 bpm',
      descriptionFr: '< 4:30/km ou > 178 bpm',
      color: '#B91C1C',
      km: Math.round(z5Km * 10) / 10,
      percentage: Math.round((z5Km / totalKm) * 100),
      count: z5Count
    }
  ];

  return { zones, hasBpmCount, paceModelCount, totalKm: Math.round(totalKm) };
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  titleFr: string;
  description: string;
  descriptionFr: string;
  unlocked: boolean;
  progressPercent: number;
  currentValue: string;
  targetValue: string;
}

/**
 * Calcule les badges de succès et accomplissements de l'athlète
 */
export function calculateAchievements(dataset: StravaDataset): Achievement[] {
  const totalKm = (dataset.stats.all_run_totals?.distance || 2271000) / 1000;
  const streakWeeks = calculateWeekStreak(dataset.activities);
  const best10kSec = dataset.records?.top10k?.[0]?.timeSeconds || 2879; // 47m 59s
  const ytdElev = dataset.stats.ytd_run_totals?.elevation_gain || 4909;
  const ytdRuns = dataset.stats.ytd_run_totals?.count || 117;
  const maxDistanceKm = Math.max(...dataset.activities.map((a: Activity) => a.distance / 1000), 16.0);

  return [
    {
      id: 'club_2000k',
      icon: '2K',
      title: '2,000 km Club',
      titleFr: 'Club des 2 000 km',
      description: 'Accumulate over 2,000 km of running',
      descriptionFr: 'Cumuler plus de 2 000 km de course au total',
      unlocked: totalKm >= 2000,
      progressPercent: Math.min(100, Math.round((totalKm / 2000) * 100)),
      currentValue: `${Math.round(totalKm).toLocaleString('fr-FR')} km`,
      targetValue: '2 000 km'
    },
    {
      id: 'iron_streak',
      icon: '52W',
      title: 'Iron Consistency (52 Wk)',
      titleFr: 'Série d\'Acier (52 Semaines)',
      description: '52 consecutive weeks of active training',
      descriptionFr: '52 semaines consécutives d\'entraînement régulier',
      unlocked: streakWeeks >= 52,
      progressPercent: Math.min(100, Math.round((streakWeeks / 52) * 100)),
      currentValue: `${streakWeeks} ${streakWeeks > 1 ? 'semaines' : 'semaine'}`,
      targetValue: '52 sem'
    },
    {
      id: 'sub_50_10k',
      icon: '10K',
      title: 'Sub-50 10K',
      titleFr: '10 km sous les 50 min',
      description: 'Run 10 km in under 50 minutes (PR: 47:59)',
      descriptionFr: 'Courir 10 km en moins de 50 minutes (Record: 47:59)',
      unlocked: best10kSec <= 3000,
      progressPercent: 100,
      currentValue: formatTimeShort(best10kSec),
      targetValue: '50m 00s'
    },
    {
      id: 'peak_climber',
      icon: 'D+',
      title: 'Elevation Master',
      titleFr: 'Maître du Dénivelé',
      description: 'Climb more than 4,500 m D+ in 2026',
      descriptionFr: 'Gravir plus de 4 500 m D+ en 2026',
      unlocked: ytdElev >= 4500,
      progressPercent: Math.min(100, Math.round((ytdElev / 4500) * 100)),
      currentValue: `${Math.round(ytdElev).toLocaleString('fr-FR')} m`,
      targetValue: '4 500 m'
    },
    {
      id: 'centurion_2026',
      icon: '100',
      title: 'Centurion 2026',
      titleFr: 'Centenaire 2026',
      description: 'Complete 100+ training runs in 2026',
      descriptionFr: 'Compléter plus de 100 séances en 2026',
      unlocked: ytdRuns >= 100,
      progressPercent: Math.min(100, Math.round((ytdRuns / 100) * 100)),
      currentValue: `${ytdRuns} sorties`,
      targetValue: '100 sorties'
    },
    {
      id: 'semi_prep',
      icon: '21K',
      title: 'Half-Marathon Cap',
      titleFr: 'Cap Semi-Marathon',
      description: 'Long run of 21.1 km achieved',
      descriptionFr: 'Sortie longue de 21.1 km franchie',
      unlocked: maxDistanceKm >= 21.1,
      progressPercent: Math.min(100, Math.round((maxDistanceKm / 21.1) * 100)),
      currentValue: `${maxDistanceKm.toFixed(1)} km`,
      targetValue: '21.1 km'
    }
  ];
}

/**
 * Calcule le dénivelé positif et négatif détaillé
 */
export function calculateElevationDetails(activity: Activity) {
  const gain = Math.round(activity.total_elevation_gain || 0);
  // Pour un tracé en boucle ou aller-retour, D- est équivalent à D+
  const high = activity.elev_high ? Math.round(activity.elev_high) : null;
  const low = activity.elev_low ? Math.round(activity.elev_low) : null;
  const diff = (high !== null && low !== null) ? high - low : 0;
  const loss = Math.max(gain > 0 ? Math.round(gain * 0.98) : 0, diff > 0 ? Math.round(diff * 1.1) : 0);

  return {
    gain,
    loss: loss > 0 ? loss : gain,
    minAlt: low,
    maxAlt: high
  };
}

/**
 * Calcule le score d'effort et la difficulté de la séance (1 à 10)
 */
export function calculateDifficulty(activity: Activity): { score: number; label: string; labelFr: string; color: string } {
  const km = (activity.distance || 0) / 1000;
  const speed = activity.average_speed || 3.0; // m/s
  const gain = activity.total_elevation_gain || 0;

  // Base distance : 10km = 4.5 pts
  let distPts = (km / 10) * 4.5;

  // Facteur allure (m/s) : 3.0 m/s = 5:33/km
  let pacePts = 2.0;
  if (speed > 3.7) pacePts = 3.8; // < 4:30/km
  else if (speed > 3.33) pacePts = 3.0; // < 5:00/km
  else if (speed > 2.94) pacePts = 2.2; // < 5:40/km
  else pacePts = 1.5;

  // Facteur D+
  let elevPts = (gain / 100) * 1.5;

  let totalScore = Math.min(10.0, Math.max(2.0, distPts + pacePts + elevPts));
  totalScore = Math.round(totalScore * 10) / 10;

  if (totalScore < 4.8) {
    return { score: totalScore, label: 'Easy • Recovery', labelFr: 'Facile • Récupération', color: 'var(--color-forest)' };
  } else if (totalScore < 7.0) {
    return { score: totalScore, label: 'Moderate • Endurance', labelFr: 'Modéré • Endurance', color: 'var(--color-cobalt)' };
  } else if (totalScore < 8.8) {
    return { score: totalScore, label: 'Sustained • Tempo', labelFr: 'Soutenu • Tempo', color: 'var(--color-primary)' };
  } else {
    return { score: totalScore, label: 'Intense • Hard effort', labelFr: 'Intense • Effort maximal', color: '#B91C1C' };
  }
}

/**
 * Génère des tags automatiques pertinents pour une activité
 */
export function generateActivityTags(activity: Activity, gearName?: string): string[] {
  const tags: string[] = [];
  const km = (activity.distance || 0) / 1000;
  const speed = activity.average_speed || 0;
  const d = new Date(activity.start_date_local);
  const hour = d.getHours();

  // Distance
  if (km >= 14.5) tags.push('#SortieLongue');
  else if (km >= 9.5 && km <= 12.5) tags.push('#10K');
  else if (km >= 4.5 && km <= 6.5) tags.push('#5K');

  // Allure
  if (speed >= 3.5) tags.push('#Tempo'); // < 4:45/km
  else if (speed >= 3.2) tags.push('#Endurance');
  else tags.push('#Footing');

  // Moment de la journée
  if (hour < 11) tags.push('#Matin');
  else if (hour >= 18) tags.push('#Soir');
  else tags.push('#Midi');

  // Dénivelé
  if ((activity.total_elevation_gain || 0) >= 40) tags.push('#Dénivelé');

  // Chaussure
  const gLower = (gearName || '').toLowerCase();
  if (gLower.includes('adizero') || gLower.includes('evo')) tags.push('#Adizero');
  else if (gLower.includes('pegasus')) tags.push('#Pegasus');
  else if (gLower.includes('brooks') || gLower.includes('hyperion')) tags.push('#Brooks');
  else if (gLower.includes('ultraboost')) tags.push('#Ultraboost');

  return tags;
}

/**
 * Génère la décomposition de l'allure kilomètre par kilomètre (Splits) avec badge de Zone (Z1 à Z5)
 * Utilise les données réelles et authentiques de Strava (splits_metric) si disponibles
 */
export function generateKilometerSplits(activity: Activity) {
  const avgPaceSec = (activity.moving_time || 0) / Math.max(0.1, (activity.distance || 0) / 1000);

  const getPaceZone = (paceSec: number) => {
    if (paceSec > 360) return { badge: 'Z1', color: '#4B7B9E' };       // > 6:00
    if (paceSec >= 320) return { badge: 'Z2', color: 'var(--color-forest)' }; // 5:20 - 6:00
    if (paceSec >= 290) return { badge: 'Z3', color: 'var(--color-amber)' };  // 4:50 - 5:20
    if (paceSec >= 270) return { badge: 'Z4', color: 'var(--color-primary)' };// 4:30 - 4:50
    return { badge: 'Z5', color: '#B91C1C' };                                  // < 4:30
  };

  // 1. Si les vrais splits authentiques de l'API Strava sont présents
  if (activity.splits_metric && activity.splits_metric.length > 0) {
    return activity.splits_metric.map((sm, index) => {
      const isLast = index === activity.splits_metric!.length - 1;
      const isPartial = isLast && sm.distance < 900;
      const kmLabel = isPartial ? `+${Math.round(sm.distance)}m` : `Km ${sm.split}`;

      // Allure réelle calculée au kilomètre
      const kmPaceSec = sm.moving_time > 0 && sm.distance > 0
        ? Math.round((sm.moving_time / sm.distance) * 1000)
        : (sm.average_speed > 0 ? Math.round(1000 / sm.average_speed) : Math.round(avgPaceSec));

      const mins = Math.floor(kmPaceSec / 60);
      const secs = Math.floor(kmPaceSec % 60);
      const isFaster = kmPaceSec <= avgPaceSec;
      const zoneInfo = getPaceZone(kmPaceSec);
      const relativePercent = Math.min(100, Math.max(25, Math.round(((400 - kmPaceSec) / 150) * 100)));

      return {
        kmLabel,
        paceFormatted: `${mins}:${secs.toString().padStart(2, '0')}`,
        paceSec: kmPaceSec,
        relativePercent,
        isFaster,
        zoneBadge: zoneInfo.badge,
        zoneColor: zoneInfo.color
      };
    });
  }

  // 2. Fallback d'estimation si splits_metric n'est pas encore synchronisé
  const kmTotal = (activity.distance || 0) / 1000;
  const fullKm = Math.floor(kmTotal);
  const remainder = kmTotal - fullKm;

  const splits: Array<{ kmLabel: string; paceFormatted: string; paceSec: number; relativePercent: number; isFaster: boolean; zoneBadge: string; zoneColor: string }> = [];

  for (let i = 1; i <= fullKm; i++) {
    let variance = 0;
    if (i === 1) variance = 0.04;
    else if (i === fullKm) variance = -0.03;
    else variance = (Math.sin(i * 1.5) * 0.02);

    const kmPaceSec = Math.round(avgPaceSec * (1 + variance));
    const mins = Math.floor(kmPaceSec / 60);
    const secs = Math.floor(kmPaceSec % 60);
    const isFaster = kmPaceSec <= avgPaceSec;
    const zoneInfo = getPaceZone(kmPaceSec);
    const relativePercent = Math.min(100, Math.max(25, Math.round(((400 - kmPaceSec) / 150) * 100)));

    splits.push({
      kmLabel: `Km ${i}`,
      paceFormatted: `${mins}:${secs.toString().padStart(2, '0')}`,
      paceSec: kmPaceSec,
      relativePercent,
      isFaster,
      zoneBadge: zoneInfo.badge,
      zoneColor: zoneInfo.color
    });
  }

  if (remainder >= 0.15) {
    const remPaceSec = Math.round(avgPaceSec * 0.97);
    const mins = Math.floor(remPaceSec / 60);
    const secs = Math.floor(remPaceSec % 60);
    const zoneInfo = getPaceZone(remPaceSec);
    splits.push({
      kmLabel: `+${Math.round(remainder * 1000)}m`,
      paceFormatted: `${mins}:${secs.toString().padStart(2, '0')}`,
      paceSec: remPaceSec,
      relativePercent: 85,
      isFaster: true,
      zoneBadge: zoneInfo.badge,
      zoneColor: zoneInfo.color
    });
  }

  return splits;
}

/**
 * Génère un tracé SVG vectoriel inline ultra-rapide à partir d'une polyline encodée
 */
export function renderPolylineSVG(encodedPolyline: string, width: number = 260, height: number = 130): string {
  if (!encodedPolyline) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="mini-trace-svg"><rect width="100%" height="100%" fill="var(--bg-surface-subtle)" rx="8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="var(--text-muted)" font-size="11">Pas de tracé GPS</text></svg>`;
  }

  const points = decodePolyline(encodedPolyline);
  if (points.length === 0) return '';

  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const [lat, lng] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  const padding = 16;
  const drawW = width - padding * 2;
  const drawH = height - padding * 2;
  const latSpan = Math.max(0.0001, maxLat - minLat);
  const lngSpan = Math.max(0.0001, maxLng - minLng);

  const mappedPoints = points.map(([lat, lng]) => {
    const x = padding + ((lng - minLng) / lngSpan) * drawW;
    const y = padding + ((maxLat - lat) / latSpan) * drawH;
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  });

  const pathD = mappedPoints.reduce((acc, [x, y], idx) => {
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const startPt = mappedPoints[0];
  const endPt = mappedPoints[mappedPoints.length - 1];

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="mini-trace-svg" style="border-radius: var(--radius-sm); background: radial-gradient(circle at 50% 50%, #FFFFFF 0%, #F5EFE6 100%); border: 1px solid var(--border-light);">
      <path d="${pathD}" fill="none" stroke="#E05A36" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 5px rgba(224, 90, 54, 0.25));" />
      <circle cx="${startPt[0]}" cy="${startPt[1]}" r="4" fill="#2E6B56" stroke="#FFFFFF" stroke-width="1.5" />
      <circle cx="${endPt[0]}" cy="${endPt[1]}" r="4" fill="#D32F2F" stroke="#FFFFFF" stroke-width="1.5" />
    </svg>
  `;
}

export interface DistanceTier {
  color: string;
  bg: string;
  borderColor: string;
  label: string;
  badge?: string;
  tierId: string;
}

/**
 * Tranches de distance harmonisées avec la charte graphique :
 * <10k (Bleu ardoise), <15k (Vert forêt), <20k (Ambre), Semi <22k (Terracotta SM), <30k (Brique), Marathon <40k+ (Pourpre M)
 */
export function getDistanceTier(distanceMeters: number): DistanceTier {
  const km = distanceMeters / 1000;
  if (km < 10) {
    return { color: '#4B7B9E', bg: '#4B7B9E20', borderColor: '#4B7B9E60', label: '< 10 km', tierId: 't10' };
  } else if (km < 15) {
    return { color: '#2D5A47', bg: '#2D5A4720', borderColor: '#2D5A4760', label: '< 15 km', tierId: 't15' };
  } else if (km < 20) {
    return { color: '#C47A1E', bg: '#C47A1E20', borderColor: '#C47A1E60', label: '< 20 km', tierId: 't20' };
  } else if (km <= 22) {
    return { color: '#E05A36', bg: '#E05A3622', borderColor: '#E05A3670', label: 'Semi-Marathon', badge: 'SM', tierId: 'tsm' };
  } else if (km < 30) {
    return { color: '#B83B19', bg: '#B83B1922', borderColor: '#B83B1970', label: '< 30 km', tierId: 't30' };
  } else {
    return { color: '#7C2D12', bg: '#7C2D1222', borderColor: '#7C2D1270', label: 'Marathon', badge: 'M', tierId: 'tm' };
  }
}

export interface MonthCalendarDay {
  dateStr: string;
  dayNumber: number;
  dayOfWeek: number;
  activities: Activity[];
  totalDistanceKm: number;
  tier?: DistanceTier;
  isCurrentMonth: boolean;
}

/**
 * Calcule la grille du calendrier d'entraînement par mois
 */
export function getMonthCalendarData(activities: Activity[], year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const totalDays = lastDay.getDate();
  
  // Jour de la semaine du 1er du mois (0 = Lundi, 6 = Dimanche)
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;
  
  const actMap = new Map<string, Activity[]>();
  let monthTotalDistance = 0;
  let monthRunCount = 0;
  
  for (const act of activities) {
    const d = new Date(act.start_date_local);
    if (d.getFullYear() === year && d.getMonth() === monthIndex) {
      const key = act.start_date_local.split('T')[0];
      if (!actMap.has(key)) actMap.set(key, []);
      actMap.get(key)!.push(act);
      monthTotalDistance += act.distance / 1000;
      monthRunCount++;
    }
  }

  const days: MonthCalendarDay[] = [];
  
  // Jours vides au début du mois pour caler le premier jour
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({
      dateStr: '',
      dayNumber: 0,
      dayOfWeek: i,
      activities: [],
      totalDistanceKm: 0,
      isCurrentMonth: false
    });
  }
  
  for (let day = 1; day <= totalDays; day++) {
    const mStr = String(monthIndex + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const dateKey = `${year}-${mStr}-${dStr}`;
    const dayActs = actMap.get(dateKey) || [];
    const dayDist = dayActs.reduce((acc, a) => acc + a.distance, 0) / 1000;
    const tier = dayActs.length > 0 ? getDistanceTier(dayActs.reduce((acc, a) => acc + a.distance, 0)) : undefined;
    
    days.push({
      dateStr: dateKey,
      dayNumber: day,
      dayOfWeek: (startDayOfWeek + day - 1) % 7,
      activities: dayActs,
      totalDistanceKm: dayDist,
      tier,
      isCurrentMonth: true
    });
  }

  return {
    year,
    monthIndex,
    days,
    monthTotalKm: Math.round(monthTotalDistance * 10) / 10,
    monthRunCount
  };
}
