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
  calculateGearStats
} from '../utils/metrics.ts';

export class UIRenderer {
  private static activeShoeIndex: number = 0;

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
      lastSyncEl.textContent = `Sync : ${syncDate.toLocaleDateString('fr-FR')} ${syncDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
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

    if (titleEl) titleEl.textContent = latest.name;
    if (dateEl) dateEl.textContent = `${formatDate(latest.start_date_local)} • ${latest.timezone?.split('/')[1] || 'Paris'}`;
    if (distEl) distEl.textContent = formatDistance(latest.distance);
    if (timeEl) timeEl.textContent = formatTimeShort(latest.moving_time);
    if (paceEl) paceEl.textContent = formatPace(latest.average_speed);
    if (calEl) calEl.textContent = `${latest.calories} kcal`;

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

    if (imageEl && currentShoe.image_url) {
      imageEl.src = currentShoe.image_url;
      imageEl.alt = currentShoe.name;
    }
    if (nameEl) nameEl.textContent = currentShoe.name;
    if (kmEl) kmEl.textContent = `${currentShoe.totalDistKm.toLocaleString('fr-FR')} km`;
    if (progressEl) progressEl.style.width = `${currentShoe.wearPercent}%`;
    if (timeEl) timeEl.textContent = currentShoe.usageTimeFormatted;
    if (percentEl) percentEl.textContent = `${currentShoe.wearPercent}%`;
    if (badgeEl) badgeEl.textContent = currentShoe.primary ? '⭐ Paire Principale' : 'Paire Rotation';
    if (countIndicator) {
      countIndicator.textContent = `Paire ${(this.activeShoeIndex % gearList.length) + 1} sur ${gearList.length}`;
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
   * Rendu des Records & Best Efforts (Top 3 5k, 10k, 15k+)
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
      cell.title = `${day.date} : ${day.km > 0 ? day.km + ' km' : 'Repos'}`;
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
   * Rendu de la liste des activités récentes
   */
  public static renderActivitiesFeed(
    activities: Activity[],
    dataset: StravaDataset,
    onSelectActivity: (activity: Activity) => void
  ): void {
    const container = document.getElementById('activities-feed-list');
    if (!container) return;

    container.innerHTML = '';
    const recentActivities = activities.slice(0, 10);

    recentActivities.forEach(activity => {
      const item = document.createElement('div');
      item.className = 'activity-item';

      const gearItem = dataset.gear.find(g => g.id === activity.gear_id);
      const gearName = gearItem ? gearItem.name : 'Running Shoes';

      item.innerHTML = `
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
            <span class="act-stat-unit">Distance</span>
          </div>
          <div class="act-stat">
            <span class="act-stat-val">${formatTimeShort(activity.moving_time)}</span>
            <span class="act-stat-unit">Temps</span>
          </div>
          <div class="act-stat">
            <span class="act-stat-val">${formatPace(activity.average_speed)}</span>
            <span class="act-stat-unit">Allure</span>
          </div>
          <div class="act-stat">
            <span class="act-stat-val">${activity.calories} kcal</span>
            <span class="act-stat-unit">Énergie</span>
          </div>
          <span class="act-pill">Détails ↗</span>
        </div>
      `;

      item.addEventListener('click', () => onSelectActivity(activity));
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

    if (titleEl) titleEl.textContent = activity.name;
    if (dateEl) dateEl.textContent = `Enregistré le ${formatDate(activity.start_date_local)}`;
    if (distEl) distEl.textContent = formatDistance(activity.distance);
    if (timeEl) timeEl.textContent = formatTimeShort(activity.moving_time);
    if (paceEl) paceEl.textContent = formatPace(activity.average_speed);
    if (calEl) calEl.textContent = `${activity.calories} kcal`;
    if (elevEl) elevEl.textContent = `${activity.total_elevation_gain} m D+`;
    if (hrEl) hrEl.textContent = activity.average_heartrate ? `${activity.average_heartrate} bpm (max ${activity.max_heartrate || '--'})` : 'Non mesuré';
    if (gearEl) gearEl.textContent = gearItem ? gearItem.name : 'Chaussures par défaut';

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
