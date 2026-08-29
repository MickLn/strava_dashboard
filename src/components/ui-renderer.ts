import { StravaDataset, Activity, RecordItem } from '../types/strava.ts';
import {
  formatDistance,
  formatPace,
  formatTimeShort,
  formatDate,
  getCurrentWeekDays,
  calculateWeekStreak,
  calculateWeeklyAverages,
  calculateConsistencyGrid,
  calculateGearStats,
  calculateCalories,
  calculateElevationDetails,
  calculateDifficulty,
  calculateEffortZones,
  calculateAchievements,
  generateActivityTags,
  generateKilometerSplits,
  renderPolylineSVG
} from '../utils/metrics.ts';
import { i18n } from '../utils/i18n.ts';

export class UIRenderer {
  private static activeShoeIndex: number = 0;

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
    setTxt('lbl-pulse-sub', t.weeklyPulseSubtitle);
    setTxt('lbl-pulse-weeks-text', t.consecutiveWeeks);
    setTxt('lbl-pulse-streak-legend', t.activeStreak);
    setTxt('lbl-pulse-days-legend', t.activeDaysThisWeek);
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

    setTxt('lbl-shoe-title', t.shoeLockerTitle);
    setTxt('lbl-shoe-time', t.cushioningTime);
    setTxt('lbl-shoe-wear', t.wear);
    setTxt('lbl-btn-next-shoe', t.nextShoeBtn);

    setTxt('lbl-chart-title', t.ytdTitle);
    setTxt('lbl-chart-badge', t.ytdBadge);
    setTxt('lbl-ytd-runs', t.ytdRuns);
    setTxt('lbl-ytd-time', t.ytdTime);
    setTxt('lbl-ytd-dist', t.ytdDist);
    setTxt('lbl-ytd-elev', t.ytdElev);

    setTxt('lbl-matrix-title', t.matrixTitle);
    setTxt('lbl-matrix-less', t.less);
    setTxt('lbl-matrix-more', t.more);
    setTxt('lbl-matrix-hint', t.matrixTooltip);

    setTxt('lbl-effort-zones-title', t.effortZonesTitle);
    setTxt('lbl-effort-zones-sub', t.effortZonesSubtitle);
    setTxt('lbl-achievements-title', t.achievementsTitle);
    setTxt('lbl-achievements-sub', t.achievementsSubtitle);
    setTxt('btn-close-heatmap', t.closeHeatmapBtn);

    setTxt('lbl-activities-title', t.recentActivitiesTitle);
    setTxt('lbl-activities-sub', t.recentActivitiesSubtitle);

    const searchInput = document.getElementById('activity-search-input') as HTMLInputElement;
    if (searchInput) searchInput.placeholder = t.searchPlaceholder;

    setTxt('chip-all', t.filterAll);
    setTxt('chip-long', `🏃 ${t.filterLong}`);
    setTxt('chip-fast', `⚡ ${t.filterFast}`);
    setTxt('chip-elev', `⛰️ ${t.filterElevation}`);

    setTxt('lbl-modal-dist', t.distance);
    setTxt('lbl-modal-time', t.time);
    setTxt('lbl-modal-pace', t.avgPace);
    setTxt('lbl-modal-cal', t.energy);
    setTxt('lbl-modal-elev', t.elevation);
    setTxt('lbl-modal-hr', t.heartRate);
    setTxt('lbl-modal-gear', t.shoesUsed);

    setTxt('lbl-footer-1', `🏃 ${t.footerTitle}`);
    setTxt('lbl-footer-2', t.footerSubtitle);

