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
 * Checks whether the current runtime is in a mobile layout or on a mobile device.
 */
export const isMobileLayout = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isSmallScreen = window.innerWidth < 1024; // Tailwind lg breakpoint
  const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints > 0);
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  return isSmallScreen || isTouch || isMobileUA;
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

  // 1. Session initialization: Set up history anchor upon user login
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

      // Replace current entry with root guard state
      try {
        window.history.replaceState(
          { app: 'somiti', isRootGuard: true, tab: 'dashboard' },
          ''
        );

        // On mobile, push an active anchor state so that pressing Back is trapped within the app
        if (isMobileLayout()) {
          window.history.pushState(
            { app: 'somiti', tab: 'dashboard', memberId: null, index: 1 },
            ''
          );
        }
      } catch (e) {
        console.error('Failed to initialize history state:', e);
      }
    }
  }, [user]);

  // 2. Global popstate listener for back button events
  useEffect(() => {
    if (!user) return;

    const handlePopState = (_event: PopStateEvent) => {
      // A. Overlays interception (modals, drawers, settings sub-screens)
      const handled = executeTopBackHandler();
      if (handled) {
        // Re-push current state to replenish the consumed browser history entry
        try {
          window.history.pushState(
            {
              app: 'somiti',
              tab: currentViewRef.current.tab,
              memberId: currentViewRef.current.memberId,
              depth: inAppHistoryRef.current.length
            },
            ''
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

        setTimeout(() => {
          isPoppingRef.current = false;
        }, 60);
        return;
      }

      // C. No previous in-app screen in stack, but user is not on Dashboard
      if (currentViewRef.current.tab !== 'dashboard') {
        isPoppingRef.current = true;
        currentViewRef.current = { tab: 'dashboard', memberId: null };
        
        setActiveTab('dashboard');
        setSelectedMemberId(null);

        if (isMobileLayout()) {
          try {
            window.history.pushState({ app: 'somiti', tab: 'dashboard', index: 1 }, '');
          } catch {}
        }

        setTimeout(() => {
          isPoppingRef.current = false;
        }, 60);
        return;
      }

      // D. User is on Dashboard and stack is empty
      // On mobile layout: Keep user on Home/Dashboard, DO NOT close app, DO NOT log out
      if (isMobileLayout()) {
        try {
          window.history.pushState({ app: 'somiti', tab: 'dashboard', index: 1 }, '');
        } catch {}
        showHomeNotice();
      }
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
    
    // Push new entry to browser history
    try {
      window.history.pushState(
        {
          app: 'somiti',
          tab: activeTab,
          memberId: selectedMemberId,
          depth: stack.length
        },
        ''
      );
    } catch (e) {
      console.error('Error pushing history state:', e);
    }

    currentViewRef.current = { tab: activeTab, memberId: selectedMemberId };
  }, [activeTab, selectedMemberId, user]);

  // 4. In-app programmatic back navigation (for Back buttons in UI)
  const navigateBack = useCallback((fallbackTab: string = 'dashboard') => {
    // If an overlay is active, let it handle the back action
    if (executeTopBackHandler()) {
      return;
    }

    // If we have history entries, trigger window.history.back() to keep history synchronized
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
  }, [setActiveTab, setSelectedMemberId]);

  return {
    navigateBack,
    showHomeToast,
    isBn
  };
};
