import { DataService } from './services/data-service.ts';
import { UIRenderer } from './components/ui-renderer.ts';
import { renderCharts } from './components/charts.ts';
import { initMap, renderActivityTraces, initPageAtlasMap, invalidateMapSize, openFullscreenHeatmap, closeFullscreenHeatmap } from './components/map.ts';
import { InteractivePreloader } from './components/preloader.ts';
import { Router, PageId } from './components/router.ts';
import { StravaDataset, Activity } from './types/strava.ts';
import { i18n, Language } from './utils/i18n.ts';
import { generateActivityTags } from './utils/metrics.ts';

const INTRO_FX_KEY = 'strava_intro_fx_enabled';

class App {
  private dataService = DataService.getInstance();
  private router = Router.getInstance();
  private dataset: StravaDataset | null = null;
  private currentPeriod: 'all' | 'ytd' | '30d' = 'all';
  private searchQuery: string = '';
  private activeTagFilter: string = 'all';
  private feedLimit: number = 10;
  private preloader = new InteractivePreloader();

  public async init(): Promise<void> {
    try {
      // 0. Lancement conditionnel de l'animation d'entrée selon le toggle persistant
      const introFxEnabled = localStorage.getItem(INTRO_FX_KEY) !== 'false';
      if (introFxEnabled) {
        this.preloader.start();
      } else {
        const overlay = document.getElementById('preloader-overlay');
        if (overlay) overlay.style.display = 'none';
      }

      // 1. Initialisation de la navigation multi-pages
      this.router.init();
      this.router.onPageChange((page: PageId) => {
        this.handlePageSwitch(page);
      });

      // 2. Initialisation de la carte Leaflet du Dashboard
      initMap('leaflet-map');

      // 3. Chargement des données Strava
      this.dataset = await this.dataService.loadData();
      if (introFxEnabled) {
        this.preloader.setDatasetReady(this.dataset.activities);
      }

      // 4. Rendu des composants sur leurs pages dédiées
      this.renderAll();

      // 5. Écouteurs d'événements
      this.setupEventListeners();

      // 6. Gestion de la page courante au chargement
      this.handlePageSwitch(this.router.getCurrentPage());

    } catch (error) {
      console.error("Erreur d'initialisation du dashboard:", error);
      UIRenderer.showToast('Unable to load Strava data.');
    }
  }

  private handlePageSwitch(page: PageId): void {
    if (!this.dataset) return;

    if (page === 'dashboard') {
      setTimeout(() => {
        invalidateMapSize();
        if (this.dataset?.activities) {
          renderActivityTraces(this.dataset.activities);
        }
      }, 50);
    } else if (page === 'analytics') {
      setTimeout(() => {
        if (this.dataset?.activities) {
          renderCharts(this.dataset.activities, 2026);
        }
      }, 50);
    } else if (page === 'map') {
      setTimeout(() => {
        if (this.dataset?.activities) {
          initPageAtlasMap('page-heatmap-container', this.dataset.activities);
        }
      }, 50);
    }
  }

  private renderAll(): void {
    if (!this.dataset) return;

    // Header & Navigation i18n
    UIRenderer.renderHeader(this.dataset);
    this.updateNavLabels();

    // Page 1 : Dashboard (Dernière sortie, Weekly Pulse, Calendrier mensuel)
    UIRenderer.renderFeaturedLatestRun(this.dataset.activities, (act: Activity) => {
      UIRenderer.openActivityModal(act, this.dataset!);
    });
    UIRenderer.renderWeeklyPulse(this.dataset);
    UIRenderer.setupCalendarNavigation(this.dataset.activities, (act: Activity) => {
      renderActivityTraces(this.dataset!.activities, act.id);
    });
    UIRenderer.renderMonthlyCalendar(this.dataset.activities, (act: Activity) => {
      renderActivityTraces(this.dataset!.activities, act.id);
    });
    renderActivityTraces(this.dataset.activities);
    this.renderActivitiesForCurrentPeriod();

    // Page 2 : Analytics (Progression YTD & Objectif)
    renderCharts(this.dataset.activities, 2026);
    UIRenderer.renderYtdStrip(this.dataset);

    // Page 3 : Records & Trophées
    UIRenderer.renderRecords(this.dataset, (activityId) => {
      const act = this.dataset?.activities.find(a => a.id === activityId);
      if (act) {
        UIRenderer.openActivityModal(act, this.dataset!);
      }
    });
    UIRenderer.renderAchievements(this.dataset);

    // Page 4 : Shoe Locker
    UIRenderer.renderShoeRotator(this.dataset);

    // Page 5 : Atlas GPS Heatmap
    if (this.router.getCurrentPage() === 'map') {
      initPageAtlasMap('page-heatmap-container', this.dataset.activities);
    }
  }

