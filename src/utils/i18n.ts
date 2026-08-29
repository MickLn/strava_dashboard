export type Language = 'en' | 'fr';

export const translations = {
  en: {
    // Header
    stravaConnected: "Connected to Strava",
    lastSync: "Sync",
    allTime: "All-time",
    ytd: "2026 (YTD)",
    days30: "30 days",
    forceRefresh: "⚡ Sync now",
    syncing: "⏳ Syncing...",
    syncSuccess: "✅ Strava data refreshed successfully!",
    syncLocal: "⚠️ Local data already up to date.",

    // Latest Run
    latestRunBadge: "🔥 Latest run",
    fullDetailsBtn: "Full details ↗",
    distance: "Distance",
    time: "Time",
    pace: "Pace",
    energy: "Energy",
    elevation: "Elevation",
    avgPace: "Average pace",
    heartRate: "Heart rate",
    shoesUsed: "Shoes used",
    recordedOn: "Recorded on",
    selectedActivity: "🔥 Selected run",
    startPoint: "📍 Start",
    finishPoint: "🏁 Finish",

    // Weekly Pulse
    weeklyPulseTitle: "⚡ Weekly pulse",
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
    recordsTitle: "🏆 Personal records",
    recordsSubtitle: "All-time best efforts",
    top5k: "Top 3 - 5 km",
    top10k: "Top 3 - 10 km",
    top15k: "Top 3 - Long runs (15k+)",

    // Shoe locker
    shoeLockerTitle: "👟 Shoe locker",
    pairCount: (curr: number, total: number) => `Pair ${curr} of ${total}`,
    primaryPair: "⭐ Primary pair",
    rotationPair: "Rotation pair",
    cushioningTime: "Cushioning time",
    wear: "Wear",
    nextShoeBtn: "Next pair ↻",

    // Season
    ytdTitle: "📈 Year-to-date progress (2026)",
    ytdBadge: "2026 goal",
    ytdRuns: "YTD runs",
    ytdTime: "YTD time",
    ytdDist: "YTD distance",
    ytdElev: "YTD elevation",

    // Matrix
    matrixTitle: "📅 52-week consistency matrix",
    matrixTooltip: "Hover over a square to view daily distance",
    less: "Less",
    more: "More",
    restDay: "Rest day",

    // Feed
    recentActivitiesTitle: "🕒 Recent activities",
    recentActivitiesSubtitle: "Session history with pace and shoes",
    viewDetails: "Details ↗",

    // Footer
    footerTitle: "Personal runner dashboard • Deployed on GitHub Pages",
    footerSubtitle: "Modern runner bento • 0ms serverless API"
  },
  fr: {
    // Header
    stravaConnected: "Connecté Strava",
    lastSync: "Sync",
    allTime: "Tout",
    ytd: "2026 (YTD)",
    days30: "30 jours",
    forceRefresh: "⚡ Forcer MAJ",
    syncing: "⏳ Synchronisation...",
    syncSuccess: "✅ Données Strava actualisées avec succès !",
    syncLocal: "⚠️ Données locales déjà à jour.",

    // Latest Run
    latestRunBadge: "🔥 Dernière sortie",
    fullDetailsBtn: "Détails complets ↗",
    distance: "Distance",
    time: "Chrono",
    pace: "Allure",
    energy: "Énergie",
    elevation: "Dénivelé",
    avgPace: "Allure moyenne",
    heartRate: "Fréquence cardiaque",
    shoesUsed: "Chaussures utilisées",
    recordedOn: "Enregistré le",
    selectedActivity: "🔥 Séance sélectionnée",
    startPoint: "📍 Départ",
    finishPoint: "🏁 Arrivée",

    // Weekly Pulse
    weeklyPulseTitle: "⚡ Rythme hebdomadaire",
    weeklyPulseSubtitle: "Régularité & streak",
    consecutiveWeeks: "semaines consécutives",
    activeStreak: "Streak actif • Objectif régularité",
    activeDaysThisWeek: "Jours actifs cette semaine",
    runsPerWeek: "Sorties / semaine",
    timePerWeek: "Temps / semaine",
    distPerWeek: "Distance / semaine",
    calPerWeek: "Calories / semaine",
    mon: "Lun", tue: "Mar", wed: "Mer", thu: "Jeu", fri: "Ven", sat: "Sam", sun: "Dim",

    // Records
    recordsTitle: "🏆 Records personnels",
    recordsSubtitle: "Meilleures performances",
    top5k: "Top 3 - 5 km",
    top10k: "Top 3 - 10 km",
    top15k: "Top 3 - Sorties longues (15k+)",

    // Shoe locker
    shoeLockerTitle: "👟 Parc de chaussures",
    pairCount: (curr: number, total: number) => `Paire ${curr} sur ${total}`,
    primaryPair: "⭐ Paire principale",
    rotationPair: "Paire rotation",
    cushioningTime: "Temps d'amorti",
    wear: "Usure",
    nextShoeBtn: "Paire suivante ↻",

    // Season
    ytdTitle: "📈 Évolution de l'année (2026)",
    ytdBadge: "Objectif 2026",
    ytdRuns: "Sorties YTD",
    ytdTime: "Temps YTD",
    ytdDist: "Distance YTD",
    ytdElev: "Dénivelé YTD",

    // Matrix
    matrixTitle: "📅 Matrice de constance (52 semaines)",
    matrixTooltip: "Survolez une case pour voir le détail des kilomètres courus par jour",
    less: "Moins",
    more: "Plus",
    restDay: "Repos",

    // Feed
    recentActivitiesTitle: "🕒 Activités récentes",
    recentActivitiesSubtitle: "Historique des séances avec allures et chaussures",
    viewDetails: "Détails ↗",

    // Footer
    footerTitle: "Tableau de bord personnel • Déployé sur GitHub Pages",
    footerSubtitle: "Modern runner bento • 0ms serverless API"
  }
};

class I18nService {
  private static instance: I18nService;
  private currentLang: Language = 'en';

  private constructor() {
    const saved = localStorage.getItem('runner_lang') as Language;
    if (saved === 'fr' || saved === 'en') {
      this.currentLang = saved;
    } else {
      this.currentLang = 'en'; // Default English as requested
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
    localStorage.setItem('runner_lang', lang);
  }

  public t() {
    return translations[this.currentLang];
  }
}

export const i18n = I18nService.getInstance();
