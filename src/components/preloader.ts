import { decodePolyline } from '../utils/polyline.ts';
import { Activity } from '../types/strava.ts';

interface SpawnedRoute {
  routeIndex: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
  targetScale: number;
  opacity: number;
  createdAt: number;
  lifespan: number; // durée de vie en ms (~2200ms)
}

interface RouteItem {
  id: number;
  name: string;
  distanceKm: string;
  points: [number, number][];
  cachedCanvas?: HTMLCanvasElement;
}

export class InteractivePreloader {
  private overlay: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private counterEl: HTMLElement | null = null;
  private progressBarEl: HTMLElement | null = null;
  private statusTextEl: HTMLElement | null = null;

  private routes: RouteItem[] = [];
  private routePool: number[] = [];
  private spawnedStamps: SpawnedRoute[] = [];

  private lastSpawnX: number = -9999;
  private lastSpawnY: number = -9999;
  private lastSpawnTime: number = 0;
  private animationFrameId: number | null = null;

  private progress: number = 0;
  private isDatasetReady: boolean = false;
  private isCompleted: boolean = false;
  private isRunning: boolean = false;

  constructor() {
    this.overlay = document.getElementById('preloader-overlay');
    this.canvas = document.getElementById('preloader-canvas') as HTMLCanvasElement;
    this.counterEl = document.getElementById('preloader-counter');
    this.progressBarEl = document.getElementById('preloader-progress-bar');
    this.statusTextEl = document.getElementById('preloader-status-text');

    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
  }

  /**
   * Démarre l'animation d'entrée interactive
   */
  public start(activities?: Activity[]): void {
    if (!this.canvas || !this.ctx || !this.overlay) return;

    this.isRunning = true;
    this.isCompleted = false;
    this.progress = 0;
    this.spawnedStamps = [];
    this.lastSpawnX = -9999;
    this.lastSpawnY = -9999;

    this.overlay.style.display = 'flex';
    this.overlay.classList.remove('preloader-hidden');

    this.resizeCanvas();
    window.removeEventListener('resize', this.handleResize);
    window.addEventListener('resize', this.handleResize);

    // Initialisation des tracés uniques à partir des vraies données
    this.initRoutes(activities || []);

    // L'écran démarre vierge : AUCUN tracé n'apparaît tant que la souris ne bouge pas
    this.bindEvents();

    // Lancement de la boucle 60 FPS
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animate(performance.now());

    // Timer de sécurité absolue : sortie automatique garantie après 2.2s
    setTimeout(() => {
      if (this.isRunning && !this.isCompleted) {
        this.finish();
      }
    }, 2200);
  }

  /**
   * Rejoue l'animation depuis le début
   */
  public replay(activities?: Activity[]): void {
    this.start(activities);
  }