  private updateNavLabels(): void {
    const t = i18n.t();
    const lblDash = document.getElementById('lbl-nav-dashboard');
    const lblAnalytics = document.getElementById('lbl-nav-analytics');
    const lblRecords = document.getElementById('lbl-nav-records');
    const lblShoes = document.getElementById('lbl-nav-shoes');
    const lblMap = document.getElementById('lbl-nav-map');

    if (lblDash) lblDash.textContent = t.navDashboard;
    if (lblAnalytics) lblAnalytics.textContent = t.navAnalytics;
    if (lblRecords) lblRecords.textContent = t.navRecords;
    if (lblShoes) lblShoes.textContent = t.navShoes;
    if (lblMap) lblMap.textContent = t.navMap;
  }

  private renderActivitiesForCurrentPeriod(): void {
    if (!this.dataset) return;

    let filtered = [...this.dataset.activities];
    const now = new Date();

    // 1. Filtre temporel
    if (this.currentPeriod === 'ytd') {
      filtered = filtered.filter(a => new Date(a.start_date_local).getFullYear() === 2026);
    } else if (this.currentPeriod === '30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      filtered = filtered.filter(a => new Date(a.start_date_local) >= thirtyDaysAgo);
    }

    // 2. Filtre par Tag rapide
    if (this.activeTagFilter !== 'all') {
      filtered = filtered.filter(a => {
        const gear = this.dataset?.gear.find(g => g.id === a.gear_id);
        const tags = generateActivityTags(a, gear?.name);
        return tags.includes(this.activeTagFilter);
      });
    }

    // 3. Filtre par recherche textuelle
    if (this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(a => {
        const gear = this.dataset?.gear.find(g => g.id === a.gear_id);
        const gearName = (gear?.name || '').toLowerCase();
        const title = (a.name || '').toLowerCase();
        const date = (a.start_date_local || '').toLowerCase();
        const dist = `${(a.distance / 1000).toFixed(1)}km`.toLowerCase();
        const tags = generateActivityTags(a, gear?.name).join(' ').toLowerCase();

        return title.includes(query) ||
               gearName.includes(query) ||
               date.includes(query) ||
               dist.includes(query) ||
               tags.includes(query);
      });
    }

    UIRenderer.renderActivitiesFeed(
      filtered,
      this.dataset,
      (act) => {
        renderActivityTraces(this.dataset!.activities, act.id);
      },
      this.feedLimit,
      () => {
        this.feedLimit += 10;
        this.renderActivitiesForCurrentPeriod();
      }
    );
  }

