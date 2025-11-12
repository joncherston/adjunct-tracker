/**
 * Custom React hook for handling keyboard events
 * Useful for accessibility features like closing modals with Escape key
 */
import { useEffect } from 'react';

/**
 * Hook to detect when a specific key is pressed
 * @param {string} targetKey - The key to listen for (e.g., 'Escape', 'Enter')
 * @param {Function} callback - Function to call when key is pressed
 * @param {boolean} enabled - Whether the listener is active (default: true)
 */
export const useKeyPress = (targetKey, callback, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event) => {
      if (event.key === targetKey) {
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [targetKey, callback, enabled]);
};

/**
 * Hook specifically for handling Escape key to close modals/dialogs
 * @param {Function} onClose - Function to call when Escape is pressed
 * @param {boolean} isOpen - Whether the modal is currently open
 */
export const useEscapeKey = (onClose, isOpen = true) => {
  useKeyPress('Escape', onClose, isOpen);
};

export default useKeyPress;
