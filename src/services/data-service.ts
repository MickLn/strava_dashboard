import { StravaDataset } from '../types/strava.ts';

const CACHE_KEY = 'strava_dashboard_data_v1';
const PIN_KEY = 'strava_dashboard_pin';

export class DataService {
  private static instance: DataService;
  private currentDataset: StravaDataset | null = null;

  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  /**
   * Charge les données Strava depuis le fichier statique ou le cache local
   */
  public async loadData(forceRefresh: boolean = false): Promise<StravaDataset> {
    if (!forceRefresh && this.currentDataset) {
      return this.currentDataset;
    }

    // Essayer de lire depuis le cache si pas de forceRefresh
    if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          this.currentDataset = JSON.parse(cached);
          if (this.currentDataset) return this.currentDataset;
        } catch (e) {
          console.warn('Cache local invalide, rechargement...', e);
        }
      }
    }

    // Charger depuis le fichier statique json
    const basePath = import.meta.env.BASE_URL || './';
    const jsonUrl = `${basePath.replace(/\/$/, '')}/data/strava_data.json?t=${Date.now()}`;

    try {
      const response = await fetch(jsonUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: StravaDataset = await response.json();
      this.currentDataset = data;
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Erreur lors du chargement des données Strava:', error);
      // Si un cache existe même vieux, on l'utilise en fallback
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        this.currentDataset = JSON.parse(cached);
        return this.currentDataset!;
      }
      throw error;
    }
  }

  /**
   * Sauvegarde un jeu de données mis à jour
   */
  public saveLocalData(dataset: StravaDataset): void {
    this.currentDataset = dataset;
    localStorage.setItem(CACHE_KEY, JSON.stringify(dataset));
  }

  /**
   * Gestion du code PIN optionnel
   */
  public checkPin(enteredPin: string): boolean {
    const savedPin = localStorage.getItem(PIN_KEY);
    if (!savedPin) return true; // Pas de PIN défini
    return savedPin === enteredPin;
  }

  public setPin(pin: string): void {
    if (!pin) {
      localStorage.removeItem(PIN_KEY);
    } else {
      localStorage.setItem(PIN_KEY, pin);
    }
  }

  public hasPin(): boolean {
    return !!localStorage.getItem(PIN_KEY);
  }
}