    // Mettre à jour l'état actif des boutons de langue
    const lang = i18n.getLang();
    document.querySelectorAll('.lang-btn').forEach(btn => {
      if (btn.getAttribute('data-lang') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Rendu de l'en-tête athlète
   */
  public static renderHeader(dataset: StravaDataset): void {
    const athlete = dataset.athlete;
    const avatarEl = document.getElementById('athlete-avatar') as HTMLImageElement;
    const nameEl = document.getElementById('athlete-name');
    const locationEl = document.getElementById('athlete-location');
    const lastSyncEl = document.getElementById('last-sync-time');

    if (avatarEl && athlete.profile) {
      avatarEl.src = athlete.profile;
      avatarEl.alt = `${athlete.firstname} ${athlete.lastname}`;
    }
    if (nameEl) nameEl.textContent = `${athlete.firstname} ${athlete.lastname}`;
    if (locationEl) locationEl.textContent = `${athlete.city || 'Paris'}, ${athlete.country || 'France'}`;
    if (lastSyncEl && dataset.last_updated) {
      const syncDate = new Date(dataset.last_updated);
      lastSyncEl.textContent = `${i18n.t().lastSync} : ${syncDate.toLocaleDateString(i18n.getLang() === 'fr' ? 'fr-FR' : 'en-US')} ${syncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    this.updateStaticLabels();
  }

  /**
   * Rendu de la Dernière Sortie en Vedette (Étage 1 Gauche)
   */
  public static renderFeaturedLatestRun(activities: Activity[], onOpenDetails: (act: Activity) => void): void {
    if (!activities || activities.length === 0) return;
    const latest = activities[0];

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
  }

  /**
   * Rendu du Weekly Pulse (Étage 1 Droite)
   */
  public static renderWeeklyPulse(dataset: StravaDataset): void {
    const activities = dataset.activities;

    // 1. Streak
    const streakEl = document.getElementById('hero-streak-count');
    if (streakEl) {
      streakEl.textContent = calculateWeekStreak(activities).toString();
    }

    // 2. Jours actifs cette semaine
    const weekDays = getCurrentWeekDays(activities);
    const dayElements: Record<string, HTMLElement | null> = {
      L: document.getElementById('day-l'),
      M: document.getElementById('day-m'),
      Me: document.getElementById('day-me'),
      J: document.getElementById('day-j'),
      V: document.getElementById('day-v'),
      S: document.getElementById('day-s'),
      D: document.getElementById('day-d')
    };

    if (dayElements.L && weekDays.L) dayElements.L.classList.add('active');
    if (dayElements.M && weekDays.M) dayElements.M.classList.add('active');
    if (dayElements.Me && weekDays.Me) dayElements.Me.classList.add('active');
    if (dayElements.J && weekDays.J) dayElements.J.classList.add('active');
    if (dayElements.V && weekDays.V) dayElements.V.classList.add('active');
    if (dayElements.S && weekDays.S) dayElements.S.classList.add('active');
    if (dayElements.D && weekDays.D) dayElements.D.classList.add('active');

    // 3. Moyennes historiques
    const avg = calculateWeeklyAverages(activities);
    const runsPerWeekEl = document.getElementById('avg-runs-per-week');
    const timePerWeekEl = document.getElementById('avg-time-per-week');
    const distPerWeekEl = document.getElementById('avg-dist-per-week');
    const calPerWeekEl = document.getElementById('avg-cal-per-week');

    if (runsPerWeekEl) runsPerWeekEl.textContent = avg.runsPerWeek;
    if (timePerWeekEl) timePerWeekEl.textContent = avg.timePerWeekFormatted;
    if (distPerWeekEl) distPerWeekEl.textContent = `${avg.distancePerWeek} km`;
    if (calPerWeekEl) calPerWeekEl.textContent = `${avg.caloriesPerWeek} kcal`;
  }

  /**
   * Rendu du Parc de Chaussures Rotatif avec Images (Shoe Card Rotator)
   */
  public static renderShoeRotator(dataset: StravaDataset, onRotate?: () => void): void {
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
      
      healthBadgeEl.innerHTML = `${currentShoe.health.icon} <strong>${statusText}</strong> • <span>${remainingText}</span>`;
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
          this.renderShoeRotator(dataset);
        });
        dotsContainer.appendChild(dot);
      });
    }

    // Bouton de rotation
    const nextBtn = document.getElementById('btn-next-shoe');
    if (nextBtn) {
      nextBtn.onclick = () => {
        this.activeShoeIndex = (this.activeShoeIndex + 1) % gearList.length;
        this.renderShoeRotator(dataset);
        if (onRotate) onRotate();
      };
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
   * Rendu de la grille de constance 52 semaines
   */
  public static renderConsistencyGrid(activities: Activity[]): void {
    const container = document.getElementById('consistency-grid');
    if (!container) return;

    container.innerHTML = '';
    const days = calculateConsistencyGrid(activities);

    days.forEach(day => {
      const cell = document.createElement('div');
      cell.className = 'matrix-cell';
      cell.setAttribute('data-level', day.level.toString());
      cell.title = `${day.date} : ${day.km > 0 ? day.km + ' km' : i18n.t().restDay}`;
      container.appendChild(cell);
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

    const { zones, hasWatchCount, paceModelCount, totalKm } = calculateEffortZones(activities);
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
      metaWrap.innerHTML = `<span>${i18n.t().watchPaceSplit(hasWatchCount, paceModelCount)}</span>`;
    }
  }

  /**
   * Rendu des Trophées & Badges d'Accomplissement
   */
  public static renderAchievements(dataset: StravaDataset): void {
    const grid = document.getElementById('achievements-grid');
    const countEl = document.getElementById('lbl-achievements-count');
    if (!grid) return;

    const achievements = calculateAchievements(dataset);
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const isFr = i18n.getLang() === 'fr';

    if (countEl) {
      countEl.textContent = isFr
        ? `${unlockedCount} / ${achievements.length} Débloqués`
        : `${unlockedCount} / ${achievements.length} Unlocked`;
    }

    grid.innerHTML = '';
    achievements.forEach(ach => {
      const card = document.createElement('div');
      card.className = `achievement-badge-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="achievement-icon">${ach.icon}</div>
        <div class="achievement-body">
          <div class="achievement-title-row">
            <h4 class="achievement-title">${isFr ? ach.titleFr : ach.title}</h4>
            <span class="achievement-tag ${ach.unlocked ? 'tag-unlocked' : 'tag-locked'}">
              ${ach.unlocked ? (isFr ? 'Débloqué' : 'Unlocked') : `${ach.progressPercent}%`}
            </span>
          </div>
          <p class="achievement-desc">${isFr ? ach.descriptionFr : ach.description}</p>
          <div class="achievement-progress-wrap">
            <div class="achievement-progress-fill" style="width: ${ach.progressPercent}%;"></div>
          </div>
          <div class="achievement-val-row">
            <span>${ach.currentValue}</span>
            <span>Objectif : ${ach.targetValue}</span>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  /**
   * Rendu de la liste des activités avec tiroir de télémétrie dépliant au survol
   */
  public static renderActivitiesFeed(
    activities: Activity[],
    dataset: StravaDataset,
    onHoverActivity: (activity: Activity) => void,
    onSelectActivity: (activity: Activity) => void
  ): void {
    const container = document.getElementById('activities-feed-list');
    if (!container) return;

    container.innerHTML = '';
    const t = i18n.t();
    const isFr = i18n.getLang() === 'fr';

    if (activities.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 32px 16px; color: var(--text-secondary); background: var(--bg-surface-subtle); border-radius: var(--radius-sm);">
          🔍 ${isFr ? 'Aucune activité trouvée pour cette recherche.' : 'No activities matching this search.'}
        </div>
      `;
      return;
    }

    activities.forEach((activity) => {
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
      const svgMap = renderPolylineSVG(activity.map?.summary_polyline || '', 250, 130);

      // HTML des splits par kilomètre
      const splitsHtml = splits.map(s => `
        <div class="split-row">
          <span class="split-km">${s.kmLabel}</span>
          <div class="split-bar-track">
            <div class="split-bar-fill ${s.isFaster ? 'fast' : ''}" style="width: ${s.relativePercent}%;"></div>
          </div>
          <span class="split-pace">${s.paceFormatted}</span>
        </div>
      `).join('');

      // HTML des tags
      const tagsHtml = tags.map(tag => `<span class="act-tag-badge">${tag}</span>`).join('');

      item.innerHTML = `
        <!-- Top summary row -->
        <div class="activity-header-row">
          <div class="activity-main">
            <div class="activity-title">${activity.name}</div>
            <div class="activity-date">
              <span>📅 ${formatDate(activity.start_date_local)}</span>
              <span>•</span>
              <span>👟 ${gearName}</span>
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
            <span class="act-pill">${t.viewDetails}</span>
          </div>
        </div>

        <!-- Telemetry Hover Drawer (Déroulé interactif au survol) -->
        <div class="activity-drawer">
          <div class="drawer-content-grid">
            
            <!-- Col 1 : Tracé GPS SVG vectoriel -->
            <div class="drawer-map-box">
              <span class="drawer-map-title">🗺️ ${isFr ? 'Tracé du parcours' : 'Route trace'}</span>
              ${svgMap}
            </div>

            <!-- Col 2 : Télémétrie complète (Dénivelé +/-, BPM, Montre, Effort, Tags) -->
            <div class="drawer-telemetry-col">
              <div class="telemetry-row">
                <span class="telemetry-lbl">⛰️ ${t.elevation} (D+ / D-) :</span>
                <span class="telemetry-val" style="color: var(--color-primary);">▲ +${elev.gain}m <span style="color: var(--color-forest); margin-left: 4px;">▼ -${elev.loss}m</span></span>
              </div>

              ${elev.minAlt !== null && elev.maxAlt !== null ? `
              <div class="telemetry-row">
                <span class="telemetry-lbl">📍 ${t.altitude} :</span>
                <span class="telemetry-val">${elev.minAlt}m min • ${elev.maxAlt}m max</span>
              </div>` : ''}

              <div class="telemetry-row">
                <span class="telemetry-lbl">❤️ ${t.heartRate} :</span>
                <span class="telemetry-val">${activity.average_heartrate ? `${activity.average_heartrate} bpm (max ${activity.max_heartrate || '--'})` : t.notRecorded}</span>
              </div>

              <div class="telemetry-row">
                <span class="telemetry-lbl">⌚ ${t.device} :</span>
                <span class="telemetry-val">${activity.device_name || 'Strava GPS App'}</span>
              </div>

              <div class="telemetry-row">
                <span class="telemetry-lbl">⚡ ${t.difficulty} :</span>
                <span class="effort-badge" style="color: ${diff.color}; border-color: ${diff.color}40;">
                  ${diff.score}/10 • ${isFr ? diff.labelFr : diff.label}
                </span>
              </div>

              <div class="activity-tags-list">
                ${tagsHtml}
              </div>
            </div>

            <!-- Col 3 : Détail des allures km par km (Splits) -->
            <div class="drawer-splits-col">
              <span class="splits-header">⏱️ ${t.splits}</span>
              <div class="splits-list">
                ${splitsHtml}
              </div>
            </div>

          </div>
        </div>
      `;

      // Déclencheur au survol : Synchronisation de la carte principale
      let hoverTimeout: any = null;
      item.addEventListener('mouseenter', () => {
        hoverTimeout = setTimeout(() => {
          onHoverActivity(activity);
        }, 120);
      });
      item.addEventListener('mouseleave', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
      });

      // Clic pour épingler / déplier sur mobile
      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('act-pill') || target.closest('.activity-header-row')) {
          item.classList.toggle('expanded');
          onSelectActivity(activity);
        }
      });

      container.appendChild(item);
    });
  }

  /**
   * Modal détails
   */
  public static openActivityModal(activity: Activity, dataset: StravaDataset): void {
    const modal = document.getElementById('activity-modal');
    if (!modal) return;

    const titleEl = document.getElementById('modal-activity-title');
    const dateEl = document.getElementById('modal-activity-date');
    const distEl = document.getElementById('modal-activity-dist');
    const timeEl = document.getElementById('modal-activity-time');
    const paceEl = document.getElementById('modal-activity-pace');
    const calEl = document.getElementById('modal-activity-cal');
    const elevEl = document.getElementById('modal-activity-elev');
    const hrEl = document.getElementById('modal-activity-hr');
    const gearEl = document.getElementById('modal-activity-gear');

    const gearItem = dataset.gear.find(g => g.id === activity.gear_id);
    const caloriesVal = calculateCalories(activity);

    if (titleEl) titleEl.textContent = activity.name;
    if (dateEl) dateEl.textContent = `${i18n.t().recordedOn} ${formatDate(activity.start_date_local)}`;
    if (distEl) distEl.textContent = formatDistance(activity.distance);
    if (timeEl) timeEl.textContent = formatTimeShort(activity.moving_time);
    if (paceEl) paceEl.textContent = formatPace(activity.average_speed);
    if (calEl) calEl.textContent = `${caloriesVal} kcal`;
    if (elevEl) elevEl.textContent = `${activity.total_elevation_gain} m D+`;
    if (hrEl) hrEl.textContent = activity.average_heartrate ? `${activity.average_heartrate} bpm (max ${activity.max_heartrate || '--'})` : (i18n.getLang() === 'fr' ? 'Non mesuré' : 'Not recorded');
    if (gearEl) gearEl.textContent = gearItem ? gearItem.name : (i18n.getLang() === 'fr' ? 'Chaussures par défaut' : 'Default shoes');

    modal.classList.add('open');
  }

  public static closeActivityModal(): void {
    const modal = document.getElementById('activity-modal');
    if (modal) modal.classList.remove('open');
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
