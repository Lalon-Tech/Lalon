import { useEffect, useRef, useState, useCallback } from 'react';
import { executeTopBackHandler } from '../utils/backHandlerRegistry';

export interface UseMobileBackNavigationOptions {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;
  isBn?: boolean;
}

/**
 * Checks whether the current runtime is in a mobile layout, touch device, mobile WebView, or PWA.
 */
export const isMobileNavigation = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isSmallScreen = window.innerWidth <= 1024;
  const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints > 0);
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk/i.test(
    navigator.userAgent
  );
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isEmbedded = window.self !== window.top;

  return isSmallScreen || isTouch || isMobileUA || isStandalone || isCoarsePointer || isEmbedded;
};

export const useMobileBackNavigation = ({
  user,
  activeTab,
  setActiveTab,
  selectedMemberId,
  setSelectedMemberId,
  isBn = true
}: UseMobileBackNavigationOptions) => {
  // In-app history stack of screens visited during this authenticated session
  const inAppHistoryRef = useRef<Array<{ tab: string; memberId: string | null }>>([]);
  
  // Flag indicating that a popstate restoration is currently being processed
  const isPoppingRef = useRef<boolean>(false);
  
  // Track the currently active view to avoid duplicate entries and detect back transitions
  const currentViewRef = useRef<{ tab: string; memberId: string | null }>({
    tab: activeTab,
    memberId: selectedMemberId
  });

  const hasInitializedHistoryRef = useRef<boolean>(false);
  const [showHomeToast, setShowHomeToast] = useState<boolean>(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showHomeNotice = useCallback(() => {
    setShowHomeToast(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setShowHomeToast(false);
    }, 2500);
  }, []);

  // Ensure persistent history foundation anchor behind the app
  const ensureHistoryAnchor = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const curHash = window.location.hash;
      if (!curHash || curHash === '#' || curHash === '#root') {
        window.history.replaceState({ app: 'somiti', role: 'guard', tab: 'root' }, '', '#root');
        window.history.pushState(
          { app: 'somiti', role: 'home_active', tab: 'dashboard', memberId: null },
          '',
          '#home'
        );
      }
    } catch (e) {
      console.warn('History anchor notice:', e);
    }
  }, []);

  // 1. Session initialization: Set up history guard buffer upon user login
  useEffect(() => {
    if (!user) {
      hasInitializedHistoryRef.current = false;
      inAppHistoryRef.current = [];
      return;
    }

    if (!hasInitializedHistoryRef.current) {
      hasInitializedHistoryRef.current = true;
      inAppHistoryRef.current = [];
      currentViewRef.current = { tab: 'dashboard', memberId: null };

      try {
        // Deep root guard at Entry 0, interactive Home state at Entry 1
        window.history.replaceState({ app: 'somiti', role: 'guard', tab: 'root' }, '', '#root');
        window.history.pushState(
          { app: 'somiti', role: 'home_active', tab: 'dashboard', memberId: null },
          '',
          '#home'
        );
      } catch (e) {
        console.error('Failed to initialize history buffer:', e);
      }
    }
  }, [user]);

  // 2. Global popstate listener for back button events
  useEffect(() => {
    if (!user) return;

    const handlePopState = (event: PopStateEvent) => {
      // A. Overlays interception (modals, drawers, settings sub-screens)
      const handled = executeTopBackHandler();
      if (handled) {
        // Overlay consumed back action.
        // Re-push current state to replenish consumed browser history entry:
        try {
          const cur = currentViewRef.current;
          const isHome = cur.tab === 'dashboard' && !cur.memberId;
          const targetHash = isHome ? '#home' : `#${cur.tab}${cur.memberId ? `?id=${cur.memberId}` : ''}`;
          window.history.pushState(
            {
              app: 'somiti',
              role: isHome ? 'home_active' : 'page',
              tab: cur.tab,
              memberId: cur.memberId,
              depth: inAppHistoryRef.current.length
            },
            '',
            targetHash
          );
        } catch (err) {
          console.error('Error replenishing history state:', err);
        }
        return;
      }

      // B. Navigate to previous screen from inAppHistory stack
      if (inAppHistoryRef.current.length > 0) {
        const previous = inAppHistoryRef.current.pop()!;
        isPoppingRef.current = true;
        currentViewRef.current = { tab: previous.tab, memberId: previous.memberId };
        
        setActiveTab(previous.tab);
        setSelectedMemberId(previous.memberId);

        // If the screen we just popped back to is Home/Dashboard:
        if (previous.tab === 'dashboard' && !previous.memberId) {
          inAppHistoryRef.current = []; // Clear stack so user is at root
          try {
            window.history.replaceState(
              { app: 'somiti', role: 'home_active', tab: 'dashboard', memberId: null },
              '',
              '#home'
            );
          } catch {}
        }

        setTimeout(() => {
          isPoppingRef.current = false;
        }, 60);
        return;
      }

      // C. No previous in-app screen in stack, but user is not on Dashboard
      if (currentViewRef.current.tab !== 'dashboard' || currentViewRef.current.memberId !== null) {
        isPoppingRef.current = true;
        currentViewRef.current = { tab: 'dashboard', memberId: null };
        inAppHistoryRef.current = [];
        
        setActiveTab('dashboard');
        setSelectedMemberId(null);

        try {
          window.history.replaceState(
            { app: 'somiti', role: 'home_active', tab: 'dashboard', memberId: null },
            '',
            '#home'
          );
        } catch {}

        setTimeout(() => {
          isPoppingRef.current = false;
        }, 60);
        return;
      }

      // D. User is on Dashboard and stack is empty (Home reached):
      // On mobile / WebView / Desktop: Keep user on Home/Dashboard, DO NOT close app, DO NOT log out, DO NOT exit!
      try {
        // We popped into the #root guard entry.
        // Immediately restore #home interactive state:
        window.history.pushState(
          { app: 'somiti', role: 'home_active', tab: 'dashboard', memberId: null },
          '',
          '#home'
        );
      } catch (err) {
        console.error('Error re-buffering home state:', err);
      }

      // Ensure view remains safely on Home
      if (currentViewRef.current.tab !== 'dashboard' || currentViewRef.current.memberId !== null) {
        currentViewRef.current = { tab: 'dashboard', memberId: null };
        setActiveTab('dashboard');
        setSelectedMemberId(null);
      }

      showHomeNotice();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user, setActiveTab, setSelectedMemberId, showHomeNotice]);

  // 3. Track forward tab/screen changes (with deduplication & loop-collapse)
  useEffect(() => {
    if (!user) return;

    // Skip if this change was triggered by back navigation popstate
    if (isPoppingRef.current) {
      currentViewRef.current = { tab: activeTab, memberId: selectedMemberId };
      return;
    }

    const prev = currentViewRef.current;

    // Deduplication: If tab and memberId haven't changed, do nothing
    if (prev.tab === activeTab && prev.memberId === selectedMemberId) {
      return;
    }

    const isCurrentHome = activeTab === 'dashboard' && !selectedMemberId;

    // If user explicitly navigated to Home/Dashboard (e.g., clicked Home in BottomNav or header)
    if (isCurrentHome) {
      inAppHistoryRef.current = []; // Reset in-app history stack
      currentViewRef.current = { tab: 'dashboard', memberId: null };
      try {
        window.history.pushState(
          { app: 'somiti', role: 'home_active', tab: 'dashboard', memberId: null },
          '',
          '#home'
        );
      } catch {}
      return;
    }

    const stack = inAppHistoryRef.current;

    // Loop-collapse check: If user navigated back to the screen immediately preceding this one,
    // pop the stack rather than pushing a redundant forward cycle
    if (
      stack.length > 0 &&
      stack[stack.length - 1].tab === activeTab &&
      stack[stack.length - 1].memberId === selectedMemberId
    ) {
      stack.pop();
      currentViewRef.current = { tab: activeTab, memberId: selectedMemberId };
      return;
    }

    // Forward navigation: record previous view in history stack
    stack.push({ tab: prev.tab, memberId: prev.memberId });
    
    // Push new entry to browser history with URL hash
    try {
      const targetHash = `#${activeTab}${selectedMemberId ? `?id=${selectedMemberId}` : ''}`;
      window.history.pushState(
        {
          app: 'somiti',
          role: 'page',
          tab: activeTab,
          memberId: selectedMemberId,
          depth: stack.length
        },
        '',
        targetHash
      );
    } catch (e) {
      console.error('Error pushing history state:', e);
    }

    currentViewRef.current = { tab: activeTab, memberId: selectedMemberId };
  }, [activeTab, selectedMemberId, user]);

  // 4. Continuous User Gesture / Touch Safety: keep history anchor active
  useEffect(() => {
    if (!user) return;

    const handleUserTouch = () => {
      if (currentViewRef.current.tab === 'dashboard' && !currentViewRef.current.memberId) {
        if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#root') {
          ensureHistoryAnchor();
        }
      }
    };

    window.addEventListener('touchstart', handleUserTouch, { passive: true });
    window.addEventListener('click', handleUserTouch, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleUserTouch);
      window.removeEventListener('click', handleUserTouch);
    };
  }, [user, ensureHistoryAnchor]);

  // 5. In-app programmatic back navigation (for Back buttons in UI)
  const navigateBack = useCallback((fallbackTab: string = 'dashboard') => {
    // 1. If an overlay is active, let it handle the back action
    if (executeTopBackHandler()) {
      return;
    }

    // 2. If we are on Home/Dashboard, stay on Home/Dashboard and show notice
    if (currentViewRef.current.tab === 'dashboard' && !currentViewRef.current.memberId) {
      showHomeNotice();
      return;
    }

    // 3. If we have in-app history entries, trigger window.history.back() to keep history synchronized
    if (inAppHistoryRef.current.length > 0) {
      window.history.back();
    } else {
      // Fallback if history stack is empty
      if (currentViewRef.current.tab !== fallbackTab) {
        isPoppingRef.current = true;
        currentViewRef.current = { tab: fallbackTab, memberId: null };
        setActiveTab(fallbackTab);
        setSelectedMemberId(null);
        setTimeout(() => {
          isPoppingRef.current = false;
        }, 60);
      }
    }
  }, [setActiveTab, setSelectedMemberId, showHomeNotice]);

  return {
    navigateBack,
    showHomeToast,
    isBn
  };
};