  /**
   * Masque immédiatement le préchargeur (si désactivé)
   */
  public dismiss(): void {
    this.isRunning = false;
    this.isCompleted = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.overlay) {
      this.overlay.classList.add('preloader-hidden');
      this.overlay.style.display = 'none';
    }
  }

  /**
   * Notifie le préchargeur que les données Strava sont prêtes
   */
  public setDatasetReady(activities?: Activity[]): void {
    this.isDatasetReady = true;
    if (activities && activities.length > 0) {
      this.initRoutes(activities);
    }
  }

  /**
   * Initialise et déduplique strictement tous les tracés GPS disponibles
   */
  private initRoutes(activities: Activity[]): void {
    const validActivities = activities.filter(a => a.map?.summary_polyline);
    this.routes = [];
    const seenPolylines = new Set<string>();

    const source = validActivities.length > 0 ? validActivities : activities;

    source.forEach((act, idx) => {
      const polyline = act?.map?.summary_polyline || '';
      if (polyline && seenPolylines.has(polyline)) return; // Déduplication stricte
      if (polyline) seenPolylines.add(polyline);

      const rawPoints = polyline ? decodePolyline(polyline) : [];
      const dist = (act.distance / 1000).toFixed(1);

      this.routes.push({
        id: act.id || idx,
        name: act.name || `Sortie #${idx + 1}`,
        distanceKm: `${dist} km`,
        points: rawPoints.map(p => [p[0], p[1]])
      });
    });

    if (this.routes.length === 0) {
      for (let i = 0; i < 12; i++) {
        this.routes.push({
          id: i,
          name: `Tracé #${i + 1}`,
          distanceKm: `${(5 + i * 1.8).toFixed(1)} km`,
          points: []
        });
      }
    }

    // Pré-rendu sur canvas offscreen pour fluidité 60 FPS
    this.routes.forEach(r => this.prerenderRouteTrace(r));

    // Remplissage du deck aléatoire de tracés
    this.refillRoutePool();
  }

  /**
   * Recharge et mélange le pool de tracés pour garantir 0 doublon consécutif
   */
  private refillRoutePool(): void {
    const count = this.routes.length;
    this.routePool = Array.from({ length: count }, (_, i) => i);
    // Mélange de Fisher-Yates
    for (let i = this.routePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.routePool[i], this.routePool[j]] = [this.routePool[j], this.routePool[i]];
    }
  }

  /**
   * Pré-rendu vectoriel du parcours orange PUR (identique à Strava)
   */
  private prerenderRouteTrace(route: RouteItem): void {
    const w = 170;
    const h = 120;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w * 2; // Retina 2x
    offCanvas.height = h * 2;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    offCtx.scale(2, 2);

    const orangeColor = '#E05A36';

    if (route.points.length > 1) {
      let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
      route.points.forEach(([lat, lng]) => {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      });

      const dLat = (maxLat - minLat) || 0.001;
      const dLng = (maxLng - minLng) || 0.001;

      const padX = 14;
      const padY = 14;
      const drawW = w - padX * 2;
      const drawH = h - padY * 2;

      // Glow / Ombre portée subtile du tracé
      offCtx.shadowColor = 'rgba(224, 90, 54, 0.45)';
      offCtx.shadowBlur = 12;
      offCtx.shadowOffsetX = 0;
      offCtx.shadowOffsetY = 4;

      // Ligne principale du tracé orange
      offCtx.strokeStyle = orangeColor;
      offCtx.lineWidth = 4.2;
      offCtx.lineJoin = 'round';
      offCtx.lineCap = 'round';
      offCtx.beginPath();

      const screenPoints: [number, number][] = [];
      route.points.forEach(([lat, lng], idx) => {
        const px = padX + ((lng - minLng) / dLng) * drawW;
        const py = padY + drawH - ((lat - minLat) / dLat) * drawH;
        screenPoints.push([px, py]);
        if (idx === 0) offCtx.moveTo(px, py);
        else offCtx.lineTo(px, py);
      });
      offCtx.stroke();

      // Point de départ (Vert sauge) et d'arrivée (Orange/Blanc)
      if (screenPoints.length > 1) {
        const [startX, startY] = screenPoints[0];
        const [endX, endY] = screenPoints[screenPoints.length - 1];

        // Start dot
        offCtx.shadowBlur = 0;
        offCtx.fillStyle = '#2E6B56';
        offCtx.beginPath();
        offCtx.arc(startX, startY, 4, 0, Math.PI * 2);
        offCtx.fill();

        // End dot
        offCtx.fillStyle = '#FFFFFF';
        offCtx.strokeStyle = orangeColor;
        offCtx.lineWidth = 2;
        offCtx.beginPath();
        offCtx.arc(endX, endY, 4.5, 0, Math.PI * 2);
        offCtx.fill();
        offCtx.stroke();
      }
    } else {
      // Tracé d'illustration élégant par défaut
      offCtx.shadowColor = 'rgba(224, 90, 54, 0.45)';
      offCtx.shadowBlur = 12;
      offCtx.strokeStyle = orangeColor;
      offCtx.lineWidth = 4.2;
      offCtx.lineCap = 'round';
      offCtx.lineJoin = 'round';
      offCtx.beginPath();
      offCtx.moveTo(25, 75);
      offCtx.bezierCurveTo(50, 30, 110, 95, 145, 45);
      offCtx.stroke();
    }

    route.cachedCanvas = offCanvas;
  }

  /**
   * Fait apparaître un nouveau tracé unique sous le curseur
   */
  private spawnRouteStamp(x: number, y: number, now: number): void {
    if (this.routes.length === 0) return;

    if (this.routePool.length === 0) {
      this.refillRoutePool();
    }

    const nextIndex = this.routePool.pop()!;

    // Légère rotation aléatoire pour un rendu naturel (-18° à +18°)
    const randomAngle = (Math.random() - 0.5) * 0.45;

    this.spawnedStamps.push({
      routeIndex: nextIndex,
      x,
      y,
      angle: randomAngle,
      scale: 0.75,
      targetScale: 1.0 + (Math.random() - 0.5) * 0.15,
      opacity: 1.0,
      createdAt: now,
      lifespan: 1600
    });

    this.lastSpawnX = x;
    this.lastSpawnY = y;
    this.lastSpawnTime = now;

    if (this.spawnedStamps.length > 25) {
      this.spawnedStamps.shift();
    }
  }

  /**
   * Redimensionne le canvas selon la fenêtre
   */
  private handleResize = (): void => {
    this.resizeCanvas();
  };

  private resizeCanvas(): void {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    if (this.ctx) {
      this.ctx.resetTransform();
      this.ctx.scale(dpr, dpr);
    }
  }

  /**
   * Écouteurs d'interaction souris et tactile
   */
  private bindEvents(): void {
    const handleMove = (x: number, y: number) => {
      const now = performance.now();
      const dx = x - this.lastSpawnX;
      const dy = y - this.lastSpawnY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Fait apparaître un nouveau tracé dès que le curseur s'est déplacé de 45px ou après 100ms
      if (dist > 45 || (dist > 15 && now - this.lastSpawnTime > 100)) {
        this.spawnRouteStamp(x, y, now);
      }
    };

    window.addEventListener('mousemove', (e) => {
      if (this.isRunning && !this.isCompleted) {
        handleMove(e.clientX, e.clientY);
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (this.isRunning && !this.isCompleted && e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
  }

  /**
   * Boucle principale de rendu (60 FPS)
   */
  private animate = (now: number): void => {
    if (!this.isRunning || this.isCompleted) return;

    this.updateCounter();
    this.render(now);

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Progression du compteur 00 -> 100% calée sur ~2.0 secondes
   */
  private updateCounter(): void {
    if (this.progress < 100) {
      // 0.88% par frame à 60 FPS = 100% en exactement 1.9 secondes
      const step = this.isDatasetReady ? 0.88 : 0.72;
      this.progress = Math.min(100, this.progress + step);

      const rounded = Math.floor(this.progress);
      const formatted = rounded < 10 ? `0${rounded}` : `${rounded}`;

      if (this.counterEl) {
        this.counterEl.textContent = formatted;
      }
      if (this.progressBarEl) {
        this.progressBarEl.style.width = `${this.progress}%`;
      }
      if (this.statusTextEl) {
        if (this.progress < 30) this.statusTextEl.textContent = 'Connexion à Strava...';
        else if (this.progress < 70) this.statusTextEl.textContent = 'Génération des tracés GPS...';
        else if (this.progress < 95) this.statusTextEl.textContent = 'Synchronisation télémétrie...';
        else this.statusTextEl.textContent = 'Prêt !';
      }

      if (this.progress >= 100) {
        this.finish();
      }
    }
  }

  /**
   * Rendu Canvas des tracés orange
   */
  private render(now: number): void {
    if (!this.ctx || !this.canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.ctx.clearRect(0, 0, width, height);

    this.spawnedStamps = this.spawnedStamps.filter(stamp => {
      const age = now - stamp.createdAt;
      if (age > stamp.lifespan) return false;

      stamp.scale += (stamp.targetScale - stamp.scale) * 0.18;

      const progress = age / stamp.lifespan;
      if (progress > 0.6) {
        stamp.opacity = Math.max(0, 1 - ((progress - 0.6) / 0.4));
      } else {
        stamp.opacity = 1;
      }

      const route = this.routes[stamp.routeIndex];
      if (route && route.cachedCanvas) {
        this.ctx!.save();
        this.ctx!.globalAlpha = stamp.opacity;
        this.ctx!.translate(stamp.x, stamp.y);
        this.ctx!.rotate(stamp.angle);
        this.ctx!.scale(stamp.scale, stamp.scale);

        const bw = 170;
        const bh = 120;
        this.ctx!.drawImage(route.cachedCanvas, -bw / 2, -bh / 2, bw, bh);

        this.ctx!.restore();
      }

      return true;
    });
  }

  /**
   * Sortie fluide du préchargeur
   */
  private finish(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;

    setTimeout(() => {
      if (this.overlay) {
        this.overlay.classList.add('preloader-hidden');
      }

      setTimeout(() => {
        this.isRunning = false;
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
        }
        window.removeEventListener('resize', this.handleResize);
        if (this.overlay) {
          this.overlay.style.display = 'none';
        }
      }, 750);
    }, 250);
  }
}
