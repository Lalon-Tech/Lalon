import { useEffect, useState, useRef, useCallback } from 'react';

interface PullToRefreshControlOptions {
  activeTab: string;
  selectedMemberId?: string | null;
  onRefresh?: () => Promise<void>;
}

export interface PullToRefreshState {
  isRefreshing: boolean;
  pullDistance: number;
  pullProgress: number; // 0 to 1
  isHomeDashboard: boolean;
}

/**
 * Checks whether the current device/viewport is using a responsive Mobile or Tablet layout.
 * Returns true for screen widths < 1024px (Tailwind lg: breakpoint) or touch mobile/tablet devices.
 * Returns false for standard Desktop layouts (>= 1024px with fine pointer).
 */
export const isMobileOrTabletLayout = (): boolean => {
  if (typeof window === 'undefined') return false;

  // 1. Responsive viewport check matching the application's mobile/tablet layout (< 1024px)
  const isResponsiveMobileTablet = window.innerWidth < 1024;

  // 2. Coarse touch / tablet user-agent check
  const isCoarseTouch = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const ua = navigator.userAgent || '';
  const isMobileOrTabletUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk|Tablet|Kindle/i.test(ua);

  return isResponsiveMobileTablet || ((isCoarseTouch || isMobileOrTabletUA) && window.innerWidth <= 1366);
};

/**
 * usePullToRefreshControl
 * 
 * Smooth in-app Mobile and Tablet Pull-to-Refresh controller:
 * - Home/Dashboard: Pull-to-Refresh remains smoothly enabled without harsh browser full-page reload or blinking.
 * - Displays subtle Bondhu Somiti animated logo indicator while keeping existing dashboard content stable.
 * - All other pages: Pull-to-Refresh is completely disabled (overscroll prevented).
 * - Normal vertical scrolling continues to work seamlessly on every page.
 * - Desktop: Keeps existing desktop behavior completely unchanged.
 */
export const usePullToRefreshControl = ({
  activeTab,
  selectedMemberId = null,
  onRefresh,
}: PullToRefreshControlOptions): PullToRefreshState => {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [pullDistance, setPullDistance] = useState<number>(0);

  const isHomeDashboard = (activeTab === 'dashboard' || activeTab === 'home') && !selectedMemberId;

  // Refs for tracking active touches
  const touchStartYRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const isAtTopRef = useRef<boolean>(false);
  const isRefreshingRef = useRef<boolean>(false);
  isRefreshingRef.current = isRefreshing;

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    setIsRefreshing(true);
    setPullDistance(52); // Keep indicator smoothly visible during refresh

    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.warn('Dashboard smooth refresh error:', err);
    } finally {
      // Graceful delay for soft pulse animation completion
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 550);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const applyState = () => {
      const isMobileTablet = isMobileOrTabletLayout();

      if (!isMobileTablet) {
        // Desktop: Keep existing behavior unchanged.
        document.documentElement.classList.remove('disable-ptr', 'enable-ptr');
        document.body.classList.remove('disable-ptr', 'enable-ptr');
        document.documentElement.style.overscrollBehaviorY = '';
        document.body.style.overscrollBehaviorY = '';
        return;
      }

      // Mobile/Tablet: Prevent browser native full page reload/flicker
      // On Home/Dashboard, we handle Pull-to-Refresh smoothly via gesture!
      document.documentElement.classList.remove('disable-ptr');
      document.body.classList.remove('disable-ptr');
      document.documentElement.classList.add('enable-ptr');
      document.body.classList.add('enable-ptr');

      // Use contain on mobile/tablet to eliminate white-screen browser refresh flicker
      document.documentElement.style.overscrollBehaviorY = 'contain';
      document.body.style.overscrollBehaviorY = 'contain';
    };

    applyState();

    const handleTouchStart = (e: TouchEvent) => {
      if (!isMobileOrTabletLayout()) return;
      // If any modal is active or touch is inside a modal/dialog, never interfere
      if (document.body.classList.contains('modal-open') || document.documentElement.classList.contains('modal-open')) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('.fixed, [role="dialog"], [data-modal="true"], #receipt-modal-backdrop, #receipt-modal-scroll-area, #receipt-modal-content-area, .modal-open')) return;
      if (e.touches.length !== 1) return;

      const currentScrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      isAtTopRef.current = currentScrollTop <= 1;
      touchStartYRef.current = e.touches[0].clientY;
      touchStartXRef.current = e.touches[0].clientX;
      isDraggingRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isMobileOrTabletLayout()) return;
      // If any modal is active or touch is inside a modal/dialog, never interfere
      if (document.body.classList.contains('modal-open') || document.documentElement.classList.contains('modal-open')) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('.fixed, [role="dialog"], [data-modal="true"], #receipt-modal-backdrop, #receipt-modal-scroll-area, #receipt-modal-content-area, .modal-open')) return;
      if (e.touches.length !== 1) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - touchStartYRef.current;
      const deltaX = currentX - touchStartXRef.current;

      // Vertical drag downward at the very top of page
      if (isAtTopRef.current && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
        // Check if an inner container has its own scroll
        let target = e.target as HTMLElement | null;
        let hasScrolledInternalAncestor = false;

        while (target && target !== document.body && target !== document.documentElement) {
          if (target.scrollTop > 0) {
            hasScrolledInternalAncestor = true;
            break;
          }
          target = target.parentElement;
        }

        if (!hasScrolledInternalAncestor) {
          if (isHomeDashboard) {
            // Home/Dashboard on Mobile/Tablet: Smooth in-app pull-down calculation
            if (e.cancelable) {
              e.preventDefault();
            }
            isDraggingRef.current = true;
            // Rubber-band resistance: max ~75px
            const dampedDistance = Math.min(75, Math.pow(deltaY, 0.85) * 1.5);
            setPullDistance(dampedDistance);
          } else {
            // Other pages on Mobile/Tablet: Prevent browser reload
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isMobileOrTabletLayout()) return;

      if (isHomeDashboard && isDraggingRef.current) {
        isDraggingRef.current = false;
        // Trigger threshold: 48px
        if (pullDistance >= 48 && !isRefreshingRef.current) {
          handleRefresh();
        } else if (!isRefreshingRef.current) {
          setPullDistance(0);
        }
      } else {
        isDraggingRef.current = false;
      }
    };

    const handleResize = () => {
      applyState();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);

      document.documentElement.classList.remove('disable-ptr', 'enable-ptr');
      document.body.classList.remove('disable-ptr', 'enable-ptr');
      document.documentElement.style.overscrollBehaviorY = '';
      document.body.style.overscrollBehaviorY = '';
    };
  }, [isHomeDashboard, pullDistance, handleRefresh]);

  const pullProgress = Math.min(1, Math.max(0, pullDistance / 48));

  return {
    isRefreshing,
    pullDistance,
    pullProgress,
    isHomeDashboard,
  };
};
