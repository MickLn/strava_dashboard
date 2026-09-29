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
    navRecords: "Records",
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

    // Current Week Activity
    weeklyPulseTitle: "Current week",
    weeklyPulseSubtitle: "",
    consecutiveWeeks: "active weeks",
    activeStreak: "Active streak • Consistency goal",
    activeDaysThisWeek: "Active days this week",
    runsPerWeek: "Runs",
    timePerWeek: "Time",
    distPerWeek: "Distance",
    calPerWeek: "Calories",
    mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",

    // Records
    recordsTitle: "Personal records",
    recordsSubtitle: "All-time best efforts",
    top5k: "Top 3 - 5 km",
    top10k: "Top 3 - 10 km",
    top15k: "Top 3 - Long runs (15k+)",
    careerStatsTitle: "Global statistics",
    careerStatsSubtitle: "Career totals & current season overview",
    careerStatsBadge: "Career & YTD",
    careerAllTimeTitle: "All-time career",
    careerAllTimePeriod: "All activities",
    careerStatDist: "Distance",
    careerStatRuns: "Runs",
    careerStatTime: "Moving time",
    careerStatElev: "Elevation gain",
    careerUnitRuns: "runs",
    careerStatTimeAllSub: "In motion",
    careerStatRunsAllSub: "Total sessions",
    careerStatElevAllSub: "Total D+ climbed",
    careerYtdTitle: "Season 2026 (YTD)",
    careerYtdPct: (pct: number) => `${pct}% of total volume`,
    careerStatDistYtd: "Distance 2026",
    careerStatRunsYtd: "Runs 2026",
    careerStatTimeYtd: "Time 2026",
    careerStatElevYtd: "Elevation 2026",
    careerStatRunsYtdSub: "This year",
    careerStatTimeYtdSub: "This year",
    careerStatElevYtdSub: "D+ this year",
    annualCalendarTitle: "Annual calendar",
    annualCalendarSubtitle: "Days run by date throughout the year",
    annualCalendarSummary: (active: number, total: number, pct: number) => `${active} / ${total} days run (${pct}%)`,
    annualLegendLabel: "Intensity:",
    annualLegend0: "0 run",
    annualLegend1: "1 year",
    annualLegend2: "2 years",
    annualLegend3: "3 years",
    annualLegend4: "4+ years",
    currentMonthBadge: "Current",
    multiRunTitle: (dateStr: string, count: number) => `${count} runs on ${dateStr}`,
    multiRunSubtitle: "Select a run to view activity details",

    // Shoe locker
    shoeLockerTitle: "Shoe locker",
    pairCount: (curr: number, total: number) => `Pair ${curr} of ${total}`,
    primaryPair: "Primary pair",
    rotationPair: "Rotation pair",
    cushioningTime: "Cushioning time",
    wear: "Wear",
    nextShoeBtn: "Next pair",
    shoeRecordsTitle: "Pair Records & Best Efforts",
    shoeRecordsSubtitle: "Fastest splits and benchmark efforts logged with this pair",
    shoeHistoryTitle: "Activity History",
    shoeHistorySubtitle: "All runs logged with this pair",
    shoeHistorySearch: "Search runs by title...",
    shoeNoActivities: "No runs recorded for this pair yet",
    shoeTotalRuns: "Total Runs",
    shoeAvgPace: "Average Pace",
    shoeTotalElevation: "Elevation Gain",
    shoeBest1k: "Best 1 km",
    shoeBest5k: "Best 5 km",
    shoeBest10k: "Best 10 km",
    shoeBest15k: "Best 15 km",
    shoeBestSemi: "Half-Marathon (21.1k)",
    shoeLongestRun: "Longest Run",
    shoeFastestRun: "Fastest Session",

    // Season
    ytdTitle: "Year-to-date progress (2026)",
    ytdBadge: "2026 goal",
    ytdRuns: "YTD runs",
    ytdTime: "YTD time",
    ytdDist: "YTD distance",
    ytdElev: "YTD elevation",

    // Analytics & Charts (Volume, D+, Allure, Habitudes)
    chartMultiyearEyebrow: "MONTHLY VOLUME",
    chartMultiyearTitle: "Monthly Volume",
    chartMultiyearSub: "Kilometers run per month and % variation",
    chartMultiyearBadge: "+44% vs 2025",
    chartMultiyearStatTotal: "2026 Volume",
    chartMultiyearStatComp: "YTD Progression",
    chartMultiyearStatPeak: "Monthly Peak",
    chartMultiyearLegend2026: "2026 (Current)",
    chartMultiyearLegend2025: "2025",
    chartMultiyearLegend2024: "2024",

    chartElevationEyebrow: "ELEVATION GAIN",
    chartElevationTitle: "Elevation Gain",
    chartElevationSub: "Meters of D+ climbed each month (2026)",
    chartElevationBadge: "+5,212 m D+ in 2026",
    chartElevationAvg: "Monthly Average",
    chartElevationPeak: "Steepest Month",
    chartElevationRatio: "Avg D+ per run",

    chartPaceEyebrow: "PACE & SPEED",
    chartPaceTitle: "Average Pace",
    chartPaceSub: "Monthly average pace (min/km) over the last 12 active months",
    chartPaceBadge: "Peak pace: 5:27 /km",
    chartPaceCurrent: "Recent Pace",
    chartPaceBest: "Monthly Record",
    chartPaceRange: "Pace Amplitude",

    chartHabitsSectionTitle: "Training Habits & Run Types",
    chartHabitsSectionSub: "Session breakdown and weekly training routines",

    chartDistTypesEyebrow: "SESSION PROFILE",
    chartDistTypesTitle: "Distance Distribution",
    chartDistTypesSub: "Breakdown of the 290 sessions by distance",
    chartDistTypesBadge: "73% in 6-12 km",

    chartDayFreqEyebrow: "WEEKLY ROUTINE",
    chartDayFreqTitle: "Favorite Training Days",
    chartDayFreqSub: "Number of runs per day of the week",
    chartDayFreqBadge: "Saturday #1 (62 runs)",
    chartDayStatTop: "Peak Training Day",
    chartDayStatSplit: "Weekday vs Weekend",
    chartDayStatRest: "Preferred Rest Day",

    distCatShort: "Short (< 6 km)",
    distCatMid: "Mid (6 – 12 km)",
    distCatLong: "Long (12 – 18 km)",
    distCatXl: "Half & XL (> 18 km)",

    // Monthly Training Calendar (Strava style)
    calendarTitle: "Monthly consistency",
    calendarSubtitle: "",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    daysHeader: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    legendLess10: "< 10 km",
    legendLess15: "< 15 km",
    legendLess20: "< 20 km",
    legendSemi: "Semi (SM)",
    legendLess30: "< 30 km",
    legendMarathon: "Marathon (M)",
    legendBtn: "Legend",
    runsLogged: (runs: number, km: number) => `${km} km • ${runs} ${runs > 1 ? 'runs' : 'run'}`,

    // Feed & Hover Drawer
    recentActivitiesTitle: "Activities",
    recentActivitiesSubtitle: "",
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
    atlasAllTracks: "All tracks",
    atlasLatestTrack: "Latest run",
    runsCountBadge: (count: number) => `${count} ${count > 1 ? 'runs' : 'run'}`,

    // Effort Zones
    effortZonesTitle: "Effort & Pace Zones",
    effortZonesSubtitle: "Physiological distribution (Cardio watch or Jack Daniels pace model)",
    totalEffortAnalyzed: "Total analyzed",
    watchPaceSplit: (watches: number, paces: number) => `${watches} runs with heart rate • ${paces} runs with Jack Daniels model`,

    // Achievements
    achievementsTitle: "Universal Runner Achievements",
    achievementsSubtitle: "50 Career Trophies & Masteries",
    unlockedBadge: "Unlocked",
    inProgressBadge: "In progress",
    catAll: "All (50)",
    catSpeed: "Speed & Pace",
    catDistance: "Distances",
    catTraining: "Training & Cardio",
    catStreak: "Consistency",
    catLifestyle: "Lifestyle & Rituals",
    catGear: "Gear & Exploration",
    tierBronze: "Bronze",
    tierSilver: "Silver",
    tierGold: "Gold",
    tierDiamond: "Diamond",
    achFilterAll: "All",
    achFilterUnlocked: "Unlocked",
    achFilterLocked: "In progress",
    runnerLevel: (lvl: number, rank: string) => `Level ${lvl} • ${rank}`,
    achievementsSummary: (unlocked: number, total: number, pct: number) => `${unlocked} / ${total} Trophies Unlocked • ${pct}% Complete`,

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
    navRecords: "Records",
    navShoes: "Chaussures",
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

    // Current Week Activity
    weeklyPulseTitle: "Semaine actuelle",
    weeklyPulseSubtitle: "",
    consecutiveWeeks: "semaines actives",
    activeStreak: "Série active • Objectif régularité",
    activeDaysThisWeek: "Jours actifs cette semaine",
    runsPerWeek: "Sorties",
    timePerWeek: "Durée",
    distPerWeek: "Distance",
    calPerWeek: "Calories",
    mon: "Lun", tue: "Mar", wed: "Mer", thu: "Jeu", fri: "Ven", sat: "Sam", sun: "Dim",

    // Records
    recordsTitle: "Records personnels",
    recordsSubtitle: "Meilleures performances historiques",
    top5k: "Top 3 - 5 km",
    top10k: "Top 3 - 10 km",
    top15k: "Top 3 - Sorties longues (15k+)",
    careerStatsTitle: "Statistiques globales",
    careerStatsSubtitle: "Cumul de carrière et saison en cours",
    careerStatsBadge: "Carrière & YTD",
    careerAllTimeTitle: "Total carrière",
    careerAllTimePeriod: "Toutes activités",
    careerStatDist: "Distance",
    careerStatRuns: "Courses",
    careerStatTime: "Temps couru",
    careerStatElev: "Dénivelé positif",
    careerUnitRuns: "runs",
    careerStatTimeAllSub: "En mouvement",
    careerStatRunsAllSub: "Séances totales",
    careerStatElevAllSub: "D+ total gravi",
    careerYtdTitle: "Année 2026 (YTD)",
    careerYtdPct: (pct: number) => `${pct}% du volume`,
    careerStatDistYtd: "Distance 2026",
    careerStatRunsYtd: "Courses 2026",
    careerStatTimeYtd: "Temps 2026",
    careerStatElevYtd: "Dénivelé 2026",
    careerStatRunsYtdSub: "Cette année",
    careerStatTimeYtdSub: "Cette année",
    careerStatElevYtdSub: "D+ cette année",
    annualCalendarTitle: "Calendrier annuel",
    annualCalendarSubtitle: "Jours courus par date dans l'année",
    annualCalendarSummary: (active: number, total: number, pct: number) => `${active} / ${total} jours courus (${pct}%)`,
    annualLegendLabel: "Intensité :",
    annualLegend0: "0 course",
    annualLegend1: "1 an",
    annualLegend2: "2 ans",
    annualLegend3: "3 ans",
    annualLegend4: "4+ ans",
    currentMonthBadge: "En cours",
    multiRunTitle: (dateStr: string, count: number) => `${count} courses le ${dateStr}`,
    multiRunSubtitle: "Sélectionnez une course pour afficher les détails",

    // Shoe locker
    shoeLockerTitle: "Vestiaire chaussures",
    pairCount: (curr: number, total: number) => `Paire ${curr} sur ${total}`,
    primaryPair: "Paire principale",
    rotationPair: "Paire de rotation",
    cushioningTime: "Temps d'amorti",
    wear: "Usure",
    nextShoeBtn: "Paire suivante",
    shoeRecordsTitle: "Records & Meilleurs efforts de la paire",
    shoeRecordsSubtitle: "Chronos de référence et records réalisés avec cette paire",
    shoeHistoryTitle: "Historique des courses",
    shoeHistorySubtitle: "Toutes les séances courues avec cette paire",
    shoeHistorySearch: "Rechercher une séance...",
    shoeNoActivities: "Aucune course enregistrée avec cette paire",
    shoeTotalRuns: "Total courses",
    shoeAvgPace: "Allure moyenne",
    shoeTotalElevation: "Dénivelé cumulé",
    shoeBest1k: "Meilleur 1 km",
    shoeBest5k: "Meilleur 5 km",
    shoeBest10k: "Meilleur 10 km",
    shoeBest15k: "Meilleur 15 km",
    shoeBestSemi: "Semi-Marathon (21.1k)",
    shoeLongestRun: "Plus longue sortie",
    shoeFastestRun: "Sortie la plus rapide",

    // Season
    ytdTitle: "Progression de la saison (2026)",
    ytdBadge: "Objectif 2026",
    ytdRuns: "Sorties 2026",
    ytdTime: "Temps 2026",
    ytdDist: "Distance 2026",
    ytdElev: "Dénivelé 2026",

    // Analytics & Charts (Volume, D+, Allure, Habitudes)
    chartMultiyearEyebrow: "VOLUME MENSUEL",
    chartMultiyearTitle: "Volume mensuel",
    chartMultiyearSub: "Kilomètres courus par mois et évolution en %",
    chartMultiyearBadge: "+44% vs 2025",
    chartMultiyearStatTotal: "Total 2026",
    chartMultiyearStatComp: "Progression à date",
    chartMultiyearStatPeak: "Pic mensuel",
    chartMultiyearLegend2026: "2026 (En cours)",
    chartMultiyearLegend2025: "2025",
    chartMultiyearLegend2024: "2024",

    chartElevationEyebrow: "DÉNIVELÉ POSITIF",
    chartElevationTitle: "Dénivelé positif",
    chartElevationSub: "Mètres de D+ gravis chaque mois (2026)",
    chartElevationBadge: "+5 212 m D+ en 2026",
    chartElevationAvg: "Moyenne mensuelle",
    chartElevationPeak: "Mois le plus raide",
    chartElevationRatio: "D+ moyen par run",

    chartPaceEyebrow: "RYTHME & VITESSE",
    chartPaceTitle: "Allure moyenne",
    chartPaceSub: "Moyenne mensuelle (min/km) sur les 12 derniers mois actifs",
    chartPaceBadge: "Allure pic : 5:27 /km",
    chartPaceCurrent: "Allure récente",
    chartPaceBest: "Record mensuel",
    chartPaceRange: "Amplitude d'allure",

    chartHabitsSectionTitle: "Habitudes & Typologie de sorties",
    chartHabitsSectionSub: "Profil des séances et routines d'entraînement réelles",

    chartDistTypesEyebrow: "PROFIL DES SÉANCES",
    chartDistTypesTitle: "Distribution par distance",
    chartDistTypesSub: "Répartition des 290 séances selon leur longueur",
    chartDistTypesBadge: "73% en 6-12 km",

    chartDayFreqEyebrow: "ROUTINE HEBDOMADAIRE",
    chartDayFreqTitle: "Jours d'entraînement favoris",
    chartDayFreqSub: "Nombre de sorties par jour de la semaine",
    chartDayFreqBadge: "Samedi n°1 (62 sorties)",
    chartDayStatTop: "Jour de pointe",
    chartDayStatSplit: "Semaine vs Week-end",
    chartDayStatRest: "Jour de repos privilégié",

    distCatShort: "Courtes (< 6 km)",
    distCatMid: "Moyennes (6 – 12 km)",
    distCatLong: "Longues (12 – 18 km)",
    distCatXl: "Semi & XL (> 18 km)",

    // Monthly Training Calendar (Strava style)
    calendarTitle: "Constance mensuelle",
    calendarSubtitle: "",
    prevMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    daysHeader: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    legendLess10: "< 10 km",
    legendLess15: "< 15 km",
    legendLess20: "< 20 km",
    legendSemi: "Semi (SM)",
    legendLess30: "< 30 km",
    legendMarathon: "Marathon (M)",
    legendBtn: "Légende",
    runsLogged: (runs: number, km: number) => `${km} km • ${runs} ${runs > 1 ? 'sorties' : 'sortie'}`,

    // Feed & Hover Drawer
    recentActivitiesTitle: "Activités",
    recentActivitiesSubtitle: "",
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
    atlasAllTracks: "Tous les tracés",
    atlasLatestTrack: "Dernière course",
    runsCountBadge: (count: number) => `${count} ${count > 1 ? 'courses' : 'course'}`,

    // Effort Zones
    effortZonesTitle: "Zones d'Effort & Allure",
    effortZonesSubtitle: "Répartition physiologique (Cardio ou Modèle Jack Daniels)",
    totalEffortAnalyzed: "Total analysé",
    watchPaceSplit: (watches: number, paces: number) => `${watches} sorties avec cardio • ${paces} sorties avec modèle Jack Daniels`,

    // Achievements
    achievementsTitle: "Les 50 Défis Universels",
    achievementsSubtitle: "Trophées de Carrière & Accomplissements",
    unlockedBadge: "Débloqué",
    inProgressBadge: "En cours",
    catAll: "Tous (50)",
    catSpeed: "Vitesse & Allure",
    catDistance: "Distances",
    catTraining: "Entraînement & Cardio",
    catStreak: "Régularité",
    catLifestyle: "Rituels & Météo",
    catGear: "Équipement & Spots",
    tierBronze: "Bronze",
    tierSilver: "Argent",
    tierGold: "Or",
    tierDiamond: "Diamant",
    achFilterAll: "Tous",
    achFilterUnlocked: "Débloqués",
    achFilterLocked: "À débloquer",
    runnerLevel: (lvl: number, rank: string) => `Niveau ${lvl} • ${rank}`,
    achievementsSummary: (unlocked: number, total: number, pct: number) => `${unlocked} / ${total} Trophées Débloqués • ${pct}% Complété`,

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
