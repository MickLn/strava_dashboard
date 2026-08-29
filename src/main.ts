import { DataService } from './services/data-service.ts';
import { UIRenderer } from './components/ui-renderer.ts';
import { renderCharts } from './components/charts.ts';
import { initMap, renderActivityTraces } from './components/map.ts';
import { StravaDataset, Activity } from './types/strava.ts';

class App {
  private dataService = DataService.getInstance();
  private dataset: StravaDataset | null = null;
  private currentPeriod: 'all' | 'ytd' | '30d' = 'all';

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
      UIRenderer.showToast('⚠️ Impossible de charger les données Strava.');
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

    // Flux des activités (Étage 4)
    this.renderActivitiesForCurrentPeriod();
  }

  private renderActivitiesForCurrentPeriod(): void {
    if (!this.dataset) return;

    let filteredActivities = [...this.dataset.activities];
    const now = new Date();

    if (this.currentPeriod === 'ytd') {
      filteredActivities = filteredActivities.filter(a => new Date(a.start_date_local).getFullYear() === 2026);
    } else if (this.currentPeriod === '30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      filteredActivities = filteredActivities.filter(a => new Date(a.start_date_local) >= thirtyDaysAgo);
    }

    UIRenderer.renderActivitiesFeed(filteredActivities, this.dataset, (activity: Activity) => {
      UIRenderer.openActivityModal(activity, this.dataset!);
      renderActivityTraces(this.dataset!.activities, activity.id);
    });
  }

  private setupEventListeners(): void {
    // Boutons de période
    const tabButtons = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const period = btn.getAttribute('data-period') as 'all' | 'ytd' | '30d';
        this.currentPeriod = period || 'all';
        this.renderActivitiesForCurrentPeriod();
        UIRenderer.showToast(`Vue : ${btn.textContent}`);
      });
    });

    // Bouton de rafraîchissement forcé
    const refreshBtn = document.getElementById('btn-force-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.innerHTML = '<span>⏳ Synchronisation...</span>';
        try {
          this.dataset = await this.dataService.loadData(true);
          this.renderAll();
          UIRenderer.showToast('✅ Données Strava actualisées avec succès !');
        } catch {
          UIRenderer.showToast('⚠️ Données locales déjà à jour.');
        } finally {
          refreshBtn.innerHTML = '<span>⚡ Forcer MAJ</span>';
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
