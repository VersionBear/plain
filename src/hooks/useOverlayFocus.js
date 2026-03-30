import { useEffect } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container) {
  if (!container) {
    return [];
  }

  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (element) =>
      element instanceof HTMLElement &&
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true',
  );
}

export function useOverlayFocus({
  isOpen,
  containerRef,
  onClose,
  canClose = true,
  lockScroll = true,
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    if (lockScroll) {
      document.body.style.overflow = 'hidden';
    }

    const focusableElements = getFocusableElements(container);
    const initialFocusTarget = focusableElements[0] ?? container;
    initialFocusTarget.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && canClose) {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const currentFocusableElements = getFocusableElements(container);

      if (currentFocusableElements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const firstElement = currentFocusableElements[0];
      const lastElement =
        currentFocusableElements[currentFocusableElements.length - 1];

      if (event.shiftKey) {
        if (
          document.activeElement === firstElement ||
          document.activeElement === container
        ) {
          event.preventDefault();
          lastElement.focus();
        }

        return;
      }

      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      if (lockScroll) {
        document.body.style.overflow = previousOverflow;
      }

      if (previousActiveElement?.isConnected) {
        previousActiveElement.focus();
      }
    };
  }, [canClose, containerRef, isOpen, lockScroll, onClose]);
}
