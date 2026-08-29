import { DataService } from './services/data-service.ts';
import { UIRenderer } from './components/ui-renderer.ts';
import { renderCharts } from './components/charts.ts';
import { initMap, renderActivityTraces } from './components/map.ts';
import { StravaDataset, Activity } from './types/strava.ts';
import { i18n, Language } from './utils/i18n.ts';
import { generateActivityTags } from './utils/metrics.ts';

class App {
  private dataService = DataService.getInstance();
  private dataset: StravaDataset | null = null;
  private currentPeriod: 'all' | 'ytd' | '30d' = 'all';
  private searchQuery: string = '';
  private activeTagFilter: string = 'all';

  public async init(): Promise<void> {
    try {
      // 1. Initialisation de la carte Leaflet
      initMap('leaflet-map');

      // 2. Chargement des données Strava
      this.dataset = await this.dataService.loadData();

      // 3. Rendu du Bento Dashboard
      this.renderAll();

      // 4. Écouteurs d'événements
      this.setupEventListeners();

    } catch (error) {
      console.error("Erreur d'initialisation du dashboard:", error);
      UIRenderer.showToast('⚠️ Unable to load Strava data.');
    }
  }

  private renderAll(): void {
    if (!this.dataset) return;

    // Header & Live Hub (Étage 1)
    UIRenderer.renderHeader(this.dataset);
    UIRenderer.renderFeaturedLatestRun(this.dataset.activities, (act: Activity) => {
      UIRenderer.openActivityModal(act, this.dataset!);
    });
    UIRenderer.renderWeeklyPulse(this.dataset);

    // Records & Parc de Chaussures Rotatif (Étage 2)
    UIRenderer.renderRecords(this.dataset, (activityId) => {
      const act = this.dataset?.activities.find(a => a.id === activityId);
      if (act) {
        UIRenderer.openActivityModal(act, this.dataset!);
        renderActivityTraces(this.dataset!.activities, act.id);
      }
    });
    UIRenderer.renderShoeRotator(this.dataset);

    // Saison 2026 & Constance (Étage 3)
    renderCharts(this.dataset.activities, 2026);
    UIRenderer.renderYtdStrip(this.dataset);
    UIRenderer.renderConsistencyGrid(this.dataset.activities);

    // Carte GPS
    renderActivityTraces(this.dataset.activities);

    // Flux des activités avec recherche et tiroir interactif (Étage 4)
    this.renderActivitiesForCurrentPeriod();
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

    // Rendu avec fonction de synchronisation de la carte au survol
    UIRenderer.renderActivitiesFeed(
      filtered,
      this.dataset,
      (hoveredActivity: Activity) => {
        renderActivityTraces(this.dataset!.activities, hoveredActivity.id);
      },
      (selectedActivity: Activity) => {
        UIRenderer.openActivityModal(selectedActivity, this.dataset!);
        renderActivityTraces(this.dataset!.activities, selectedActivity.id);
      }
    );
  }

  private setupEventListeners(): void {
    // Boutons de changement de langue (EN / FR)
    const langButtons = document.querySelectorAll<HTMLButtonElement>('.lang-btn');
    langButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang') as Language;
        if (lang && lang !== i18n.getLang()) {
          i18n.setLang(lang);
          this.renderAll();
          UIRenderer.showToast(lang === 'fr' ? '🇫🇷 Langue : Français' : '🇬🇧 Language : English');
        }
      });
    });

    // Boutons de période
    const tabButtons = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const period = btn.getAttribute('data-period') as 'all' | 'ytd' | '30d';
        this.currentPeriod = period || 'all';
        this.renderActivitiesForCurrentPeriod();
        UIRenderer.showToast(`${btn.textContent}`);
      });
    });

    // Barre de recherche
    const searchInput = document.getElementById('activity-search-input') as HTMLInputElement;
    const clearBtn = document.getElementById('btn-clear-search');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = (e.target as HTMLInputElement).value;
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
        this.renderActivitiesForCurrentPeriod();
      });
    });

    // Bouton de rafraîchissement forcé
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
  }
}

// Démarrage de l'application
const app = new App();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
