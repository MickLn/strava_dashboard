export type PageId = 'dashboard' | 'analytics' | 'records' | 'shoes' | 'map';

export class Router {
  private static instance: Router;
  private currentPage: PageId = 'dashboard';
  private slidingPill: HTMLElement | null = null;
  private navLinks: NodeListOf<HTMLAnchorElement> | null = null;
  private onPageChangeCallbacks: ((page: PageId) => void)[] = [];

  private constructor() {
    this.slidingPill = document.getElementById('nav-sliding-pill');
    this.navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-link');
  }

  public static getInstance(): Router {
    if (!Router.instance) {
      Router.instance = new Router();
    }
    return Router.instance;
  }

  public init(): void {
    this.slidingPill = document.getElementById('nav-sliding-pill');
    this.navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-link');

    // Écouteur sur les clics de la navbar
    if (this.navLinks) {
      this.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetPage = link.getAttribute('data-page') as PageId;
          if (targetPage) {
            this.navigate(targetPage);
          }
        });
      });
    }

    // Écouteur sur le changement de hash URL
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') as PageId;
      if (['dashboard', 'analytics', 'records', 'shoes', 'map'].includes(hash)) {
        this.navigate(hash, false);
      }
    });

    // Détection de la page initiale depuis l'URL hash
    const initialHash = window.location.hash.replace('#', '') as PageId;
    if (['dashboard', 'analytics', 'records', 'shoes', 'map'].includes(initialHash)) {
      this.navigate(initialHash, false);
    } else {
      this.navigate('dashboard', false);
    }

    // Double passe pour garantir un centrage parfait après chargement des polices
    requestAnimationFrame(() => this.updateSlidingPill(this.currentPage));
    setTimeout(() => this.updateSlidingPill(this.currentPage), 80);

    // Mise à jour de la pastille au redimensionnement
    window.addEventListener('resize', () => {
      this.updateSlidingPill(this.currentPage);
    });
  }

  public onPageChange(callback: (page: PageId) => void): void {
    this.onPageChangeCallbacks.push(callback);
  }

  public navigate(pageId: PageId, updateHash: boolean = true): void {
    this.currentPage = pageId;

    if (updateHash) {
      window.location.hash = `#${pageId}`;
    }

    // 1. Basculement des conteneurs de page
    const allPages = document.querySelectorAll<HTMLElement>('.page-view');
    allPages.forEach(p => {
      p.classList.remove('page-active');
    });

    const activePage = document.getElementById(`page-${pageId}`);
    if (activePage) {
      activePage.classList.add('page-active');
    }

    // 2. Mise à jour des liens et de la pastille glissante
    if (this.navLinks) {
      this.navLinks.forEach(link => {
        if (link.getAttribute('data-page') === pageId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }

    this.updateSlidingPill(pageId);

    // 3. Scroll doux vers le haut lors d'un changement de page
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 4. Notification des écouteurs
    this.onPageChangeCallbacks.forEach(cb => cb(pageId));
  }

  public getCurrentPage(): PageId {
    return this.currentPage;
  }

  private updateSlidingPill(pageId: PageId): void {
    if (!this.slidingPill) return;

    const activeLink = document.querySelector<HTMLAnchorElement>(`.nav-link[data-page="${pageId}"]`);
    if (!activeLink) return;

    const nav = activeLink.parentElement;
    if (!nav) return;

    const navRect = nav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    const left = linkRect.left - navRect.left;
    const top = linkRect.top - navRect.top;
    const width = linkRect.width;
    const height = linkRect.height;

    this.slidingPill.style.transform = `translate(${left}px, ${top}px)`;
    this.slidingPill.style.width = `${width}px`;
    this.slidingPill.style.height = `${height}px`;
  }
}
