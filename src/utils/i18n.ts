export type Language = 'en' | 'fr';

export const translations = {
  en: {
    // Header
    stravaConnected: "Connected to Strava",
    lastSync: "Sync",
    allTime: "All-time",
    ytd: "2026 (YTD)",
    days30: "30 days",
    forceRefresh: "Sync now",
    syncing: "Syncing...",
    syncSuccess: "Strava data refreshed successfully",
    syncLocal: "Local data already up to date",

    // Navigation
    navDashboard: "Hub",
    navAnalytics: "Charts",
    navRecords: "Records & Badges",
    navShoes: "Shoes",
    navMap: "Map",

    // Common
    distance: "Distance",
    time: "Time",
    pace: "Pace",
    energy: "Energy",
    elevation: "Elevation",

    // Latest Run
    latestRunBadge: "Latest run",
    fullDetailsBtn: "Full details",
    avgPace: "Average pace",
    heartRate: "Heart rate",
    shoesUsed: "Shoes used",
    recordedOn: "Recorded on",
    selectedActivity: "Selected run",
    startPoint: "Start",
    finishPoint: "Finish",

    // Weekly Pulse
    weeklyPulseTitle: "Weekly pulse",
    weeklyPulseSubtitle: "Consistency & streak",
    consecutiveWeeks: "consecutive active weeks",
    activeStreak: "Active streak • Consistency goal",
    activeDaysThisWeek: "Active days this week",
    runsPerWeek: "Runs / week",
    timePerWeek: "Time / week",
    distPerWeek: "Distance / week",
    calPerWeek: "Calories / week",
    mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",

    // Records
    recordsTitle: "Personal records",
    recordsSubtitle: "All-time best efforts",
    top5k: "Top 3 - 5 km",
    top10k: "Top 3 - 10 km",
    top15k: "Top 3 - Long runs (15k+)",

    // Shoe locker
    shoeLockerTitle: "Shoe locker",
    pairCount: (curr: number, total: number) => `Pair ${curr} of ${total}`,
    primaryPair: "Primary pair",
    rotationPair: "Rotation pair",
    cushioningTime: "Cushioning time",
    wear: "Wear",
    nextShoeBtn: "Next pair",

    // Season
    ytdTitle: "Year-to-date progress (2026)",
    ytdBadge: "2026 goal",
    ytdRuns: "YTD runs",
    ytdTime: "YTD time",
    ytdDist: "YTD distance",
    ytdElev: "YTD elevation",

    // Monthly Training Calendar (Strava style)
    calendarTitle: "Monthly training calendar",
    calendarSubtitle: "Training log & distance distribution",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    daysHeader: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    legendLess10: "< 10 km",
    legendLess15: "< 15 km",
    legendLess20: "< 20 km",
    legendSemi: "Semi (SM)",
    legendLess30: "< 30 km",
    legendMarathon: "Marathon (M)",
    runsLogged: (runs: number, km: number) => `${km} km • ${runs} ${runs > 1 ? 'runs' : 'run'}`,

    // Feed & Hover Drawer
    recentActivitiesTitle: "Recent activities",
    recentActivitiesSubtitle: "Click to expand session telemetry & route",
    viewDetails: "Details",
    searchPlaceholder: "Search by title, shoes, date, or tags (#10k, #morning, #brooks)...",
    filterAll: "All",
    filterLong: "Long runs (15k+)",
    filterFast: "Fast (< 5:00)",
    filterElevation: "Elevation (D+)",
    elevGain: "Elevation gain (D+)",
    elevLoss: "Elevation loss (D-)",
    altitude: "Altitude",
    device: "Watch / Device",
    difficulty: "Effort score",
    splits: "Kilometer splits",
    notRecorded: "Not recorded",
    hoverTip: "Click to expand GPS trace & detailed kilometer splits",

    // Heatmap & Maps
    fullscreenHeatmapBtn: "Fullscreen Heatmap",
    closeHeatmapBtn: "Close",

    // Effort Zones
    effortZonesTitle: "Effort & Pace Zones",
    effortZonesSubtitle: "Physiological distribution (Cardio watch or Jack Daniels pace model)",
    totalEffortAnalyzed: "Total analyzed",
    watchPaceSplit: (watches: number, paces: number) => `${watches} runs with heart rate • ${paces} runs with Jack Daniels model`,

    // Achievements
    achievementsTitle: "Achievements & Milestones",
    achievementsSubtitle: "Career badges & unlocked milestones",
    unlockedBadge: "Unlocked",
    inProgressBadge: "In progress",

    // Shoe health
    cushionHealth: "Cushion health",
    kmRemainingText: (km: number) => `~${km} km remaining`,

    // Footer
    footerTitle: "Personal runner dashboard • Deployed on GitHub Pages",
    footerSubtitle: "Modern runner bento • 0ms serverless API"
  },
  fr: {
    // Header
    stravaConnected: "Connecté Strava",
    lastSync: "Sync",
    allTime: "Depuis le début",
    ytd: "2026 (Cumul annuel)",
    days30: "30 jours",
    forceRefresh: "Synchroniser",
    syncing: "Synchronisation...",
    syncSuccess: "Données Strava actualisées avec succès",
    syncLocal: "Données locales déjà à jour",

    // Navigation
    navDashboard: "Hub",
    navAnalytics: "Graphiques",
    navRecords: "Records & Trophées",
    navShoes: "Matériel",
    navMap: "Carte",

    // Latest Run
    latestRunBadge: "Dernière sortie",
    fullDetailsBtn: "Détails",
    distance: "Distance",
    time: "Durée",
    pace: "Allure",
    energy: "Énergie",
    elevation: "Dénivelé",
    avgPace: "Allure moyenne",
    heartRate: "Fréquence cardiaque",
    shoesUsed: "Chaussures utilisées",
    recordedOn: "Enregistrée le",
    selectedActivity: "Séance sélectionnée",
    startPoint: "Départ",
    finishPoint: "Arrivée",

    // Weekly Pulse
    weeklyPulseTitle: "Rythme hebdomadaire",
    weeklyPulseSubtitle: "Régularité & série active",
    consecutiveWeeks: "semaines consécutives actives",
    activeStreak: "Série active • Objectif régularité",
    activeDaysThisWeek: "Jours actifs cette semaine",
    runsPerWeek: "Sorties / sem",
    timePerWeek: "Temps / sem",
    distPerWeek: "Distance / sem",
    calPerWeek: "Calories / sem",
    mon: "Lun", tue: "Mar", wed: "Mer", thu: "Jeu", fri: "Ven", sat: "Sam", sun: "Dim",

    // Records
    recordsTitle: "Records personnels",
    recordsSubtitle: "Meilleures performances historiques",
    top5k: "Top 3 - 5 km",
    top10k: "Top 3 - 10 km",
    top15k: "Top 3 - Sorties longues (15k+)",

    // Shoe locker
    shoeLockerTitle: "Parc de chaussures",
    pairCount: (curr: number, total: number) => `Paire ${curr} sur ${total}`,
    primaryPair: "Paire principale",
    rotationPair: "Paire de rotation",
    cushioningTime: "Temps d'amorti",
    wear: "Usure",
    nextShoeBtn: "Paire suivante",

    // Season
    ytdTitle: "Progression de la saison (2026)",
    ytdBadge: "Objectif 2026",
    ytdRuns: "Sorties 2026",
    ytdTime: "Temps 2026",
    ytdDist: "Distance 2026",
    ytdElev: "Dénivelé 2026",

    // Monthly Training Calendar (Strava style)
    calendarTitle: "Calendrier d'entraînement",
    calendarSubtitle: "Log des séances et répartition des distances",
    prevMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    daysHeader: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    legendLess10: "< 10 km",
    legendLess15: "< 15 km",
    legendLess20: "< 20 km",
    legendSemi: "Semi (SM)",
    legendLess30: "< 30 km",
    legendMarathon: "Marathon (M)",
    runsLogged: (runs: number, km: number) => `${km} km • ${runs} ${runs > 1 ? 'sorties' : 'sortie'}`,

    // Feed & Hover Drawer
    recentActivitiesTitle: "Activités récentes",
    recentActivitiesSubtitle: "Cliquez pour dérouler les détails et le tracé de la séance",
    viewDetails: "Détails",
    searchPlaceholder: "Rechercher par titre, chaussure, date ou tag (#10k, #matin, #brooks)...",
    filterAll: "Toutes",
    filterLong: "Sorties longues (15k+)",
    filterFast: "Rapides (< 5:00)",
    filterElevation: "Dénivelé (D+)",
    elevGain: "Dénivelé positif (D+)",
    elevLoss: "Dénivelé négatif (D-)",
    altitude: "Altitude",
    device: "Appareil",
    difficulty: "Score d'effort",
    splits: "Allures par kilomètre",
    notRecorded: "Non mesuré",
    hoverTip: "Cliquez pour afficher le tracé GPS et le détail des kilomètres",

    // Heatmap & Maps
    fullscreenHeatmapBtn: "Heatmap Plein Écran",
    closeHeatmapBtn: "Fermer",

    // Effort Zones
    effortZonesTitle: "Zones d'Effort & Allure",
    effortZonesSubtitle: "Répartition physiologique (Cardio ou Modèle Jack Daniels)",
    totalEffortAnalyzed: "Total analysé",
    watchPaceSplit: (watches: number, paces: number) => `${watches} sorties avec cardio • ${paces} sorties avec modèle Jack Daniels`,

    // Achievements
    achievementsTitle: "Trophées & Badges",
    achievementsSubtitle: "Jalons et accomplissements de carrière",
    unlockedBadge: "Débloqué",
    inProgressBadge: "En cours",

    // Shoe health
    cushionHealth: "Santé de l'amorti",
    kmRemainingText: (km: number) => `~${km} km restants`,

    // Footer
    footerTitle: "Tableau de bord de course personnel • Déployé sur GitHub Pages",
    footerSubtitle: "Bento moderne de runner • API serverless 0ms"
  }
};

class I18nService {
  private static instance: I18nService;
  private currentLang: Language = 'en';

  private constructor() {
    const saved = localStorage.getItem('strava_dash_lang') as Language;
    if (saved === 'en' || saved === 'fr') {
      this.currentLang = saved;
    }
  }

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  public getLang(): Language {
    return this.currentLang;
  }

  public setLang(lang: Language): void {
    this.currentLang = lang;
    localStorage.setItem('strava_dash_lang', lang);
    document.documentElement.lang = lang;
  }

  public t() {
    return translations[this.currentLang];
  }
}

export const i18n = I18nService.getInstance();
