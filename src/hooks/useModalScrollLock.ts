import { useEffect, useId } from 'react';

/**
 * Universal Modal Scroll Lock Manager
 * 
 * Completely locks background page scrolling whenever any popup or modal is open:
 * - Locks both document.documentElement and document.body
 * - Uses position: fixed with exact scroll offset compensation for iOS Safari / Android Chrome touch support
 * - Compensates for desktop scrollbar disappearance to prevent layout shift
 * - Non-passive wheel and touchmove interception prevents scroll chaining and background dragging
 * - Includes an automatic DOM MutationObserver so ANY popup/modal across the entire app
 *   is automatically detected and locked, even without manual hook calls.
 * - Safely restores the exact original scroll position upon closing.
 */

class ScrollLockManager {
  private explicitLocks = new Set<string>();
  private autoDetectedLocks = new Set<Element>();
  private savedScrollY = 0;
  private isCurrentlyLocked = false;
  private isInitialized = false;
  private touchStartY = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Track touch start Y for touchmove direction calculation
    window.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (e.touches.length > 0) {
          this.touchStartY = e.touches[0].clientY;
        }
      },
      { passive: true }
    );

    // Non-passive touchmove listener to prevent background drag on mobile
    window.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        if (!this.isCurrentlyLocked) return;
        if (e.touches.length !== 1) return;

        const target = e.target as HTMLElement | null;
        if (!target) return;

        const currentY = e.touches[0].clientY;
        const deltaY = this.touchStartY - currentY; // > 0: scrolling down, < 0: scrolling up

        let el: HTMLElement | null = target;
        let canScroll = false;

        while (el && el !== document.body && el !== document.documentElement) {
          // If this element has scrollable overflow
          const style = window.getComputedStyle(el);
          const isScrollable =
            (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
            el.scrollHeight > el.clientHeight;

          if (isScrollable) {
            const isAtTop = el.scrollTop <= 0;
            const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

            if ((deltaY < 0 && !isAtTop) || (deltaY > 0 && !isAtBottom)) {
              canScroll = true;
              break;
            }
          }

          // Stop at modal backdrop overlay
          if (
            el.classList.contains('fixed') &&
            (el.classList.contains('inset-0') || el.classList.contains('z-50'))
          ) {
            break;
          }
          el = el.parentElement;
        }

        if (!canScroll && e.cancelable) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    // Non-passive wheel listener on desktop to prevent scroll leakage to background
    window.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        if (!this.isCurrentlyLocked) return;

        const target = e.target as HTMLElement | null;
        if (!target) return;

        let el: HTMLElement | null = target;
        let canScroll = false;

        while (el && el !== document.body && el !== document.documentElement) {
          const style = window.getComputedStyle(el);
          const isScrollable =
            (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
            el.scrollHeight > el.clientHeight;

          if (isScrollable) {
            const isAtTop = el.scrollTop <= 0;
            const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
            const isScrollingDown = e.deltaY > 0;

            if ((isScrollingDown && !isAtBottom) || (!isScrollingDown && !isAtTop)) {
              canScroll = true;
              break;
            }
          }

          if (
            el.classList.contains('fixed') &&
            (el.classList.contains('inset-0') || el.classList.contains('z-50'))
          ) {
            break;
          }
          el = el.parentElement;
        }

        if (!canScroll && e.cancelable) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    // Keyboard scroll interception when focus is outside inputs
    window.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (!this.isCurrentlyLocked) return;

        const scrollKeys = ['Space', 'PageUp', 'PageDown', 'End', 'Home', 'ArrowUp', 'ArrowDown'];
        if (!scrollKeys.includes(e.code) && !scrollKeys.includes(e.key)) return;

        const activeEl = document.activeElement;
        if (
          activeEl instanceof HTMLInputElement ||
          activeEl instanceof HTMLTextAreaElement ||
          activeEl instanceof HTMLSelectElement ||
          (activeEl instanceof HTMLElement && activeEl.isContentEditable)
        ) {
          return;
        }

        let el: HTMLElement | null = activeEl as HTMLElement | null;
        let canScroll = false;

        while (el && el !== document.body && el !== document.documentElement) {
          const style = window.getComputedStyle(el);
          if (
            (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
            el.scrollHeight > el.clientHeight
          ) {
            canScroll = true;
            break;
          }
          el = el.parentElement;
        }

        if (!canScroll && e.cancelable) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    // Setup DOM MutationObserver on document.body to auto-detect any modal mounted anywhere in the application
    this.setupDOMObserver();
  }

  private setupDOMObserver() {
    const checkModals = () => {
      // Find all fixed backdrop/modal overlays in the DOM
      const modalElements = document.querySelectorAll(
        '.fixed.inset-0, [data-modal="true"], [role="dialog"], [aria-modal="true"]'
      );

      const activeModals = new Set<Element>();
      modalElements.forEach((el) => {
        if (!(el instanceof HTMLElement)) return;

        // Skip non-overlay elements like desktop sidebars
        if (el.tagName === 'ASIDE' || el.tagName === 'NAV') return;

        // Verify it's visible in the layout
        if (el.offsetWidth === 0 && el.offsetHeight === 0) return;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return;
        }

        // Must have high z-index (z-40, z-50, z-[...]) typical of overlays/drawers
        const cls = el.className;
        const zIndex = style.zIndex;
        const zNum = parseInt(zIndex, 10);
        const isOverlayZ =
          (!isNaN(zNum) && zNum >= 40) ||
          (typeof cls === 'string' &&
            (cls.includes('z-50') ||
              cls.includes('z-[') ||
              cls.includes('z-40') ||
              cls.includes('backdrop-blur')));

        if (isOverlayZ || el.getAttribute('role') === 'dialog' || el.hasAttribute('data-modal')) {
          activeModals.add(el);
        }
      });

      this.autoDetectedLocks = activeModals;
      this.evaluateLockState();
    };

    let isScheduled = false;
    const scheduleCheck = () => {
      if (isScheduled) return;
      isScheduled = true;
      requestAnimationFrame(() => {
        isScheduled = false;
        checkModals();
      });
    };

    // Observe document.body childList and class changes on subtree, NOT attributes on body itself
    const rootEl = document.getElementById('root') || document.body;
    const observer = new MutationObserver(() => {
      scheduleCheck();
    });

    observer.observe(rootEl, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'],
    });

    // Initial check
    scheduleCheck();
  }

  public lock(id: string) {
    this.explicitLocks.add(id);
    this.evaluateLockState();
  }

  public unlock(id: string) {
    this.explicitLocks.delete(id);
    this.evaluateLockState();
  }

  private evaluateLockState() {
    const shouldLock = this.explicitLocks.size > 0 || this.autoDetectedLocks.size > 0;

    if (shouldLock && !this.isCurrentlyLocked) {
      this.applyLock();
    } else if (!shouldLock && this.isCurrentlyLocked) {
      this.removeLock();
    }
  }

  private applyLock() {
    this.isCurrentlyLocked = true;
    this.savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;

    // Measure scrollbar width to prevent horizontal jump
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  private removeLock() {
    this.isCurrentlyLocked = false;
    const targetY = this.savedScrollY;

    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');

    document.documentElement.style.overflow = '';
    document.documentElement.style.overscrollBehavior = '';

    document.body.style.overflow = '';
    document.body.style.overscrollBehavior = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.paddingRight = '';

    // Instantly restore scroll position without smooth scrolling jump
    const originalBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, targetY);
    document.documentElement.style.scrollBehavior = originalBehavior;
  }

  public isLocked(): boolean {
    return this.isCurrentlyLocked;
  }

  public forceUnlock() {
    this.explicitLocks.clear();
    this.autoDetectedLocks.clear();
    this.evaluateLockState();
  }
}

export const scrollLockManager = new ScrollLockManager();

/**
 * Hook to explicitly lock background page scrolling when a popup or modal is open.
 * Reverts scrolling cleanly upon closing or component unmounting.
 */
export function useModalScrollLock(isOpen: boolean = false) {
  const id = useId();

  useEffect(() => {
    if (!isOpen) return;

    scrollLockManager.lock(id);

    return () => {
      scrollLockManager.unlock(id);
    };
  }, [isOpen, id]);
}
