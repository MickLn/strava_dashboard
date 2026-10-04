import L from 'leaflet';
import { StravaDataset, Activity, RecordItem } from '../types/strava.ts';
import { decodePolyline } from '../utils/polyline.ts';
import {
  formatDistance,
  formatPace,
  formatTimeShort,
  formatDate,
  getCurrentWeekActivities,
  calculateWeekStreak,
  calculateCurrentWeekStats,
  calculateGearStats,
  calculateShoeDetails,
  calculateCalories,
  calculateElevationDetails,
  calculateDifficulty,
  calculateEffortZones,
  getActivityEffortZone,
  calculateAchievements,
  generateActivityTags,
  generateKilometerSplits,
  getMonthCalendarData,
  calculateAnnualCalendarMatrix,
  AnnualCalendarDay,
  getActivityDateKey
} from '../utils/metrics.ts';
import { i18n } from '../utils/i18n.ts';

export class UIRenderer {
  public static activeAchievementCat: string = 'all';
  public static activeAchievementStatus: string = 'all';
  private static activeShoeIndex: number = 0;
  private static miniMapInstances: Map<number, L.Map> = new Map();
  private static modalMapInstance: L.Map | null = null;

  /**
   * Met à jour tous les libellés statiques selon la langue choisie (EN / FR)
   */
  public static updateStaticLabels(): void {
    const t = i18n.t();
    const setTxt = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setTxt('lbl-live-badge', t.stravaConnected);
    setTxt('tab-all', t.allTime);
    setTxt('tab-ytd', t.ytd);
    setTxt('tab-30d', t.days30);
    setTxt('lbl-force-refresh', t.forceRefresh);

    setTxt('lbl-latest-badge', t.latestRunBadge);
    setTxt('lbl-btn-heatmap', t.fullscreenHeatmapBtn);
    setTxt('lbl-full-details', t.fullDetailsBtn);
    setTxt('lbl-metric-dist', t.distance);
    setTxt('lbl-metric-time', t.time);
    setTxt('lbl-metric-pace', t.pace);
    setTxt('lbl-metric-cal', t.energy);

    setTxt('lbl-pulse-title', t.weeklyPulseTitle);
    setTxt('lbl-weekly-title', t.weeklyPulseTitle);
    setTxt('lbl-streak-text', t.consecutiveWeeks);
    setTxt('lbl-active-days', t.activeDaysThisWeek);
    setTxt('lbl-day-1', t.mon);
    setTxt('lbl-day-2', t.tue);
    setTxt('lbl-day-3', t.wed);
    setTxt('lbl-day-4', t.thu);
    setTxt('lbl-day-5', t.fri);
    setTxt('lbl-day-6', t.sat);
    setTxt('lbl-day-7', t.sun);
    setTxt('lbl-avg-runs', t.runsPerWeek);
    setTxt('lbl-avg-time', t.timePerWeek);
    setTxt('lbl-avg-dist', t.distPerWeek);
    setTxt('lbl-avg-cal', t.calPerWeek);

    setTxt('lbl-records-title', t.recordsTitle);
    setTxt('lbl-records-sub', t.recordsSubtitle);
    setTxt('lbl-top-5k', t.top5k);
    setTxt('lbl-top-10k', t.top10k);
    setTxt('lbl-top-15k', t.top15k);

    setTxt('lbl-career-stats-title', t.careerStatsTitle);
    setTxt('lbl-career-alltime-title', t.careerAllTimeTitle);
    setTxt('lbl-career-alltime-period', t.careerAllTimePeriod);
    setTxt('lbl-stat-dist-all', t.careerStatDist);
    setTxt('lbl-stat-runs-all', t.careerStatRuns);
    setTxt('lbl-unit-runs-all', t.careerUnitRuns);
    setTxt('lbl-stat-time-all', t.careerStatTime);
    setTxt('lbl-stat-elev-all', t.careerStatElev);

    setTxt('lbl-career-ytd-title', t.careerYtdTitle);
    setTxt('lbl-stat-dist-ytd', t.careerStatDistYtd);
    setTxt('lbl-stat-runs-ytd', t.careerStatRunsYtd);
    setTxt('lbl-unit-runs-ytd', t.careerUnitRuns);
    setTxt('lbl-stat-time-ytd', t.careerStatTimeYtd);
    setTxt('lbl-stat-elev-ytd', t.careerStatElevYtd);

    setTxt('lbl-annual-calendar-title', t.annualCalendarTitle);
    setTxt('lbl-annual-calendar-sub', t.annualCalendarSubtitle);
    setTxt('lbl-annual-legend', t.annualLegendLabel);
    setTxt('lbl-annual-legend-0', t.annualLegend0);
    setTxt('lbl-annual-legend-1', t.annualLegend1);
    setTxt('lbl-annual-legend-2', t.annualLegend2);
    setTxt('lbl-annual-legend-3', t.annualLegend3);
    setTxt('lbl-annual-legend-4', t.annualLegend4);

    setTxt('lbl-annual-legend-0-m', t.annualLegend0);
    setTxt('lbl-annual-legend-1-m', t.annualLegend1);
    setTxt('lbl-annual-legend-2-m', t.annualLegend2);
    setTxt('lbl-annual-legend-3-m', t.annualLegend3);
    setTxt('lbl-annual-legend-4-m', t.annualLegend4);

    setTxt('lbl-shoe-title', t.shoeLockerTitle);
    setTxt('lbl-shoe-time', t.cushioningTime);
    setTxt('lbl-shoe-wear', t.wear);
    setTxt('lbl-btn-next-shoe', t.nextShoeBtn);
    setTxt('lbl-shoe-records-title', t.shoeRecordsTitle);
    setTxt('lbl-shoe-records-sub', t.shoeRecordsSubtitle);
    setTxt('lbl-shoe-stat-runs', t.shoeTotalRuns);
    setTxt('lbl-shoe-stat-pace', t.shoeAvgPace);
    setTxt('lbl-shoe-stat-elev', t.shoeTotalElevation);
    setTxt('lbl-shoe-history-title', t.shoeHistoryTitle);

    const shoeSearchInput = document.getElementById('shoe-activity-search') as HTMLInputElement;
    if (shoeSearchInput) shoeSearchInput.placeholder = t.shoeHistorySearch;

    // Analytics & Charts (Volume, D+, Allure, Habitudes)
    setTxt('lbl-multiyear-title', t.chartMultiyearTitle);
    setTxt('lbl-multiyear-stat-total', t.chartMultiyearStatTotal);
    setTxt('lbl-multiyear-stat-comp', t.chartMultiyearStatComp);
    setTxt('lbl-multiyear-stat-peak', t.chartMultiyearStatPeak);

    setTxt('lbl-elevation-title', t.chartElevationTitle);
    setTxt('lbl-elev-stat-avg', t.chartElevationAvg);
    setTxt('lbl-elev-stat-peak', t.chartElevationPeak);
    setTxt('lbl-elev-stat-ratio', t.chartElevationRatio);

    setTxt('lbl-pace-title', t.chartPaceTitle);
    setTxt('lbl-pace-stat-cur', t.chartPaceCurrent);
    setTxt('lbl-pace-stat-best', t.chartPaceBest);
    setTxt('lbl-pace-stat-range', t.chartPaceRange);

    setTxt('lbl-habits-section-title', t.chartHabitsSectionTitle);

    setTxt('lbl-dist-types-title', t.chartDistTypesTitle);
    setTxt('lbl-dist-types-badge', t.chartDistTypesBadge);

    setTxt('lbl-day-freq-title', t.chartDayFreqTitle);
    setTxt('lbl-day-stat-top', t.chartDayStatTop);
    setTxt('lbl-day-stat-split', t.chartDayStatSplit);
    setTxt('lbl-day-stat-rest', t.chartDayStatRest);

    setTxt('lbl-calendar-title', t.calendarTitle);
    setTxt('lbl-cal-legend-btn', t.legendBtn);
    setTxt('lbl-leg-10', t.legendLess10);
    setTxt('lbl-leg-15', t.legendLess15);
    setTxt('lbl-leg-20', t.legendLess20);
    setTxt('lbl-leg-sm', t.legendSemi);
    setTxt('lbl-leg-30', t.legendLess30);
    setTxt('lbl-leg-m', t.legendMarathon);

    const weekdaysRow = document.getElementById('calendar-weekdays-row');
    if (weekdaysRow) {
      weekdaysRow.innerHTML = t.daysHeader.map(d => `<span>${d}</span>`).join('');
    }

    setTxt('lbl-effort-zones-title', t.effortZonesTitle);
    setTxt('lbl-effort-zones-sub', t.effortZonesSubtitle);
    setTxt('lbl-achievements-title', t.achievementsTitle);
    setTxt('lbl-achievements-sub', t.achievementsSubtitle);
    setTxt('lbl-tier-bronze', t.tierBronze);
    setTxt('lbl-tier-silver', t.tierSilver);
    setTxt('lbl-tier-gold', t.tierGold);
    setTxt('lbl-tier-diamond', t.tierDiamond);
    setTxt('tab-cat-all', t.catAll);
    setTxt('tab-cat-speed', t.catSpeed);
    setTxt('tab-cat-distance', t.catDistance);
    setTxt('tab-cat-training', t.catTraining);
    setTxt('tab-cat-streak', t.catStreak);
    setTxt('tab-cat-lifestyle', t.catLifestyle);
    setTxt('tab-cat-gear', t.catGear);
    setTxt('tab-status-all', t.achFilterAll);
    setTxt('tab-status-unlocked', t.achFilterUnlocked);
    setTxt('tab-status-locked', t.achFilterLocked);
    
    const closeHeatmapBtnEl = document.getElementById('btn-close-heatmap');
    if (closeHeatmapBtnEl) {
      closeHeatmapBtnEl.setAttribute('aria-label', t.closeHeatmapBtn);
      closeHeatmapBtnEl.setAttribute('title', `${t.closeHeatmapBtn} (Échap)`);
    }

    setTxt('lbl-atlas-btn-all', t.atlasAllTracks);
    setTxt('lbl-atlas-btn-latest', t.atlasLatestTrack);

    setTxt('lbl-activities-title', t.recentActivitiesTitle);
    setTxt('lbl-activities-sub', t.recentActivitiesSubtitle);

    const searchInput = document.getElementById('activity-search-input') as HTMLInputElement;
    if (searchInput) searchInput.placeholder = t.searchPlaceholder;

    setTxt('chip-all', t.filterAll);
    setTxt('chip-long', t.filterLong);
    setTxt('chip-fast', t.filterFast);
    setTxt('chip-elev', t.filterElevation);

    setTxt('lbl-modal-dist', t.distance);
    setTxt('lbl-modal-time', t.time);
    setTxt('lbl-modal-pace', t.avgPace);
    setTxt('lbl-modal-cal', t.energy);
    setTxt('lbl-modal-elev', t.elevation);
    setTxt('lbl-modal-hr', t.heartRate);
    setTxt('lbl-modal-gear', t.shoesUsed);

    setTxt('lbl-footer-1', `🏃 ${t.footerTitle}`);
    setTxt('lbl-footer-2', t.footerSubtitle);

    // Mettre à jour l'état actif des boutons et conteneurs de langue
    const lang = i18n.getLang();
    document.querySelectorAll('.lang-btn').forEach(btn => {
      if (btn.getAttribute('data-lang') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    document.querySelectorAll<HTMLElement>('.lang-switcher').forEach(switcher => {
      switcher.setAttribute('data-active', lang);
    });
  }

  /**
   * Rendu de l'en-tête et du profil athlète
   */
  public static renderHeader(dataset: StravaDataset): void {
    const athlete = dataset.athlete;
    const navAvatarEl = document.getElementById('navbar-athlete-avatar') as HTMLImageElement;
    const navNameEl = document.getElementById('navbar-athlete-name');
    const modalAvatarEl = document.getElementById('modal-profile-avatar') as HTMLImageElement;
    const modalNameEl = document.getElementById('modal-profile-name');
    const modalLocationEl = document.getElementById('modal-profile-location');
    const lastSyncEl = document.getElementById('last-sync-time');

    const fullName = `${athlete.firstname} ${athlete.lastname}`;
    const shortName = `${athlete.firstname} ${athlete.lastname ? athlete.lastname.charAt(0) + '.' : ''}`;

    if (navAvatarEl && athlete.profile) {
      navAvatarEl.src = athlete.profile;
      navAvatarEl.alt = fullName;
    }
    if (navNameEl) navNameEl.textContent = shortName;

    if (modalAvatarEl && athlete.profile) {
      modalAvatarEl.src = athlete.profile;
      modalAvatarEl.alt = fullName;
    }
    if (modalNameEl) modalNameEl.textContent = fullName;
    if (modalLocationEl) modalLocationEl.textContent = `${athlete.city || 'Paris'}, ${athlete.country || 'France'}`;

    if (lastSyncEl && dataset.last_updated) {
      const syncDate = new Date(dataset.last_updated);
      lastSyncEl.textContent = `${syncDate.toLocaleDateString(i18n.getLang() === 'fr' ? 'fr-FR' : 'en-US')} ${syncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    this.updateStaticLabels();
  }

  /**
   * Rendu de la Dernière Sortie en Vedette (Étage 1 Gauche)
   */
  public static renderFeaturedLatestRun(activities: Activity[], onOpenDetails: (act: Activity) => void, dataset?: StravaDataset): void {
    if (!activities || activities.length === 0) return;
    const sorted = [...activities].sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime());
    const latest = sorted[0];

    // 1. Desktop Featured Card
    const titleEl = document.getElementById('featured-run-title');
    const dateEl = document.getElementById('featured-run-date');
    const distEl = document.getElementById('featured-dist');
    const timeEl = document.getElementById('featured-time');
    const paceEl = document.getElementById('featured-pace');
    const calEl = document.getElementById('featured-cal');
    const detailsBtn = document.getElementById('btn-featured-details');

    const cal = calculateCalories(latest);

    if (titleEl) titleEl.textContent = latest.name;
    if (dateEl) dateEl.textContent = `${formatDate(latest.start_date_local)} • ${latest.timezone?.split('/')[1] || 'Paris'}`;
    if (distEl) distEl.textContent = formatDistance(latest.distance);
    if (timeEl) timeEl.textContent = formatTimeShort(latest.moving_time);
    if (paceEl) paceEl.textContent = formatPace(latest.average_speed);
    if (calEl) calEl.textContent = `${cal} kcal`;

    if (detailsBtn) {
      detailsBtn.onclick = () => onOpenDetails(latest);
    }

    // 2. Mobile Full Details Panel (Direct Mobile Replacement as requested)
    const isFr = i18n.getLang() === 'fr';
    const t = i18n.t();
    const gearItem = dataset?.gear?.find(g => g.id === latest.gear_id);
    const gearName = gearItem ? gearItem.name : (isFr ? 'Chaussures de running' : 'Running shoes');
    const elev = calculateElevationDetails(latest);
    const diff = calculateDifficulty(latest);
    const zoneRes = getActivityEffortZone(latest);
    const tags = generateActivityTags(latest, gearName);
    const splits = generateKilometerSplits(latest);

    // Profile & Header
    const mAvatarEl = document.getElementById('mobile-runner-avatar') as HTMLImageElement | null;
    const mNameEl = document.getElementById('mobile-runner-name');
    const mDateLocEl = document.getElementById('mobile-run-date-loc');
    const mTitleEl = document.getElementById('mobile-run-title');
    const mDescEl = document.getElementById('mobile-run-desc');
    const mTagsEl = document.getElementById('mobile-run-tags');
    const mPeekTitleEl = document.getElementById('mobile-peek-title');
    const mPeekDistEl = document.getElementById('mobile-peek-dist');

    if (mAvatarEl) {
      mAvatarEl.src = dataset?.athlete?.profile_medium || dataset?.athlete?.profile || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
    }
    if (mNameEl) {
      mNameEl.textContent = dataset?.athlete ? `${dataset.athlete.firstname} ${dataset.athlete.lastname}` : 'Mickaël Lin';
    }
    if (mDateLocEl) {
      mDateLocEl.textContent = `${formatDate(latest.start_date_local)} • ${gearName}`;
    }
    if (mTitleEl) mTitleEl.textContent = latest.name;
    if (mPeekTitleEl) mPeekTitleEl.textContent = latest.name;
    if (mPeekDistEl) mPeekDistEl.textContent = formatDistance(latest.distance);

    if (mDescEl) {
      if (latest.description && latest.description.trim()) {
        mDescEl.textContent = latest.description;
        mDescEl.style.display = 'block';
      } else {
        mDescEl.style.display = 'none';
      }
    }

    if (mTagsEl) {
      mTagsEl.innerHTML = tags.map(tag => `<span class="act-tag-badge">${tag}</span>`).join('');
    }

    // 4 Key Metrics
    const mDistEl = document.getElementById('mobile-detail-dist');
    const mTimeEl = document.getElementById('mobile-detail-time');
    const mPaceEl = document.getElementById('mobile-detail-pace');
    const mCalEl = document.getElementById('mobile-detail-cal');

    if (mDistEl) mDistEl.textContent = `${(latest.distance / 1000).toFixed(2)} km`;
    if (mTimeEl) mTimeEl.textContent = formatTimeShort(latest.moving_time);
    if (mPaceEl) mPaceEl.textContent = formatPace(latest.average_speed);
    if (mCalEl) mCalEl.textContent = `${cal} kcal`;

    // Bento Telemetry
    const mElevEl = document.getElementById('mobile-detail-elev');
    const mAltEl = document.getElementById('mobile-detail-alt');
    const mHrEl = document.getElementById('mobile-detail-hr');
    const mHrMaxEl = document.getElementById('mobile-detail-hrmax');
    const mDeviceEl = document.getElementById('mobile-detail-device');
    const mEffortEl = document.getElementById('mobile-detail-effort');
    const mZoneEl = document.getElementById('mobile-detail-zone');

    if (mElevEl) mElevEl.innerHTML = `+${elev.gain}m <span class="text-forest" style="margin-left: 3px;">-${elev.loss}m</span>`;
    if (mAltEl) mAltEl.textContent = (elev.minAlt !== null && elev.maxAlt !== null) ? `${elev.minAlt}m - ${elev.maxAlt}m alt` : '';

    if (mHrEl) mHrEl.textContent = latest.average_heartrate ? `${latest.average_heartrate} bpm` : t.notRecorded;
    if (mHrMaxEl) mHrMaxEl.textContent = latest.max_heartrate ? `max ${latest.max_heartrate} bpm` : '';

    if (mDeviceEl) mDeviceEl.textContent = latest.device_name || 'Strava App';

    if (mEffortEl) {
      mEffortEl.textContent = `${diff.score}/10 • ${isFr ? diff.labelFr : diff.label}`;
      mEffortEl.style.color = diff.color;
      mEffortEl.style.borderColor = `${diff.color}50`;
      mEffortEl.style.backgroundColor = `${diff.color}15`;
    }

    if (mZoneEl) {
      mZoneEl.textContent = `${isFr ? zoneRes.zoneNameFr : zoneRes.zoneName} (${isFr ? zoneRes.methodLabelFr : zoneRes.methodLabel})`;
      mZoneEl.style.color = zoneRes.badgeColor;
      mZoneEl.style.borderColor = `${zoneRes.badgeColor}50`;
      mZoneEl.style.backgroundColor = `${zoneRes.badgeColor}18`;
    }

    // Splits
    const mSplitsContainer = document.getElementById('mobile-splits-list');
    if (mSplitsContainer) {
      mSplitsContainer.innerHTML = splits.map(s => {
        const zoneClass = s.zoneBadge.toLowerCase();
        return `
          <div class="split-row">
            <span class="split-km">${s.kmLabel}</span>
            <div class="split-bar-track">
              <div class="split-bar-fill ${s.isFaster ? 'fast' : ''}" style="width: ${s.relativePercent}%;"></div>
            </div>
            <span class="split-pace">${s.paceFormatted}</span>
            <span class="split-zone-badge ${zoneClass}">${s.zoneBadge}</span>
          </div>
        `;
      }).join('');
    }
  }

  /**
   * Rendu de l'activité de la semaine en cours
   */
  public static renderWeeklyPulse(dataset: StravaDataset): void {
    const activities = dataset.activities;
    const t = i18n.t();
    const streakCount = calculateWeekStreak(activities).toString();

    // 0. Streak de semaines actives (Desktop card, Mobile sticky header, et Bottom sheet)
    const streakEl = document.getElementById('hero-streak-count');
    const stickyStreakEl = document.getElementById('sticky-streak-count');
    const sheetStreakEl = document.getElementById('sheet-streak-count');
    const lblStreakText = document.getElementById('lbl-streak-text');
    const stickyStreakText = document.getElementById('sticky-streak-text');
    const sheetStreakText = document.getElementById('sheet-streak-text');

    if (streakEl) streakEl.textContent = streakCount;
    if (stickyStreakEl) stickyStreakEl.textContent = streakCount;
    if (sheetStreakEl) sheetStreakEl.textContent = streakCount;
    if (lblStreakText) lblStreakText.textContent = t.consecutiveWeeks;
    if (stickyStreakText) stickyStreakText.textContent = t.consecutiveWeeks;
    if (sheetStreakText) sheetStreakText.textContent = t.consecutiveWeeks;

    // 1. Jours actifs cette semaine (Lundi à Dimanche)
    const weekActs = getCurrentWeekActivities(activities);
    const dayElements: Record<keyof typeof weekActs, HTMLElement | null> = {
      L: document.getElementById('day-l'),
      M: document.getElementById('day-m'),
      Me: document.getElementById('day-me'),
      J: document.getElementById('day-j'),
      V: document.getElementById('day-v'),
      S: document.getElementById('day-s'),
      D: document.getElementById('day-d')
    };

    const stickyDayElements: Record<keyof typeof weekActs, HTMLElement | null> = {
      L: document.getElementById('sticky-day-l'),
      M: document.getElementById('sticky-day-m'),
      Me: document.getElementById('sticky-day-me'),
      J: document.getElementById('sticky-day-j'),
      V: document.getElementById('sticky-day-v'),
      S: document.getElementById('sticky-day-s'),
      D: document.getElementById('sticky-day-d')
    };

    (Object.keys(dayElements) as Array<keyof typeof weekActs>).forEach(k => {
      const el = dayElements[k];
      const stickyEl = stickyDayElements[k];
      const act = weekActs[k];
      const isActive = !!act;

      if (el) {
        el.classList.toggle('active', isActive);
        if (isActive && act) {
          el.style.cursor = 'pointer';
          el.title = `${act.name} (${(act.distance / 1000).toFixed(1)} km)`;
          el.onclick = (e) => {
            e.stopPropagation();
            UIRenderer.openActivityModal(act, dataset);
          };
        } else {
          el.style.cursor = 'default';
          el.title = '';
          el.onclick = null;
        }
      }

      if (stickyEl) {
        stickyEl.classList.toggle('active', isActive);
        if (isActive && act) {
          stickyEl.style.cursor = 'pointer';
          stickyEl.title = `${act.name} (${(act.distance / 1000).toFixed(1)} km)`;
          stickyEl.onclick = (e) => {
            e.stopPropagation();
            UIRenderer.openActivityModal(act, dataset);
          };
        } else {
          stickyEl.style.cursor = 'default';
          stickyEl.title = '';
          stickyEl.onclick = null;
        }
      }
    });

    // Libellés des jours (Desktop & Mobile)
    const dayLabels = [t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun];
    dayLabels.forEach((label, idx) => {
      const dayLbl = document.getElementById(`lbl-day-${idx + 1}`);
      const stickyDayLbl = document.getElementById(`sticky-lbl-day-${idx + 1}`);
      if (dayLbl) dayLbl.textContent = label;
      if (stickyDayLbl) stickyDayLbl.textContent = label;
    });

    // 2. Statistiques réelles de la semaine en cours
    const currentWeekStats = calculateCurrentWeekStats(activities);

    // Desktop card elements
    const runsPerWeekEl = document.getElementById('avg-runs-per-week');
    const timePerWeekEl = document.getElementById('avg-time-per-week');
    const distPerWeekEl = document.getElementById('avg-dist-per-week');
    const calPerWeekEl = document.getElementById('avg-cal-per-week');

    if (runsPerWeekEl) runsPerWeekEl.textContent = currentWeekStats.runs.toString();
    if (timePerWeekEl) timePerWeekEl.textContent = currentWeekStats.timeFormatted;
    if (distPerWeekEl) distPerWeekEl.textContent = currentWeekStats.distanceKm;
    if (calPerWeekEl) calPerWeekEl.textContent = currentWeekStats.calories.toString();

    // Mobile Bottom Sheet elements
    const sheetTitleEl = document.getElementById('lbl-weekly-sheet-title');
    const sheetDistEl = document.getElementById('sheet-dist-val');
    const sheetTimeEl = document.getElementById('sheet-time-val');
    const sheetRunsEl = document.getElementById('sheet-runs-val');
    const sheetCalEl = document.getElementById('sheet-cal-val');

    const lblSheetDist = document.getElementById('lbl-sheet-dist');
    const lblSheetTime = document.getElementById('lbl-sheet-time');
    const lblSheetRuns = document.getElementById('lbl-sheet-runs');
    const lblSheetCal = document.getElementById('lbl-sheet-cal');

    if (sheetTitleEl) sheetTitleEl.textContent = t.weeklyPulseTitle;
    if (sheetDistEl) sheetDistEl.textContent = currentWeekStats.distanceKm;
    if (sheetTimeEl) sheetTimeEl.textContent = currentWeekStats.timeFormatted;
    if (sheetRunsEl) sheetRunsEl.textContent = currentWeekStats.runs.toString();
    if (sheetCalEl) sheetCalEl.textContent = currentWeekStats.calories;

    if (lblSheetDist) lblSheetDist.textContent = t.distPerWeek;
    if (lblSheetTime) lblSheetTime.textContent = t.timePerWeek;
    if (lblSheetRuns) lblSheetRuns.textContent = t.runsPerWeek;
    if (lblSheetCal) lblSheetCal.textContent = t.calPerWeek;
  }

  private static shoeSearchQuery: string = '';
  private static isShoeSearchInit: boolean = false;

  /**
   * Rendu du Parc de Chaussures Rotatif avec Records & Historique complet
   */
  public static renderShoeRotator(dataset: StravaDataset, onSelectActivity?: (id: number) => void, onRotate?: () => void): void {
    const gearList = calculateGearStats(dataset.gear, dataset.activities);
    if (!gearList || gearList.length === 0) return;

    const currentShoe = gearList[this.activeShoeIndex % gearList.length];

    const imageEl = document.getElementById('shoe-active-image') as HTMLImageElement;
    const nameEl = document.getElementById('shoe-active-name');
    const kmEl = document.getElementById('shoe-active-km');
    const progressEl = document.getElementById('shoe-active-progress');
    const timeEl = document.getElementById('shoe-active-time');
    const percentEl = document.getElementById('shoe-active-percent');
    const badgeEl = document.getElementById('shoe-primary-badge');
    const countIndicator = document.getElementById('shoe-count-indicator');
    const dotsContainer = document.getElementById('shoe-pagination-dots');
    const healthBadgeEl = document.getElementById('shoe-health-badge');

    if (imageEl && currentShoe.image_url) {
      imageEl.src = currentShoe.image_url;
      imageEl.alt = currentShoe.name;
    }
    if (nameEl) nameEl.textContent = currentShoe.name;
    if (kmEl) kmEl.textContent = `${currentShoe.totalDistKm.toLocaleString('fr-FR')} km`;
    if (progressEl) progressEl.style.width = `${currentShoe.wearPercent}%`;
    if (timeEl) timeEl.textContent = currentShoe.usageTimeFormatted;
    if (percentEl) percentEl.textContent = `${currentShoe.wearPercent}%`;
    if (badgeEl) badgeEl.textContent = currentShoe.primary ? i18n.t().primaryPair : i18n.t().rotationPair;
    if (countIndicator) {
      countIndicator.textContent = i18n.t().pairCount((this.activeShoeIndex % gearList.length) + 1, gearList.length);
    }

    if (healthBadgeEl && currentShoe.health) {
      const isFr = i18n.getLang() === 'fr';
      const statusText = isFr ? currentShoe.health.statusFr : currentShoe.health.status;
      const remainingText = currentShoe.health.kmRemaining > 0
        ? (isFr ? `~${currentShoe.health.kmRemaining} km restants` : `~${currentShoe.health.kmRemaining} km left`)
        : (isFr ? 'Remplacement recommandé' : 'Replacement recommended');
      
      healthBadgeEl.innerHTML = `<strong>${statusText}</strong> • <span>${remainingText}</span>`;
      healthBadgeEl.className = `shoe-health-badge ${currentShoe.health.badgeClass}`;
    }

    // Pagination Dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      gearList.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = `shoe-dot ${idx === (this.activeShoeIndex % gearList.length) ? 'active' : ''}`;
        dot.addEventListener('click', () => {
          this.activeShoeIndex = idx;
          this.renderShoeRotator(dataset, onSelectActivity, onRotate);
        });
        dotsContainer.appendChild(dot);
      });
    }

    // Bouton de rotation
    const nextBtn = document.getElementById('btn-next-shoe');
    if (nextBtn) {
      nextBtn.onclick = () => {
        this.activeShoeIndex = (this.activeShoeIndex + 1) % gearList.length;
        this.renderShoeRotator(dataset, onSelectActivity, onRotate);
        if (onRotate) onRotate();
      };
    }

    // Rendu des records & historique de la paire active
    this.renderShoeHub(currentShoe.id, dataset, onSelectActivity);
  }

  /**
   * Rendu des records spécifiques et du flux d'activités de la paire
   */
  private static renderShoeHub(shoeId: string, dataset: StravaDataset, onSelectActivity?: (id: number) => void): void {
    const t = i18n.t();
    const isFr = i18n.getLang() === 'fr';
    const shoeDetails = calculateShoeDetails(shoeId, dataset.activities);

    // Summary Stat Chips
    const runsValEl = document.getElementById('shoe-stat-runs-val');
    const paceValEl = document.getElementById('shoe-stat-pace-val');
    const elevValEl = document.getElementById('shoe-stat-elev-val');

    if (runsValEl) runsValEl.textContent = `${shoeDetails.totalRuns}`;
    if (paceValEl) paceValEl.textContent = shoeDetails.avgPaceFormatted;
    if (elevValEl) elevValEl.textContent = `+${shoeDetails.totalElevationGain} m`;

    // Benchmarks Grid
    const benchmarksContainer = document.getElementById('shoe-benchmarks-grid');
    if (benchmarksContainer) {
      benchmarksContainer.innerHTML = '';

      const benchmarksList: Array<{
        label: string;
        time?: string;
        pace?: string;
        date?: string;
        activityName?: string;
        activityId?: number;
      }> = [
        {
          label: t.shoeBest1k,
          time: shoeDetails.best1k?.timeFormatted,
          pace: shoeDetails.best1k?.paceFormatted,
          date: shoeDetails.best1k?.date,
          activityName: shoeDetails.best1k?.activityName,
          activityId: shoeDetails.best1k?.activityId
        },
        {
          label: t.shoeBest5k,
          time: shoeDetails.best5k?.timeFormatted,
          pace: shoeDetails.best5k?.paceFormatted,
          date: shoeDetails.best5k?.date,
          activityName: shoeDetails.best5k?.activityName,
          activityId: shoeDetails.best5k?.activityId
        },
        {
          label: t.shoeBest10k,
          time: shoeDetails.best10k?.timeFormatted,
          pace: shoeDetails.best10k?.paceFormatted,
          date: shoeDetails.best10k?.date,
          activityName: shoeDetails.best10k?.activityName,
          activityId: shoeDetails.best10k?.activityId
        },
        {
          label: shoeDetails.bestSemi ? t.shoeBestSemi : (shoeDetails.best15k ? t.shoeBest15k : t.shoeBest15k),
          time: shoeDetails.bestSemi?.timeFormatted || shoeDetails.best15k?.timeFormatted,
          pace: shoeDetails.bestSemi?.paceFormatted || shoeDetails.best15k?.paceFormatted,
          date: shoeDetails.bestSemi?.date || shoeDetails.best15k?.date,
          activityName: shoeDetails.bestSemi?.activityName || shoeDetails.best15k?.activityName,
          activityId: shoeDetails.bestSemi?.activityId || shoeDetails.best15k?.activityId
        },
        {
          label: t.shoeLongestRun,
          time: shoeDetails.longestRun ? `${shoeDetails.longestRun.distanceKm} km` : undefined,
          pace: shoeDetails.longestRun?.timeFormatted,
          date: shoeDetails.longestRun?.date,
          activityName: shoeDetails.longestRun?.activityName,
          activityId: shoeDetails.longestRun?.activityId
        },
        {
          label: t.shoeFastestRun,
          time: shoeDetails.fastestRun?.paceFormatted,
          pace: shoeDetails.fastestRun ? `${shoeDetails.fastestRun.distanceKm} km` : undefined,
          date: shoeDetails.fastestRun?.date,
          activityName: shoeDetails.fastestRun?.activityName,
          activityId: shoeDetails.fastestRun?.activityId
        }
      ];

      benchmarksList.forEach(bm => {
        const card = document.createElement('div');
        const hasData = Boolean(bm.time);
        card.className = `shoe-benchmark-card ${hasData ? '' : 'empty-record'}`;
        
        card.innerHTML = `
          <div class="shoe-benchmark-top">
            <span class="shoe-benchmark-dist">${bm.label}</span>
            ${bm.pace ? `<span class="shoe-benchmark-pace">${bm.pace}</span>` : ''}
          </div>
          <div class="shoe-benchmark-time">${bm.time || '—'}</div>
          <div class="shoe-benchmark-bottom">
            <span class="shoe-benchmark-act-name" title="${bm.activityName || ''}">${bm.activityName || (hasData ? '' : (isFr ? 'Aucun record' : 'No record'))}</span>
            <span>${bm.date ? formatDate(bm.date) : ''}</span>
          </div>
        `;

        if (hasData && bm.activityId && onSelectActivity) {
          card.addEventListener('click', () => onSelectActivity(bm.activityId!));
        }

        benchmarksContainer.appendChild(card);
      });
    }

    // Shoe History List
    const countBadge = document.getElementById('shoe-history-count-badge');
    const activitiesListEl = document.getElementById('shoe-activities-list');

    const renderActivitiesList = (query: string = '') => {
      if (!activitiesListEl) return;
      activitiesListEl.innerHTML = '';

      const filteredActs = shoeDetails.activities.filter(act => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (act.name || '').toLowerCase().includes(q) ||
               (act.start_date_local || '').includes(q);
      });

      if (countBadge) {
        countBadge.textContent = isFr
          ? `${filteredActs.length} ${filteredActs.length > 1 ? 'courses' : 'course'}`
          : `${filteredActs.length} ${filteredActs.length > 1 ? 'runs' : 'run'}`;
      }

      if (filteredActs.length === 0) {
        activitiesListEl.innerHTML = `
          <div class="shoe-empty-state">
            ${t.shoeNoActivities}
          </div>
        `;
        return;
      }

      filteredActs.forEach(act => {
        const row = document.createElement('div');
        row.className = 'shoe-activity-item';
        
        const distKm = ((act.distance || 0) / 1000).toFixed(2);
        const timeStr = formatTimeShort(act.moving_time || 0);
        const paceStr = act.average_speed > 0 ? formatPace(act.average_speed) : '—';
        const elev = Math.round(act.total_elevation_gain || 0);
        const zone = getActivityEffortZone(act);
        const zoneName = isFr ? zone.zoneNameFr : zone.zoneName;

        row.innerHTML = `
          <div class="shoe-act-main-info">
            <span class="shoe-act-title" title="${act.name}">${act.name}</span>
            <span class="shoe-act-date">${formatDate(act.start_date_local)} • <span style="color: ${zone.badgeColor}; font-weight: 700;">${zoneName}</span></span>
          </div>
          <div class="shoe-act-metrics-group">
            <div class="shoe-act-metric-cell">
              <span class="shoe-act-metric-val">${distKm} km</span>
              <span class="shoe-act-metric-sub">${paceStr}</span>
            </div>
            <div class="shoe-act-metric-cell">
              <span class="shoe-act-metric-val">${timeStr}</span>
              <span class="shoe-act-metric-sub">+${elev} m</span>
            </div>
          </div>
        `;

        if (onSelectActivity) {
          row.addEventListener('click', () => onSelectActivity(act.id));
        }

        activitiesListEl.appendChild(row);
      });
    };

    renderActivitiesList(this.shoeSearchQuery);

    // Attach search input listener once
    const searchInput = document.getElementById('shoe-activity-search') as HTMLInputElement;
    if (searchInput && !this.isShoeSearchInit) {
      this.isShoeSearchInit = true;
      searchInput.addEventListener('input', (e) => {
        this.shoeSearchQuery = (e.target as HTMLInputElement).value;
        renderActivitiesList(this.shoeSearchQuery);
      });
    }
  }

  /**
   * Rendu des Records Personnels
   */
  public static renderRecords(dataset: StravaDataset, onSelectActivity?: (id: number) => void): void {
    const top5kContainer = document.getElementById('top-5k-list');
    const top10kContainer = document.getElementById('top-10k-list');
    const top15kContainer = document.getElementById('top-15k-list');

    const renderList = (container: HTMLElement | null, items: RecordItem[]) => {
      if (!container || !items) return;
      container.innerHTML = '';

      items.slice(0, 3).forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'record-row';
        row.innerHTML = `
          <div class="record-rank">#${idx + 1}</div>
          <div class="record-info">
            <span class="record-activity-name" title="${item.activityName}">${item.activityName}</span>
            <span class="record-date">${formatDate(item.date)}</span>
          </div>
          <div class="record-time">${item.timeFormatted}</div>
        `;
        if (onSelectActivity) {
          row.addEventListener('click', () => onSelectActivity(item.activityId));
        }
        container.appendChild(row);
      });
    };

    if (dataset.records) {
      renderList(top5kContainer, dataset.records.top5k);
      renderList(top10kContainer, dataset.records.top10k);
      renderList(top15kContainer, dataset.records.top15k);
    }
  }

  /**
   * Rendu des statistiques globales de carrière et saison en cours (YTD)
   */
  public static renderCareerStats(dataset: StravaDataset): void {
    const isFr = i18n.getLang() === 'fr';
    const numLocale = isFr ? 'fr-FR' : 'en-US';

    // 1. All-time Totals
    const all = dataset.stats?.all_run_totals;
    let allRuns = all?.count || 0;
    let allDistMeters = all?.distance || 0;
    let allTimeSeconds = all?.moving_time || 0;
    let allElevMeters = all?.elevation_gain || 0;

    if (dataset.activities && dataset.activities.length > allRuns) {
      allRuns = dataset.activities.length;
      allDistMeters = dataset.activities.reduce((acc, a) => acc + (a.distance || 0), 0);
      allTimeSeconds = dataset.activities.reduce((acc, a) => acc + (a.moving_time || 0), 0);
      allElevMeters = dataset.activities.reduce((acc, a) => acc + (a.total_elevation_gain || 0), 0);
    }

    const allKm = Math.round(allDistMeters / 1000);
    const allHours = Math.floor(allTimeSeconds / 3600);
    const allMinutes = Math.floor((allTimeSeconds % 3600) / 60);

    const distAllEl = document.getElementById('stat-dist-all');
    const runsAllEl = document.getElementById('stat-runs-all');
    const timeAllEl = document.getElementById('stat-time-all');
    const elevAllEl = document.getElementById('stat-elev-all');

    if (distAllEl) distAllEl.textContent = allKm.toLocaleString(numLocale);
    if (runsAllEl) runsAllEl.textContent = allRuns.toLocaleString(numLocale);
    if (timeAllEl) timeAllEl.textContent = `${allHours}h ${allMinutes.toString().padStart(2, '0')}m`;
    if (elevAllEl) elevAllEl.textContent = `+${Math.round(allElevMeters).toLocaleString(numLocale)}`;

    // 2. YTD Totals (2026)
    const ytd = dataset.stats?.ytd_run_totals;
    let ytdRuns = ytd?.count || 0;
    let ytdDistMeters = ytd?.distance || 0;
    let ytdTimeSeconds = ytd?.moving_time || 0;
    let ytdElevMeters = ytd?.elevation_gain || 0;

    const ytdActivities = (dataset.activities || []).filter(a => (a.start_date_local || '').startsWith('2026'));
    if (ytdActivities.length > ytdRuns) {
      ytdRuns = ytdActivities.length;
      ytdDistMeters = ytdActivities.reduce((acc, a) => acc + (a.distance || 0), 0);
      ytdTimeSeconds = ytdActivities.reduce((acc, a) => acc + (a.moving_time || 0), 0);
      ytdElevMeters = ytdActivities.reduce((acc, a) => acc + (a.total_elevation_gain || 0), 0);
    }

    const ytdKm = Math.round(ytdDistMeters / 1000);
    const ytdHours = Math.floor(ytdTimeSeconds / 3600);
    const ytdMinutes = Math.floor((ytdTimeSeconds % 3600) / 60);
    const ytdPct = allDistMeters > 0 ? Math.round((ytdDistMeters / allDistMeters) * 100) : 0;

    const distYtdEl = document.getElementById('stat-dist-ytd');
    const runsYtdEl = document.getElementById('stat-runs-ytd');
    const timeYtdEl = document.getElementById('stat-time-ytd');
    const elevYtdEl = document.getElementById('stat-elev-ytd');
    const ytdPctBadge = document.getElementById('lbl-career-ytd-pct');

    if (distYtdEl) distYtdEl.textContent = ytdKm.toLocaleString(numLocale);
    if (runsYtdEl) runsYtdEl.textContent = ytdRuns.toLocaleString(numLocale);
    if (timeYtdEl) timeYtdEl.textContent = `${ytdHours}h ${ytdMinutes.toString().padStart(2, '0')}m`;
    if (elevYtdEl) elevYtdEl.textContent = `+${Math.round(ytdElevMeters).toLocaleString(numLocale)}`;
    if (ytdPctBadge) ytdPctBadge.textContent = isFr ? `${ytdPct}% du volume` : `${ytdPct}% of volume`;
  }

  /**
   * Calendrier annuel perpétuel (Matrice des 366 jours courus sur l'année complète)
   */
  public static renderAnnualCalendar(dataset: StravaDataset, onSelectActivity?: (id: number) => void): void {
    const container = document.getElementById('annual-calendar-months-grid');
    if (!container) return;

    const t = i18n.t();
    const isFr = i18n.getLang() === 'fr';
    const matrix = calculateAnnualCalendarMatrix(dataset.activities);

    // Mettre à jour le badge de synthèse (factuel)
    const summaryBadge = document.getElementById('lbl-annual-calendar-summary');
    if (summaryBadge) {
      summaryBadge.textContent = t.annualCalendarSummary(matrix.totalActiveDays, matrix.totalPossibleDays, matrix.coveragePercent);
    }

    const currentMonthIndex = new Date().getMonth();

    container.innerHTML = '';

    matrix.months.forEach(month => {
      const monthBlock = document.createElement('div');
      const isCurrent = month.monthIndex === currentMonthIndex;
      monthBlock.className = `annual-month-block${isCurrent ? ' current-month' : ''}`;

      const monthName = isFr ? month.monthNameFr : month.monthNameEn;
      const currentBadgeHtml = isCurrent ? `<span class="annual-current-pill">${t.currentMonthBadge}</span>` : '';

      monthBlock.innerHTML = `
        <div class="annual-month-header">
          <span class="annual-month-name">${monthName}</span>
          ${currentBadgeHtml}
        </div>
        <div class="annual-month-days-grid" id="annual-month-${month.monthIndex}"></div>
      `;

      const daysGrid = monthBlock.querySelector(`#annual-month-${month.monthIndex}`) as HTMLElement;
      if (daysGrid) {
        month.days.forEach(day => {
          const cell = document.createElement('div');
          // 4 intensités de couleur actives (1, 2, 3, 4+)
          const level = day.count >= 4 ? 4 : day.count === 3 ? 3 : day.count === 2 ? 2 : day.count === 1 ? 1 : 0;
          cell.className = `annual-day-cell level-${level}`;
          cell.textContent = String(day.dayNumber);

          if (day.count > 0) {
            // Micro-interaction au survol : uniquement l'année ou les années
            const yearsStr = day.years.join(', ');
            cell.setAttribute('data-annual-tooltip', yearsStr);
            cell.setAttribute('title', yearsStr);

            // Interaction au clic
            cell.addEventListener('click', () => {
              if (day.count === 1) {
                // 1 seule course : ouvre directement la modal de détail
                if (onSelectActivity) {
                  onSelectActivity(day.activities[0].id);
                } else {
                  UIRenderer.openActivityModal(day.activities[0], dataset);
                }
              } else {
                // 2 courses ou plus : ouvre le pop-up listant les courses de cette date
                UIRenderer.openAnnualMultiRunModal(day, (actId: number) => {
                  if (onSelectActivity) {
                    onSelectActivity(actId);
                  } else {
                    const act = dataset.activities.find(a => a.id === actId);
                    if (act) UIRenderer.openActivityModal(act, dataset);
                  }
                });
              }
            });
          }

          daysGrid.appendChild(cell);
        });
      }

      container.appendChild(monthBlock);
    });

    // Rendu des pilules de navigation rapide des mois (Mobile Carousel Nav)
    const monthNav = document.getElementById('annual-calendar-month-nav');
    if (monthNav) {
      monthNav.innerHTML = '';
      const shortMonthsFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const shortMonthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const shortNames = isFr ? shortMonthsFr : shortMonthsEn;

      matrix.months.forEach(month => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = `annual-month-nav-pill${month.monthIndex === currentMonthIndex ? ' is-current active' : ''}`;
        pill.textContent = shortNames[month.monthIndex];
        pill.setAttribute('data-month', String(month.monthIndex));

        pill.addEventListener('click', () => {
          monthNav.querySelectorAll('.annual-month-nav-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');

          const targetBlock = container.children[month.monthIndex] as HTMLElement;
          if (targetBlock) {
            container.scrollTo({
              left: targetBlock.offsetLeft - container.offsetLeft,
              behavior: 'smooth'
            });
          }
        });

        monthNav.appendChild(pill);
      });
    }

    // Synchronisation active au swipe dans le carrousel
    let isScrollingAnim: number | null = null;
    container.onscroll = () => {
      if (!monthNav) return;
      if (isScrollingAnim) cancelAnimationFrame(isScrollingAnim);
      isScrollingAnim = requestAnimationFrame(() => {
        const centerPos = container.scrollLeft + container.clientWidth / 2;
        let closestIndex = 0;
        let minDiff = Infinity;

        Array.from(container.children).forEach((child, idx) => {
          const block = child as HTMLElement;
          const blockCenter = block.offsetLeft - container.offsetLeft + block.offsetWidth / 2;
          const diff = Math.abs(centerPos - blockCenter);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = idx;
          }
        });

        const pills = monthNav.querySelectorAll<HTMLElement>('.annual-month-nav-pill');
        pills.forEach((p, idx) => {
          const isActive = idx === closestIndex;
          p.classList.toggle('active', isActive);
          if (isActive) {
            p.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
          }
        });
      });
    };

    // Auto-centrage sur le mois en cours au chargement initial sur mobile
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        const currentBlock = container.children[currentMonthIndex] as HTMLElement;
        if (currentBlock) {
          container.scrollTo({
            left: currentBlock.offsetLeft - container.offsetLeft,
            behavior: 'auto'
          });
          const activePill = monthNav?.children[currentMonthIndex] as HTMLElement;
          if (activePill) {
            activePill.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
          }
        }
      }, 80);
    }
  }

  /**
   * Ouvre la modal listant les sorties multiples pour une date précise
   * Format requis : Année + Nom de la course + distance parcourue
   */
  public static openAnnualMultiRunModal(day: AnnualCalendarDay, onSelectActivity: (id: number) => void): void {
    const modal = document.getElementById('annual-multi-run-modal');
    if (!modal) return;

    const isFr = i18n.getLang() === 'fr';
    const monthNamesFr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const formattedDate = isFr 
      ? `${day.dayNumber} ${monthNamesFr[day.monthIndex]}` 
      : `${monthNamesEn[day.monthIndex]} ${day.dayNumber}`;

    const titleEl = document.getElementById('annual-multi-run-title');
    if (titleEl) {
      titleEl.textContent = formattedDate;
    }

    const listEl = document.getElementById('annual-multi-run-list');
    if (listEl) {
      listEl.innerHTML = '';
      const sortedActs = [...day.activities].sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime());
      
      sortedActs.forEach(act => {
        const { year } = getActivityDateKey(act.start_date_local);
        const distKm = (act.distance / 1000).toFixed(1) + ' km';
        const item = document.createElement('div');
        item.className = 'annual-multi-run-item';
        item.innerHTML = `
          <div class="annual-multi-run-item-left">
            <span class="annual-run-year-pill">${year}</span>
            <span class="annual-run-name" title="${act.name}">${act.name}</span>
          </div>
          <div class="annual-multi-run-item-right">
            <span class="annual-run-distance">${distKm}</span>
            <svg class="annual-run-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        `;
        item.addEventListener('click', () => {
          UIRenderer.closeAnnualMultiRunModal();
          onSelectActivity(act.id);
        });
        listEl.appendChild(item);
      });
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Ferme la modal de sélection de course du calendrier annuel
   */
  public static closeAnnualMultiRunModal(): void {
    const modal = document.getElementById('annual-multi-run-modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  public static currentCalendarYear: number = 2026;
  public static currentCalendarMonth: number = 8; // Septembre (0-indexed)
  private static isCalendarNavInit: boolean = false;
  private static calendarInitialized: boolean = false;

  private static getCalendarBounds(activities: Activity[]) {
    if (!activities || activities.length === 0) {
      const now = new Date();
      return {
        minYear: now.getFullYear(),
        minMonth: now.getMonth(),
        maxYear: now.getFullYear(),
        maxMonth: now.getMonth()
      };
    }

    const sorted = [...activities].sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime());
    const latestDate = new Date(sorted[0].start_date_local);
    const oldestDate = new Date(sorted[sorted.length - 1].start_date_local);

    return {
      minYear: oldestDate.getFullYear(),
      minMonth: oldestDate.getMonth(),
      maxYear: latestDate.getFullYear(),
      maxMonth: latestDate.getMonth()
    };
  }

  /**
   * Initialise les contrôles de navigation du calendrier
   */
  public static setupCalendarNavigation(activities: Activity[], onSelectActivity?: (act: Activity) => void): void {
    if (!this.calendarInitialized && activities && activities.length > 0) {
      const bounds = this.getCalendarBounds(activities);
      this.currentCalendarYear = bounds.maxYear;
      this.currentCalendarMonth = bounds.maxMonth;
      this.calendarInitialized = true;
    }

    if (this.isCalendarNavInit) return;
    this.isCalendarNavInit = true;

    const prevBtn = document.getElementById('btn-prev-month');
    const nextBtn = document.getElementById('btn-next-month');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const bounds = this.getCalendarBounds(activities);
        const canGoPrev = (this.currentCalendarYear > bounds.minYear) || 
                          (this.currentCalendarYear === bounds.minYear && this.currentCalendarMonth > bounds.minMonth);
        if (!canGoPrev) return;

        if (this.currentCalendarMonth === 0) {
          this.currentCalendarMonth = 11;
          this.currentCalendarYear--;
        } else {
          this.currentCalendarMonth--;
        }
        this.renderMonthlyCalendar(activities, onSelectActivity);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const bounds = this.getCalendarBounds(activities);
        const canGoNext = (this.currentCalendarYear < bounds.maxYear) || 
                          (this.currentCalendarYear === bounds.maxYear && this.currentCalendarMonth < bounds.maxMonth);
        if (!canGoNext) return;

        if (this.currentCalendarMonth === 11) {
          this.currentCalendarMonth = 0;
          this.currentCalendarYear++;
        } else {
          this.currentCalendarMonth++;
        }
        this.renderMonthlyCalendar(activities, onSelectActivity);
      });
    }
  }

  /**
   * Rendu du Calendrier Mensuel d'Entraînement (Style Strava Training Log)
   */
  public static renderMonthlyCalendar(
    activities: Activity[],
    onSelectActivity?: (act: Activity) => void
  ): void {
    const gridContainer = document.getElementById('calendar-days-grid');
    const monthLabel = document.getElementById('lbl-current-month');
    const totalPill = document.getElementById('lbl-calendar-month-total');
    if (!gridContainer || !activities) return;

    if (!this.calendarInitialized && activities && activities.length > 0) {
      const bounds = this.getCalendarBounds(activities);
      this.currentCalendarYear = bounds.maxYear;
      this.currentCalendarMonth = bounds.maxMonth;
      this.calendarInitialized = true;
    }

    gridContainer.innerHTML = '';
    const isFr = i18n.getLang() === 'fr';

    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNamesFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    const calData = getMonthCalendarData(activities, this.currentCalendarYear, this.currentCalendarMonth);

    if (monthLabel) {
      const mName = isFr ? monthNamesFr[this.currentCalendarMonth] : monthNamesEn[this.currentCalendarMonth];
      monthLabel.textContent = `${mName} ${this.currentCalendarYear}`;
    }

    if (totalPill) {
      totalPill.textContent = `${calData.monthTotalKm} km • ${calData.monthRunCount} ${isFr ? (calData.monthRunCount > 1 ? 'sorties' : 'sortie') : (calData.monthRunCount > 1 ? 'runs' : 'run')}`;
    }

    // Gestion de l'affichage des flèches : masquage strict si aucune course plus ancienne ou future
    const bounds = this.getCalendarBounds(activities);
    const canGoNext = (this.currentCalendarYear < bounds.maxYear) || 
                      (this.currentCalendarYear === bounds.maxYear && this.currentCalendarMonth < bounds.maxMonth);
    const canGoPrev = (this.currentCalendarYear > bounds.minYear) || 
                      (this.currentCalendarYear === bounds.minYear && this.currentCalendarMonth > bounds.minMonth);

    const prevBtn = document.getElementById('btn-prev-month');
    const nextBtn = document.getElementById('btn-next-month');

    if (nextBtn) {
      if (canGoNext) {
        nextBtn.style.visibility = 'visible';
        nextBtn.style.pointerEvents = 'auto';
        nextBtn.removeAttribute('disabled');
      } else {
        nextBtn.style.visibility = 'hidden';
        nextBtn.style.pointerEvents = 'none';
        nextBtn.setAttribute('disabled', 'true');
      }
    }

    if (prevBtn) {
      if (canGoPrev) {
        prevBtn.style.visibility = 'visible';
        prevBtn.style.pointerEvents = 'auto';
        prevBtn.removeAttribute('disabled');
      } else {
        prevBtn.style.visibility = 'hidden';
        prevBtn.style.pointerEvents = 'none';
        prevBtn.setAttribute('disabled', 'true');
      }
    }

    calData.days.forEach(day => {
      const cell = document.createElement('div');
      cell.className = `cal-day-cell ${!day.isCurrentMonth ? 'empty' : ''}`;

      if (!day.isCurrentMonth) {
        gridContainer.appendChild(cell);
        return;
      }

      const numEl = document.createElement('span');
      numEl.className = 'cal-day-num';
      numEl.textContent = day.dayNumber.toString();
      cell.appendChild(numEl);

      if (day.activities.length > 0 && day.tier) {
        cell.classList.add('has-activity');
        cell.style.backgroundColor = day.tier.bg;
        cell.style.borderColor = day.tier.borderColor;

        const mainAct = day.activities[0];
        const distKmFormatted = day.totalDistanceKm.toFixed(1) + 'k';
        
        const distEl = document.createElement('span');
        distEl.className = 'cal-day-dist';
        distEl.style.color = day.tier.color;
        distEl.textContent = distKmFormatted;

        if (day.tier.badge) {
          const badgeEl = document.createElement('span');
          badgeEl.className = 'cal-pill-badge';
          badgeEl.textContent = day.tier.badge;
          distEl.appendChild(badgeEl);
        }

        cell.appendChild(distEl);

        const actTitle = day.activities.map(a => a.name).join(' + ');
        const tooltip = `${day.dateStr} : ${actTitle} (${day.totalDistanceKm.toFixed(1)} km)`;
        cell.title = tooltip;

        if (onSelectActivity) {
          cell.addEventListener('click', () => onSelectActivity(mainAct));
        }
      }

      gridContainer.appendChild(cell);
    });
  }

  /**
   * Rendu de la bande YTD récapitulative
   */
  public static renderYtdStrip(dataset: StravaDataset): void {
    const ytd = dataset.stats.ytd_run_totals;
    const runsEl = document.getElementById('ytd-strip-runs');
    const timeEl = document.getElementById('ytd-strip-time');
    const distEl = document.getElementById('ytd-strip-dist');
    const elevEl = document.getElementById('ytd-strip-elev');

    if (runsEl) runsEl.textContent = ytd.count.toString();
    if (timeEl) timeEl.textContent = formatTimeShort(ytd.moving_time);
    if (distEl) distEl.textContent = `${Math.round(ytd.distance / 1000).toLocaleString('fr-FR')} km`;
    if (elevEl) elevEl.textContent = `${ytd.elevation_gain.toLocaleString('fr-FR')} m`;
  }

  /**
   * Rendu des Zones d'Effort & Allure (Cardio si montre, Modèle Jack Daniels sinon)
   */
  public static renderEffortZones(activities: Activity[]): void {
    const barWrap = document.getElementById('effort-zones-bar');
    const listWrap = document.getElementById('effort-zones-list');
    const metaWrap = document.getElementById('effort-source-meta');
    const totalDistEl = document.getElementById('lbl-effort-total-dist');

    if (!activities || activities.length === 0) return;

    const { zones, hasBpmCount, paceModelCount, totalKm } = calculateEffortZones(activities);
    const isFr = i18n.getLang() === 'fr';

    if (totalDistEl) {
      totalDistEl.textContent = `${totalKm.toLocaleString('fr-FR')} km`;
    }

    if (barWrap) {
      barWrap.innerHTML = '';
      zones.forEach(z => {
        if (z.percentage > 0) {
          const seg = document.createElement('div');
          seg.className = 'effort-segment';
          seg.style.width = `${z.percentage}%`;
          seg.style.backgroundColor = z.color;
          seg.title = `${isFr ? z.nameFr : z.name} : ${z.percentage}% (${z.km} km)`;
          barWrap.appendChild(seg);
        }
      });
    }

    if (listWrap) {
      listWrap.innerHTML = '';
      zones.forEach(z => {
        const item = document.createElement('div');
        item.className = 'effort-zone-row';
        item.innerHTML = `
          <div class="effort-zone-left">
            <span class="effort-dot" style="background-color: ${z.color};"></span>
            <div>
              <strong class="effort-zone-name">${isFr ? z.nameFr : z.name}</strong>
              <span class="effort-zone-desc">${isFr ? z.descriptionFr : z.description}</span>
            </div>
          </div>
          <div class="effort-zone-right">
            <span class="effort-zone-km">${z.km.toLocaleString('fr-FR')} km</span>
            <span class="effort-zone-pct">${z.percentage}%</span>
          </div>
        `;
        listWrap.appendChild(item);
      });
    }

    if (metaWrap) {
      metaWrap.innerHTML = `<span>❤️ ${hasBpmCount} ${isFr ? 'sorties avec cardio (BPM)' : 'runs with heart rate (BPM)'} • 🏃 ${paceModelCount} ${isFr ? 'sorties avec modèle Jack Daniels' : 'runs with Jack Daniels model'}</span>`;
    }
  }

  /**
   * Rendu des 50 Défis Universels & Trophées de Course
   */
  public static renderAchievements(dataset: StravaDataset): void {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;

    const achievements = calculateAchievements(dataset);
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const isFr = i18n.getLang() === 'fr';
    const t = i18n.t();

    const pct = Math.round((unlockedCount / achievements.length) * 100);
    const level = Math.max(1, Math.floor(unlockedCount * 0.8) + 1);
    let rankTitle = isFr ? 'Initié' : 'Rookie';
    if (pct >= 85) rankTitle = isFr ? 'Légende Vivante' : 'Living Legend';
    else if (pct >= 65) rankTitle = isFr ? 'Coureur Élite' : 'Elite Runner';
    else if (pct >= 45) rankTitle = isFr ? 'Athlète Expert' : 'Expert Athlete';
    else if (pct >= 25) rankTitle = isFr ? 'Coureur Confirmé' : 'Confirmed Runner';

    const bronzeUnlocked = achievements.filter(a => a.tier === 'bronze' && a.unlocked).length;
    const bronzeTotal = achievements.filter(a => a.tier === 'bronze').length;
    const silverUnlocked = achievements.filter(a => a.tier === 'silver' && a.unlocked).length;
    const silverTotal = achievements.filter(a => a.tier === 'silver').length;
    const goldUnlocked = achievements.filter(a => a.tier === 'gold' && a.unlocked).length;
    const goldTotal = achievements.filter(a => a.tier === 'gold').length;
    const diamondUnlocked = achievements.filter(a => a.tier === 'diamond' && a.unlocked).length;
    const diamondTotal = achievements.filter(a => a.tier === 'diamond').length;

    const runnerLevelEl = document.getElementById('lbl-runner-level');
    if (runnerLevelEl) runnerLevelEl.textContent = t.runnerLevel(level, rankTitle);

    const summaryEl = document.getElementById('lbl-achievements-summary');
    if (summaryEl) summaryEl.textContent = t.achievementsSummary(unlockedCount, achievements.length, pct);

    const pctEl = document.getElementById('lbl-achievements-pct');
    if (pctEl) pctEl.textContent = `${pct}%`;

    const fillEl = document.getElementById('achievements-progression-fill');
    if (fillEl) fillEl.style.width = `${pct}%`;

    const cBronze = document.getElementById('count-tier-bronze');
    if (cBronze) cBronze.textContent = `${bronzeUnlocked}/${bronzeTotal}`;

    const cSilver = document.getElementById('count-tier-silver');
    if (cSilver) cSilver.textContent = `${silverUnlocked}/${silverTotal}`;

    const cGold = document.getElementById('count-tier-gold');
    if (cGold) cGold.textContent = `${goldUnlocked}/${goldTotal}`;

    const cDiamond = document.getElementById('count-tier-diamond');
    if (cDiamond) cDiamond.textContent = `${diamondUnlocked}/${diamondTotal}`;

    const filtered = achievements.filter(ach => {
      if (this.activeAchievementCat !== 'all' && ach.category !== this.activeAchievementCat) return false;
      if (this.activeAchievementStatus === 'unlocked' && !ach.unlocked) return false;
      if (this.activeAchievementStatus === 'locked' && ach.unlocked) return false;
      return true;
    });

    grid.innerHTML = '';
    filtered.forEach(ach => {
      const card = document.createElement('div');
      card.className = `achievement-badge-card tier-${ach.tier} ${ach.unlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="achievement-card-top">
          <div class="achievement-icon-box">${ach.icon}</div>
          <div class="achievement-content">
            <div class="achievement-title-row">
              <h4 class="achievement-title">${isFr ? ach.titleFr : ach.title}</h4>
              <span class="achievement-tag ${ach.unlocked ? 'tag-unlocked' : 'tag-locked'}">
                ${ach.unlocked ? (isFr ? 'Débloqué' : 'Unlocked') : `${ach.progressPercent}%`}
              </span>
            </div>
            <p class="achievement-desc">${isFr ? ach.descriptionFr : ach.description}</p>
          </div>
        </div>
        <div class="achievement-card-bottom">
          <div class="achievement-progress-wrap">
            <div class="achievement-progress-fill" style="width: ${ach.progressPercent}%;"></div>
          </div>
          <div class="achievement-val-row">
            <span>${ach.currentValue}</span>
            <span>${isFr ? 'Objectif :' : 'Goal:'} ${ach.targetValue}</span>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  /**
   * Initialise ou rafraîchit la mini-carte Leaflet pour une activité dans son tiroir
   */
  public static initOrUpdateMiniMap(activityId: number, summaryPolyline: string): void {
    const container = document.getElementById(`drawer-minimap-${activityId}`);
    if (!container || !summaryPolyline) return;

    if (this.miniMapInstances.has(activityId)) {
      const existingMap = this.miniMapInstances.get(activityId)!;
      setTimeout(() => existingMap.invalidateSize(), 60);
      return;
    }

    const points = decodePolyline(summaryPolyline);
    if (points.length === 0) return;

    const latlngs = points.map(p => [p[0], p[1]] as [number, number]);

    try {
      const map = L.map(container, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false
      });

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16
      }).addTo(map);

      const polyline = L.polyline(latlngs, {
        color: '#E05A36',
        weight: 3.5,
        opacity: 0.95,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(map);

      map.fitBounds(polyline.getBounds(), { padding: [10, 10] });
      this.miniMapInstances.set(activityId, map);
      setTimeout(() => map.invalidateSize(), 80);
    } catch (e) {
      console.warn('MiniMap init note:', e);
    }
  }

  /**
   * Rendu du flux des activités récentes a
   */
  public static renderActivitiesFeed(
    activities: Activity[],
    dataset: StravaDataset | null,
    onHoverActivity: (act: Activity) => void,
    visibleLimit: number = 10,
    onLoadMore?: () => void,
    onCollapse?: () => void
  ): void {
    const container = document.getElementById('activities-feed-list');
    if (!container || !dataset) return;

    container.innerHTML = '';
    const t = i18n.t();
    const isFr = i18n.getLang() === 'fr';

    const countBadge = document.getElementById('lbl-activities-total-badge');
    if (countBadge) {
      countBadge.textContent = `${activities.length} ${isFr ? 'sorties' : 'runs'}`;
    }

    if (activities.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 32px 16px; color: var(--text-secondary); background: var(--bg-surface-subtle); border-radius: var(--radius-sm);">
          ${isFr ? 'Aucune activité trouvée pour cette recherche.' : 'No activities matching this search.'}
        </div>
      `;
      return;
    }

    const visibleActivities = activities.slice(0, visibleLimit);

    visibleActivities.forEach((activity) => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      item.setAttribute('data-activity-id', activity.id.toString());

      const gearItem = dataset.gear.find(g => g.id === activity.gear_id);
      const gearName = gearItem ? gearItem.name : (isFr ? 'Chaussures de running' : 'Running shoes');
      const caloriesVal = calculateCalories(activity);
      const elev = calculateElevationDetails(activity);
      const diff = calculateDifficulty(activity);
      const tags = generateActivityTags(activity, gearName);
      const splits = generateKilometerSplits(activity);
      const zoneRes = getActivityEffortZone(activity);

      // HTML des splits par kilomètre avec badge de Zone (Z1, Z2, Z3...)
      const splitsHtml = splits.map(s => {
        const zoneClass = s.zoneBadge.toLowerCase();
        return `
        <div class="split-row">
          <span class="split-km">${s.kmLabel}</span>
          <div class="split-bar-track">
            <div class="split-bar-fill ${s.isFaster ? 'fast' : ''}" style="width: ${s.relativePercent}%;"></div>
          </div>
          <span class="split-pace">${s.paceFormatted}</span>
          <span class="split-zone-badge ${zoneClass}">${s.zoneBadge}</span>
        </div>
      `;
      }).join('');

      // HTML des tags (placés en haut, au-dessus du trait en pointillés)
      const tagsHtml = tags.map(tag => `<span class="act-tag-badge">${tag}</span>`).join('');

      item.innerHTML = `
        <!-- Top summary row -->
        <div class="activity-header-row">
          <div class="activity-main">
            <div class="activity-title">${activity.name}</div>
            <div class="activity-date">
              <span>${formatDate(activity.start_date_local)}</span>
              <span>•</span>
              <span>${gearName}</span>
            </div>
            <!-- Tags placés en haut au-dessus du trait en pointillés -->
            <div class="activity-top-tags">
              ${tagsHtml}
            </div>
          </div>
          <div class="activity-metrics">
            <div class="act-stat">
              <span class="act-stat-val">${(activity.distance / 1000).toFixed(2)} km</span>
              <span class="act-stat-unit">${t.distance}</span>
            </div>
            <div class="act-stat">
              <span class="act-stat-val">${formatTimeShort(activity.moving_time)}</span>
              <span class="act-stat-unit">${t.time}</span>
            </div>
            <div class="act-stat">
              <span class="act-stat-val">${formatPace(activity.average_speed)}</span>
              <span class="act-stat-unit">${t.pace}</span>
            </div>
            <div class="act-stat">
              <span class="act-stat-val">${caloriesVal} kcal</span>
              <span class="act-stat-unit">${t.energy}</span>
            </div>
          </div>
        </div>

        <!-- Telemetry Accordion Drawer -->
        <div class="activity-drawer">
          <div class="drawer-content-grid">
            
            <!-- Col 1 : Carte Leaflet du tracé avec réseau routier -->
            <div class="drawer-map-box">
              <div id="drawer-minimap-${activity.id}" class="drawer-minimap-canvas"></div>
            </div>

            <!-- Col 2 : Télémétrie aérée et compacte en grille bento 2 colonnes -->
            <div class="drawer-telemetry-col">
              <div class="telemetry-grid">
                
                <div class="telemetry-tile">
                  <span class="telemetry-tile-lbl">${t.elevation} (D+ / D-)</span>
                  <span class="telemetry-tile-val text-primary">+${elev.gain}m <span class="text-forest" style="margin-left: 3px;">-${elev.loss}m</span></span>
                  ${elev.minAlt !== null && elev.maxAlt !== null ? `<span class="telemetry-tile-sub">${elev.minAlt}m - ${elev.maxAlt}m alt</span>` : ''}
                </div>

                <div class="telemetry-tile">
                  <span class="telemetry-tile-lbl">${t.heartRate}</span>
                  <span class="telemetry-tile-val">${activity.average_heartrate ? `${activity.average_heartrate} bpm` : t.notRecorded}</span>
                  ${activity.max_heartrate ? `<span class="telemetry-tile-sub">max ${activity.max_heartrate} bpm</span>` : ''}
                </div>

                <div class="telemetry-tile">
                  <span class="telemetry-tile-lbl">${t.device}</span>
                  <span class="telemetry-tile-val">${activity.device_name || 'Strava App'}</span>
                </div>

                <div class="telemetry-tile">
                  <span class="telemetry-tile-lbl">${t.difficulty}</span>
                  <span class="effort-badge" style="color: ${diff.color}; border-color: ${diff.color}50; background-color: ${diff.color}15;">
                    ${diff.score}/10 • ${isFr ? diff.labelFr : diff.label}
                  </span>
                </div>

                <div class="telemetry-tile telemetry-tile-full">
                  <span class="telemetry-tile-lbl">${isFr ? "Zone d'effort" : 'Effort zone'}</span>
                  <span class="effort-badge" style="color: ${zoneRes.badgeColor}; border-color: ${zoneRes.badgeColor}50; background-color: ${zoneRes.badgeColor}18;">
                    ${isFr ? zoneRes.zoneNameFr : zoneRes.zoneName} (${isFr ? zoneRes.methodLabelFr : zoneRes.methodLabel})
                  </span>
                </div>

              </div>
            </div>

            <!-- Col 3 : Allure au kilomètre (Splits) avec badge de Zone -->
            <div class="drawer-splits-col">
              <div class="splits-container-inner">
                <span class="splits-title">${t.splits}</span>
                <div class="splits-list-custom">
                  ${splitsHtml}
                </div>
              </div>
            </div>

          </div>
        </div>
      `;

      let hoverTimeout: any = null;

      // Survol : déclenche l'affichage du tracé sur la carte principale ET précharge la mini-carte
      item.addEventListener('mouseenter', () => {
        hoverTimeout = setTimeout(() => {
          onHoverActivity(activity);
          UIRenderer.initOrUpdateMiniMap(activity.id, activity.map?.summary_polyline || '');
        }, 40);
      });

      item.addEventListener('mouseleave', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
      });

      // Clic pour étendre / masquer
      item.addEventListener('click', () => {
        const isCurrentlyExpanded = item.classList.toggle('expanded');
        if (isCurrentlyExpanded) {
          UIRenderer.initOrUpdateMiniMap(activity.id, activity.map?.summary_polyline || '');
        }
        onHoverActivity(activity);
      });

      container.appendChild(item);
    });

    // Contrôles de pagination : Charger plus et Réduire
    if ((activities.length > visibleLimit && onLoadMore) || (visibleLimit > 10 && onCollapse)) {
      const loadMoreWrap = document.createElement('div');
      loadMoreWrap.className = 'feed-load-more-wrap';

      let controlsHtml = '';

      if (activities.length > visibleLimit && onLoadMore) {
        controlsHtml += `
          <button id="btn-load-more-activities" class="btn-load-more">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>${isFr ? 'Afficher plus' : 'Load more'}</span>
          </button>
        `;
      }

      if (visibleLimit > 10 && onCollapse) {
        controlsHtml += `
          <button id="btn-collapse-activities" class="btn-collapse-activities">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            <span>${isFr ? 'Réduire' : 'Collapse'}</span>
          </button>
        `;
      }

      loadMoreWrap.innerHTML = controlsHtml;

      const loadMoreBtn = loadMoreWrap.querySelector<HTMLButtonElement>('#btn-load-more-activities');
      if (loadMoreBtn && onLoadMore) {
        loadMoreBtn.addEventListener('click', () => {
          onLoadMore();
        });
      }

      const collapseBtn = loadMoreWrap.querySelector<HTMLButtonElement>('#btn-collapse-activities');
      if (collapseBtn && onCollapse) {
        collapseBtn.addEventListener('click', () => {
          onCollapse();
        });
      }

      container.appendChild(loadMoreWrap);
    }
  }

  /**
   * Modal détails complets de la course (Style Activity Details Pop-up)
   */
  public static openActivityModal(activity: Activity, dataset: StravaDataset): void {
    const modal = document.getElementById('activity-modal');
    if (!modal) return;

    const isFr = i18n.getLang() === 'fr';
    const t = i18n.t();

    // 1. En-tête & Chaussures & Tags
    const titleEl = document.getElementById('modal-activity-title');
    const dateEl = document.getElementById('modal-activity-date');
    const gearEl = document.getElementById('modal-activity-gear');
    const tagsContainer = document.getElementById('modal-activity-tags');

    const gearItem = dataset.gear.find(g => g.id === activity.gear_id);
    const gearName = gearItem ? gearItem.name : (isFr ? 'Chaussures de running' : 'Running shoes');
    const caloriesVal = calculateCalories(activity);
    const elev = calculateElevationDetails(activity);
    const diff = calculateDifficulty(activity);
    const zoneRes = getActivityEffortZone(activity);
    const tags = generateActivityTags(activity, gearName);
    const splits = generateKilometerSplits(activity);

    if (titleEl) titleEl.textContent = activity.name;
    if (dateEl) dateEl.textContent = formatDate(activity.start_date_local);
    if (gearEl) gearEl.textContent = gearName;

    if (tagsContainer) {
      tagsContainer.innerHTML = tags.map(tag => `<span class="act-tag-badge">${tag}</span>`).join('');
    }

    // 2. Bandeau 4 métriques
    const distEl = document.getElementById('modal-activity-dist');
    const timeEl = document.getElementById('modal-activity-time');
    const paceEl = document.getElementById('modal-activity-pace');
    const calEl = document.getElementById('modal-activity-cal');

    const lblDist = document.getElementById('lbl-modal-dist');
    const lblTime = document.getElementById('lbl-modal-time');
    const lblPace = document.getElementById('lbl-modal-pace');
    const lblCal = document.getElementById('lbl-modal-cal');

    if (distEl) distEl.textContent = `${(activity.distance / 1000).toFixed(2)} km`;
    if (timeEl) timeEl.textContent = formatTimeShort(activity.moving_time);
    if (paceEl) paceEl.textContent = formatPace(activity.average_speed);
    if (calEl) calEl.textContent = `${caloriesVal} kcal`;

    if (lblDist) lblDist.textContent = t.distance.toUpperCase();
    if (lblTime) lblTime.textContent = t.time.toUpperCase();
    if (lblPace) lblPace.textContent = t.pace.toUpperCase();
    if (lblCal) lblCal.textContent = t.energy.toUpperCase();

    // 3. Mini-carte Leaflet du tracé GPS
    const mapWrap = document.getElementById('modal-map-wrapper');
    const mapCanvas = document.getElementById('modal-activity-map');

    if (this.modalMapInstance) {
      try {
        this.modalMapInstance.remove();
      } catch (e) {
        console.warn('Modal map cleanup note:', e);
      }
      this.modalMapInstance = null;
    }

    if (activity.map?.summary_polyline && mapCanvas && mapWrap) {
      mapWrap.style.display = 'block';
      const points = decodePolyline(activity.map.summary_polyline);

      if (points.length > 0) {
        try {
          const latlngs = points.map(p => [p[0], p[1]] as [number, number]);
          const map = L.map(mapCanvas, {
            zoomControl: false,
            attributionControl: false,
            dragging: true,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: true,
            boxZoom: false,
            keyboard: false
          });

          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 16
          }).addTo(map);

          const polyline = L.polyline(latlngs, {
            color: '#E05A36',
            weight: 3.5,
            opacity: 0.95,
            lineJoin: 'round',
            lineCap: 'round'
          }).addTo(map);

          const bounds = polyline.getBounds();
          map.fitBounds(bounds, { padding: [16, 16] });
          this.modalMapInstance = map;

          const refreshMapBounds = () => {
            if (this.modalMapInstance) {
              this.modalMapInstance.invalidateSize();
              this.modalMapInstance.fitBounds(bounds, { padding: [16, 16], animate: false });
            }
          };

          requestAnimationFrame(refreshMapBounds);
          setTimeout(refreshMapBounds, 100);
          setTimeout(refreshMapBounds, 300);
        } catch (e) {
          console.warn('Modal map init note:', e);
        }
      } else {
        mapWrap.style.display = 'none';
      }
    } else if (mapWrap) {
      mapWrap.style.display = 'none';
    }

    // 4. Grille Bento Télémétrie 2x2 & Zone d'effort
    const elevEl = document.getElementById('modal-activity-elev');
    const altEl = document.getElementById('modal-activity-alt');
    const hrEl = document.getElementById('modal-activity-hr');
    const hrMaxEl = document.getElementById('modal-activity-hr-max');
    const deviceEl = document.getElementById('modal-activity-device');
    const effortEl = document.getElementById('modal-activity-effort');
    const zoneEl = document.getElementById('modal-activity-zone');

    const lblElevTitle = document.getElementById('lbl-modal-elev-title');
    const lblHrTitle = document.getElementById('lbl-modal-hr-title');
    const lblDeviceTitle = document.getElementById('lbl-modal-device-title');
    const lblEffortTitle = document.getElementById('lbl-modal-effort-title');
    const lblZoneTitle = document.getElementById('lbl-modal-zone-title');

    if (lblElevTitle) lblElevTitle.textContent = `${t.elevation} (D+ / D-)`;
    if (lblHrTitle) lblHrTitle.textContent = t.heartRate;
    if (lblDeviceTitle) lblDeviceTitle.textContent = t.device;
    if (lblEffortTitle) lblEffortTitle.textContent = t.difficulty;
    if (lblZoneTitle) lblZoneTitle.textContent = isFr ? "Zone d'effort" : 'Effort zone';

    if (elevEl) elevEl.innerHTML = `+${elev.gain}m <span class="text-forest" style="margin-left: 3px;">-${elev.loss}m</span>`;
    if (altEl) altEl.textContent = (elev.minAlt !== null && elev.maxAlt !== null) ? `${elev.minAlt}m - ${elev.maxAlt}m alt` : '';

    if (hrEl) hrEl.textContent = activity.average_heartrate ? `${activity.average_heartrate} bpm` : t.notRecorded;
    if (hrMaxEl) hrMaxEl.textContent = activity.max_heartrate ? `max ${activity.max_heartrate} bpm` : '';

    if (deviceEl) deviceEl.textContent = activity.device_name || 'Strava App';

    if (effortEl) {
      effortEl.textContent = `${diff.score}/10 • ${isFr ? diff.labelFr : diff.label}`;
      effortEl.style.color = diff.color;
      effortEl.style.borderColor = `${diff.color}50`;
      effortEl.style.backgroundColor = `${diff.color}15`;
    }

    if (zoneEl) {
      zoneEl.textContent = `${isFr ? zoneRes.zoneNameFr : zoneRes.zoneName} (${isFr ? zoneRes.methodLabelFr : zoneRes.methodLabel})`;
      zoneEl.style.color = zoneRes.badgeColor;
      zoneEl.style.borderColor = `${zoneRes.badgeColor}50`;
      zoneEl.style.backgroundColor = `${zoneRes.badgeColor}18`;
    }

    // 5. Sections Splits Kilométriques
    const lblSplitsTitle = document.getElementById('lbl-modal-splits-title');
    const splitsContainer = document.getElementById('modal-splits-list');
    if (lblSplitsTitle) lblSplitsTitle.textContent = t.splits;

    if (splitsContainer) {
      splitsContainer.innerHTML = splits.map(s => {
        const zoneClass = s.zoneBadge.toLowerCase();
        return `
          <div class="split-row">
            <span class="split-km">${s.kmLabel}</span>
            <div class="split-bar-track">
              <div class="split-bar-fill ${s.isFaster ? 'fast' : ''}" style="width: ${s.relativePercent}%;"></div>
            </div>
            <span class="split-pace">${s.paceFormatted}</span>
            <span class="split-zone-badge ${zoneClass}">${s.zoneBadge}</span>
          </div>
        `;
      }).join('');
    }

    // 6. Ouverture de la modale & verrouillage du scroll d'arrière-plan
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  public static closeActivityModal(): void {
    const modal = document.getElementById('activity-modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  /**
   * Toast notification
   */
  public static showToast(message: string): void {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}
