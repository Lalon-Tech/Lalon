import { useEffect } from 'react';

interface PullToRefreshControlOptions {
  activeTab: string;
  selectedMemberId?: string | null;
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
 * Controls mobile and tablet Pull-to-Refresh / Swipe-to-Refresh behavior:
 * - Home/Dashboard: Pull-to-Refresh remains enabled.
 * - All other pages: Pull-to-Refresh is completely disabled.
 * - Normal vertical scrolling continues to work seamlessly on every page.
 * - Swiping down on other pages does NOT reload, refresh, or reset the page.
 * - Desktop: Keeps existing behavior unchanged.
 * - Applies only to responsive Mobile and Tablet layouts.
 */
export const usePullToRefreshControl = ({
  activeTab,
  selectedMemberId = null,
}: PullToRefreshControlOptions) => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Determine if on Home/Dashboard (without a specific member profile or sub-route)
    const isHomeDashboard = (activeTab === 'dashboard' || activeTab === 'home') && !selectedMemberId;

    let touchStartY = 0;
    let touchStartX = 0;
    let isAtTopOnTouchStart = false;

    const applyState = () => {
      const isMobileTablet = isMobileOrTabletLayout();

      if (!isMobileTablet) {
        // Desktop: Keep existing behavior unchanged. Clean up any mobile-specific classes/styles
        document.documentElement.classList.remove('disable-ptr', 'enable-ptr');
        document.body.classList.remove('disable-ptr', 'enable-ptr');
        document.documentElement.style.overscrollBehaviorY = '';
        document.body.style.overscrollBehaviorY = '';
        return;
      }

      if (isHomeDashboard) {
        // Home/Dashboard on Mobile/Tablet: Enable native Pull-to-Refresh
        document.documentElement.classList.remove('disable-ptr');
        document.body.classList.remove('disable-ptr');
        document.documentElement.classList.add('enable-ptr');
        document.body.classList.add('enable-ptr');

        document.documentElement.style.overscrollBehaviorY = 'auto';
        document.body.style.overscrollBehaviorY = 'auto';
      } else {
        // All other pages on Mobile/Tablet: Completely disable Pull-to-Refresh
        document.documentElement.classList.remove('enable-ptr');
        document.body.classList.remove('enable-ptr');
        document.documentElement.classList.add('disable-ptr');
        document.body.classList.add('disable-ptr');

        document.documentElement.style.overscrollBehaviorY = 'contain';
        document.body.style.overscrollBehaviorY = 'contain';
      }
    };

    // Initial state application
    applyState();

    // Event listener for touchstart to detect scroll boundary on non-dashboard mobile pages
    const handleTouchStart = (e: TouchEvent) => {
      if (!isMobileOrTabletLayout() || isHomeDashboard) return;
      if (e.touches.length !== 1) return;

      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;

      // Check if page is currently at the top
      const currentScrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      isAtTopOnTouchStart = currentScrollTop <= 1;
    };

    // Event listener for touchmove: prevent pull-to-refresh reload when dragging down at the top of non-dashboard pages
    const handleTouchMove = (e: TouchEvent) => {
      if (!isMobileOrTabletLayout() || isHomeDashboard) return;
      if (!isAtTopOnTouchStart || e.touches.length !== 1) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - touchStartY;
      const deltaX = currentX - touchStartX;

      // Only intercept downward drag (deltaY > 0) where vertical movement exceeds horizontal movement
      if (deltaY > 5 && Math.abs(deltaY) > Math.abs(deltaX)) {
        // Verify current scroll position is still at the top
        const currentScrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (currentScrollTop <= 1) {
          // Check if user is scrolling inside an internal scrollable element that is scrolled down
          let target = e.target as HTMLElement | null;
          let hasScrolledInternalAncestor = false;

          while (target && target !== document.body && target !== document.documentElement) {
            if (target.scrollTop > 0) {
              hasScrolledInternalAncestor = true;
              break;
            }
            target = target.parentElement;
          }

          // If no internal container is scrolled down, swiping down at top of page would trigger
          // a browser pull-to-refresh reload. Intercept and prevent the reload!
          if (!hasScrolledInternalAncestor && e.cancelable) {
            e.preventDefault();
          }
        }
      }
    };

    // Window resize / orientation change listener to dynamically react to layout shifts
    const handleResize = () => {
      applyState();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    // Attach touch listeners with passive: false for touchmove to allow preventing reload if needed
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);

      // Clean up styles and classes
      document.documentElement.classList.remove('disable-ptr', 'enable-ptr');
      document.body.classList.remove('disable-ptr', 'enable-ptr');
      document.documentElement.style.overscrollBehaviorY = '';
      document.body.style.overscrollBehaviorY = '';
    };
  }, [activeTab, selectedMemberId]);
};
