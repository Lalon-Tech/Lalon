import { useEffect } from 'react';

/**
 * Safe modal scroll lock hook that operates only when explicitly called
 * with a boolean isOpen state, avoiding infinite MutationObserver loops on document.body.
 */
export function useModalScrollLock(isOpen: boolean = false) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);
}
