/**
 * mobile-sheet.ts
 * Gestionnaire tactile du volet coulissant (Bottom Sheet) pour le Hub Mobile.
 * Gère 3 états stricts :
 * - 'peek' : replié au bas de l'écran, affichant UNIQUEMENT le titre et la distance (sans logo/avatar).
 *            Carte plein écran maximale, navbar escamotée vers le bas.
 * - 'half' : état par défaut (~50vh), vue équilibrée carte / fiche course, navbar visible.
 * - 'expanded' : prend TOUTE LA PAGE (top: 0), masquant complètement la carte et le header pour défilement complet.
 */

export type SheetState = 'peek' | 'half' | 'expanded';

class MobileSheetController {
  private sheet: HTMLElement | null = null;
  private dragZone: HTMLElement | null = null;
  private scrollContainer: HTMLElement | null = null;
  private navbarWrap: HTMLElement | null = null;
  private weekPillWrap: HTMLElement | null = null;

  private currentState: SheetState = 'half';
  private startY: number = 0;
  private startTop: number = 0;
  private isDragging: boolean = false;
  private startTime: number = 0;

  public init(): void {
    this.sheet = document.getElementById('mobile-hub-sheet');
    this.dragZone = document.getElementById('mobile-sheet-drag-zone');
    this.scrollContainer = document.getElementById('mobile-sheet-scroll');
    this.navbarWrap = document.querySelector('.floating-navbar-wrap');
    this.weekPillWrap = document.getElementById('mobile-week-pill-wrap');

    if (!this.sheet || !this.dragZone) return;

    this.setupTouchListeners();
    if (window.innerWidth <= 768) {
      this.setInitialState();
    } else {
      this.resetDesktop();
    }

    const handleViewportChange = () => {
      if (window.innerWidth <= 768) {
        this.snapTo(this.currentState, false);
      } else {
        this.resetDesktop();
      }
    };

    window.addEventListener('resize', handleViewportChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }
  }

  private setInitialState(): void {
    if (window.innerWidth <= 768) {
      this.snapTo('half', false);
    }
  }

  private getTops(): { peek: number; half: number; expanded: number } {
    const vh = window.visualViewport?.height || window.innerHeight;
    const dragZoneHeight = this.dragZone?.offsetHeight || 58;
    const peek = Math.max(0, vh - dragZoneHeight);
    const half = Math.round(vh * 0.50);
    const expanded = 0; // Le panel prend toute la page et cache la carte
    return { peek, half, expanded };
  }

