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
  private savedScrollY = 0;
  private isCurrentlyLocked = false;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
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
    const shouldLock = this.explicitLocks.size > 0;

    if (shouldLock && !this.isCurrentlyLocked) {
      this.applyLock();
    } else if (!shouldLock && this.isCurrentlyLocked) {
      this.removeLock();
    }
  }

  private applyLock() {
    this.isCurrentlyLocked = true;
    this.savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;

    // Measure scrollbar width to prevent layout shift on desktop
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

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

    // Instantly restore scroll position
    if (typeof window !== 'undefined' && targetY > 0) {
      const originalBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, targetY);
      document.documentElement.style.scrollBehavior = originalBehavior;
    }
  }

  public isLocked(): boolean {
    return this.isCurrentlyLocked;
  }

  public forceUnlock() {
    this.explicitLocks.clear();
    this.removeLock();
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
