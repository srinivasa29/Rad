import { useEffect, useRef, useCallback } from 'react';



export const useKeyboardShortcuts = (callbacks = {}) => {
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const handleKeyPress = useCallback((event) => {
    const target = event.target;
    const callbacks = callbacksRef.current;

    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      if (event.key === 'Escape') {
        if (target.type === 'search' || target.type === 'text') {
          target.blur();
          callbacks.onEscape?.();
        }
      }
      return;
    }

    const { key, ctrlKey, metaKey } = event;

    switch (key.toLowerCase()) {
      case 'j':
        event.preventDefault();
        callbacks.onNavigateDown?.();
        break;

      case 'k':
        event.preventDefault();
        callbacks.onNavigateUp?.();
        break;

      case 'enter':
        event.preventDefault();
        callbacks.onSelectStock?.();
        break;

      case '/':
        event.preventDefault();
        callbacks.onFocusSearch?.();
        break;

      case 'escape':
        event.preventDefault();
        callbacks.onEscape?.();
        break;

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        event.preventDefault();
        callbacks.onTabSwitch?.(parseInt(key) - 1);
        break;

      case 'e':
        if (ctrlKey || metaKey) {
          event.preventDefault();
          callbacks.onExport?.();
        }
        break;

      case 'n':
        event.preventDefault();
        callbacks.onToggleNewsFilter?.();
        break;

      case 'c':
        event.preventDefault();
        callbacks.onToggleCompactView?.();
        break;

      case 'r':
        if (!ctrlKey && !metaKey) {
          event.preventDefault();
          callbacks.onRefresh?.();
        }
        break;

      case '?':
        event.preventDefault();
        callbacks.onShowHelp?.();
        break;

      default:
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
};

export const KEYBOARD_SHORTCUTS_HELP = [
  { keys: ['j', 'k'], description: 'Navigate down/up in list' },
  { keys: ['Enter'], description: 'Open stock details' },
  { keys: ['/'], description: 'Focus search' },
  { keys: ['Esc'], description: 'Close panels/clear search' },
  { keys: ['1-5'], description: 'Switch filter tabs' },
  { keys: ['Ctrl/Cmd', 'E'], description: 'Export watchlist' },
  { keys: ['n'], description: 'Toggle news filter' },
  { keys: ['c'], description: 'Toggle compact view' },
  { keys: ['r'], description: 'Refresh data' },
  { keys: ['?'], description: 'Show this help' },
];

export default useKeyboardShortcuts;
