/**
 * Back Handler Registry for mobile/browser navigation.
 * Allows overlays (modals, drawers, sub-screens) to intercept the Back button
 * in LIFO (Last-In-First-Out) order before full page navigation occurs.
 */

export type BackHandler = () => boolean;

const handlers: BackHandler[] = [];

/**
 * Register a back handler.
 * If the handler returns true, the back action was consumed and normal navigation is halted.
 * Returns a cleanup function to unregister.
 */
export const registerBackHandler = (handler: BackHandler): (() => void) => {
  handlers.push(handler);
  return () => {
    const idx = handlers.indexOf(handler);
    if (idx !== -1) {
      handlers.splice(idx, 1);
    }
  };
};

/**
 * Executes the topmost registered back handler.
 * Returns true if a handler consumed the event, false otherwise.
 */
export const executeTopBackHandler = (): boolean => {
  for (let i = handlers.length - 1; i >= 0; i--) {
    try {
      const handled = handlers[i]();
      if (handled) {
        return true;
      }
    } catch (error) {
      console.error('Error executing back handler:', error);
    }
  }
  return false;
};