  private setupEventListeners(): void {
    // Sélecteur de langue EN / FR
    const langBtns = document.querySelectorAll<HTMLButtonElement>('.lang-btn');
    langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedLang = btn.getAttribute('data-lang') as Language;
        if (selectedLang && selectedLang !== i18n.getLang()) {
          i18n.setLang(selectedLang);
          langBtns.forEach(b => b.classList.toggle('active', b === btn));
          this.renderAll();
        }
      });
    });

    // Barre de recherche
    const searchInput = document.getElementById('activity-search-input') as HTMLInputElement;
    const clearBtn = document.getElementById('btn-clear-search');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = (e.target as HTMLInputElement).value;
        this.feedLimit = 10;
        if (clearBtn) {
          clearBtn.style.display = this.searchQuery ? 'block' : 'none';
        }
        this.renderActivitiesForCurrentPeriod();
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        this.searchQuery = '';
        this.feedLimit = 10;
        clearBtn.style.display = 'none';
        this.renderActivitiesForCurrentPeriod();
      });
    }

    // Puces de filtres par tags
    const tagChips = document.querySelectorAll<HTMLButtonElement>('.tag-chip');
    tagChips.forEach(chip => {
      chip.addEventListener('click', () => {
        tagChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeTagFilter = chip.getAttribute('data-tag') || 'all';
        this.feedLimit = 10;
        this.renderActivitiesForCurrentPeriod();
      });
    });

    // Bouton de rafraîchissement forcé dans le modal de profil
    const refreshBtn = document.getElementById('btn-force-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        const t = i18n.t();
        refreshBtn.innerHTML = `<span>${t.syncing}</span>`;
        try {
          this.dataset = await this.dataService.loadData(true);
          this.renderAll();
          UIRenderer.showToast(t.syncSuccess);
        } catch {
          UIRenderer.showToast(t.syncLocal);
        } finally {
          refreshBtn.innerHTML = `<span>${t.forceRefresh}</span>`;
        }
      });
    }

    // Bouton Switch Intro FX (ON / OFF) Persistant
    const togglePreloaderBtn = document.getElementById('btn-toggle-preloader');
    if (togglePreloaderBtn) {
      const isCurrentlyEnabled = localStorage.getItem(INTRO_FX_KEY) !== 'false';
      togglePreloaderBtn.classList.toggle('active', isCurrentlyEnabled);

      togglePreloaderBtn.addEventListener('click', () => {
        const isNowActive = togglePreloaderBtn.classList.toggle('active');
        localStorage.setItem(INTRO_FX_KEY, isNowActive ? 'true' : 'false');
        const isFr = i18n.getLang() === 'fr';
        if (isNowActive) {
          this.preloader.replay(this.dataset?.activities);
          UIRenderer.showToast(isFr ? "Intro FX activée (jouée au chargement)" : "Intro FX enabled (plays on reload)");
        } else {
          UIRenderer.showToast(isFr ? "Intro FX désactivée (accès direct au rechargement)" : "Intro FX disabled (instant dashboard on reload)");
        }
      });
    }

    // Gestion de l'ouverture / fermeture du modal de Profil
    const openProfileBtn = document.getElementById('btn-open-profile');
    const profileModal = document.getElementById('profile-modal');
    const closeProfileBtn = document.getElementById('btn-close-profile');

    if (openProfileBtn && profileModal) {
      openProfileBtn.addEventListener('click', () => {
        profileModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    }

    if (closeProfileBtn && profileModal) {
      closeProfileBtn.addEventListener('click', () => {
        profileModal.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    if (profileModal) {
      profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) {
          profileModal.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    }

    // Bouton Heatmap plein écran
    const openHeatmapBtn = document.getElementById('btn-open-heatmap');
    if (openHeatmapBtn) {
      openHeatmapBtn.addEventListener('click', () => {
        if (this.dataset?.activities) {
          openFullscreenHeatmap(this.dataset.activities);
        }
      });
    }

    const closeHeatmapBtn = document.getElementById('btn-close-heatmap');
    if (closeHeatmapBtn) {
      closeHeatmapBtn.addEventListener('click', () => {
        closeFullscreenHeatmap();
      });
    }

    // Modal close
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => UIRenderer.closeActivityModal());
    }

    const modalOverlay = document.getElementById('activity-modal');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          UIRenderer.closeActivityModal();
        }
      });
    }

    // Gestion du redimensionnement d'écran & rotation mobile
    let resizeTimer: number;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (this.dataset?.activities) {
          renderActivityTraces(this.dataset.activities);
        }
      }, 150);
    });
  }
}

// Démarrage de l'application
const app = new App();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