  private setupTouchListeners(): void {
    if (!this.dragZone || !this.sheet) return;

    // 1. Glisser depuis la zone de drag (handle + barre de peek)
    this.dragZone.addEventListener('touchstart', (e: TouchEvent) => {
      if (window.innerWidth > 768) return;
      this.onTouchStart(e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e: TouchEvent) => {
      if (!this.isDragging || window.innerWidth > 768) return;
      this.onTouchMove(e.touches[0].clientY);
    }, { passive: false });

    window.addEventListener('touchend', (e: TouchEvent) => {
      if (!this.isDragging || window.innerWidth > 768) return;
      const endY = e.changedTouches[0]?.clientY || this.startY;
      this.onTouchEnd(endY);
    }, { passive: true });

    // 2. Clic / tap sur la barre quand elle est en mode peek -> remonte en half
    this.dragZone.addEventListener('click', () => {
      if (this.currentState === 'peek' && window.innerWidth <= 768) {
        this.snapTo('half', true);
      }
    });

    // Écoute tactile globale sur le volet en mode peek pour capter tout geste de tirage vers le haut
    this.sheet.addEventListener('touchstart', (e: TouchEvent) => {
      if (window.innerWidth > 768) return;
      if (this.currentState === 'peek' && !this.isDragging) {
        this.onTouchStart(e.touches[0].clientY);
      }
    }, { passive: true });

    // Molette / défilement trackpad : remonte le panneau selon l'état
    this.sheet.addEventListener('wheel', (e: WheelEvent) => {
      if (window.innerWidth > 768) return;
      if (this.currentState === 'peek' && e.deltaY > 5) {
        this.snapTo('half', true);
      } else if (this.currentState === 'half' && e.deltaY > 5) {
        this.snapTo('expanded', true);
      } else if (this.currentState === 'half' && e.deltaY < -5) {
        this.snapTo('peek', true);
      }
    }, { passive: true });

    // 3. Détection de tirage et gestion du scroll depuis le conteneur défilable interne
    if (this.scrollContainer) {
      let scrollTouchStartY = 0;
      let isEligibleForPull = false;

      // Détection de défilement pour activer le micro-dégradé doux de bordure uniquement pendant le scroll
      this.scrollContainer.addEventListener('scroll', () => {
        if (this.scrollContainer) {
          this.scrollContainer.classList.toggle('is-scrolled', this.scrollContainer.scrollTop > 4);
        }
      }, { passive: true });

      this.scrollContainer.addEventListener('touchstart', (e: TouchEvent) => {
        if (window.innerWidth > 768) return;
        scrollTouchStartY = e.touches[0].clientY;
        isEligibleForPull = true;
      }, { passive: true });

      this.scrollContainer.addEventListener('touchmove', (e: TouchEvent) => {
        if (!isEligibleForPull || window.innerWidth > 768) return;
        const currentY = e.touches[0].clientY;
        const delta = currentY - scrollTouchStartY;

        // Cas A : En mode 'half', le scroll interne est interdit -> tout geste vers le haut monte le panneau en plein écran (expanded)
        if (this.currentState === 'half' && delta < -6 && !this.isDragging) {
          this.onTouchStart(currentY);
          if (e.cancelable) e.preventDefault();
          return;
        }

        // Cas B : En mode 'expanded', si on est tout en haut et qu'on tire vers le bas,
        // le panneau redescend vers la moitié de l'écran (half)
        if (this.currentState === 'expanded' && delta > 12 && !this.isDragging && (this.scrollContainer?.scrollTop || 0) <= 0) {
          this.onTouchStart(currentY);
          if (e.cancelable) e.preventDefault();
          return;
        }

        // Cas C : En mode 'half', si on tire vers le bas, on descend vers peek
        if (this.currentState === 'half' && delta > 6 && !this.isDragging) {
          this.onTouchStart(currentY);
          if (e.cancelable) e.preventDefault();
          return;
        }
      }, { passive: false });
    }
  }

  private onTouchStart(clientY: number): void {
    if (!this.sheet) return;
    this.isDragging = true;
    this.startY = clientY;
    this.startTime = Date.now();

    const rect = this.sheet.getBoundingClientRect();
    this.startTop = rect.top;

    this.sheet.classList.add('dragging');
  }

  private onTouchMove(clientY: number): void {
    if (!this.sheet) return;
    const deltaY = clientY - this.startY;
    const { peek, half, expanded } = this.getTops();

    // Appliquer une résistance si on dépasse les bornes extrêmes
    let nextTop = this.startTop + deltaY;
    if (nextTop < expanded) {
      nextTop = expanded + (nextTop - expanded) * 0.20;
    } else if (nextTop > peek) {
      nextTop = peek + (nextTop - peek) * 0.20;
    }

    this.sheet.style.top = `${nextTop}px`;
    document.documentElement.style.setProperty('--sheet-top', `${nextTop}px`);

    // Synchronisation interactive de la navbar (se cache en descendant vers peek)
    if (this.navbarWrap) {
      if (nextTop > half) {
        const progress = Math.min(1, Math.max(0, (nextTop - half) / (peek - half)));
        this.navbarWrap.style.transform = `translateY(${progress * 130}%)`;
        this.navbarWrap.style.opacity = `${1 - progress * 0.9}`;
      } else {
        this.navbarWrap.style.transform = 'translateY(0)';
        this.navbarWrap.style.opacity = '1';
      }
    }

    // Le header de la semaine reste toujours visible à l'écran, y compris en expanded
    if (this.weekPillWrap) {
      this.weekPillWrap.style.transform = 'translateY(0)';
      this.weekPillWrap.style.opacity = '1';
    }
  }

  private onTouchEnd(clientY: number): void {
    if (!this.sheet) return;
    this.isDragging = false;
    this.sheet.classList.remove('dragging');

    const deltaY = clientY - this.startY;
    const elapsed = Math.max(1, Date.now() - this.startTime);
    const velocity = deltaY / elapsed; // px par ms

    // Détermination intuitive de l'état cible selon l'état actuel et le mouvement
    let targetState: SheetState = this.currentState;

    if (this.currentState === 'peek') {
      // Depuis le mode replié peek : tout geste de glissement ou swipe vers le haut remonte en 'half'
      if (deltaY < -15 || velocity < -0.12) {
        targetState = 'half';
      } else {
        targetState = 'peek';
      }
    } else if (this.currentState === 'half') {
      if (velocity < -0.30 || deltaY < -50) {
        targetState = 'expanded';
      } else if (velocity > 0.30 || deltaY > 50) {
        targetState = 'peek';
      } else {
        targetState = 'half';
      }
    } else if (this.currentState === 'expanded') {
      // Depuis expanded : glisser vers le bas fait redescendre en 'half'
      if (velocity > 0.30 || deltaY > 50) {
        targetState = 'half';
      } else {
        targetState = 'expanded';
      }
    }

    this.snapTo(targetState, true);
  }

  public snapTo(state: SheetState, animate: boolean = true): void {
    if (window.innerWidth > 768) {
      this.resetDesktop();
      return;
    }
    if (!this.sheet) return;
    this.currentState = state;
    this.sheet.setAttribute('data-state', state);

    const { peek, half, expanded } = this.getTops();
    let targetTop = half;

    if (state === 'peek') targetTop = peek;
    else if (state === 'expanded') targetTop = expanded;

    if (animate) {
      this.sheet.classList.remove('dragging');
      this.sheet.style.transition = 'top 0.32s cubic-bezier(0.16, 1, 0.3, 1)';
    } else {
      this.sheet.style.transition = 'none';
    }

    this.sheet.style.top = `${targetTop}px`;
    document.documentElement.style.setProperty('--sheet-top', `${targetTop}px`);

    // Navbar
    if (this.navbarWrap) {
      this.navbarWrap.style.transition = animate ? 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease' : 'none';
      if (state === 'peek') {
        this.navbarWrap.classList.add('navbar-hidden');
        this.navbarWrap.style.transform = 'translateY(140%)';
        this.navbarWrap.style.opacity = '0';
      } else {
        this.navbarWrap.classList.remove('navbar-hidden');
        this.navbarWrap.style.transform = 'translateY(0)';
        this.navbarWrap.style.opacity = '1';
      }
    }

    // Pilule de semaine sticky : reste TOUJOURS visible à l'écran, y compris en expanded
    if (this.weekPillWrap) {
      this.weekPillWrap.style.transform = 'translateY(0)';
      this.weekPillWrap.style.opacity = '1';
      this.weekPillWrap.style.pointerEvents = 'auto';
    }

    // Gestion du scroll interne : AUTORISÉ UNIQUEMENT en mode expanded !
    // En mode half et peek, le scroll interne est strictement bloqué afin que tout geste tire le panneau en plein écran.
    if (this.scrollContainer) {
      if (state === 'expanded') {
        this.scrollContainer.style.overflowY = 'auto';
      } else {
        this.scrollContainer.style.overflowY = 'hidden';
        this.scrollContainer.scrollTop = 0;
        this.scrollContainer.classList.remove('is-scrolled');
      }
    }
  }

  public resetDesktop(): void {
    if (this.sheet) {
      this.sheet.style.top = '';
      this.sheet.style.transition = '';
      this.sheet.removeAttribute('data-state');
    }
    if (this.navbarWrap) {
      this.navbarWrap.classList.remove('navbar-hidden');
      this.navbarWrap.style.transform = '';
      this.navbarWrap.style.opacity = '';
      this.navbarWrap.style.transition = '';
    }
    if (this.weekPillWrap) {
      this.weekPillWrap.style.transform = '';
      this.weekPillWrap.style.opacity = '';
      this.weekPillWrap.style.transition = '';
      this.weekPillWrap.style.pointerEvents = '';
    }
    if (this.scrollContainer) {
      this.scrollContainer.style.overflowY = '';
      this.scrollContainer.scrollTop = 0;
      this.scrollContainer.classList.remove('is-scrolled');
    }
    document.documentElement.style.removeProperty('--sheet-top');
  }

  public getCurrentState(): SheetState {
    return this.currentState;
  }

  public updatePosition(): void {
    if (window.innerWidth <= 768 && this.currentState === 'peek') {
      this.snapTo('peek', false);
    }
  }
}

export const mobileSheetController = new MobileSheetController();
