/**
 * Accessibility utilities
 * Shared aria-live announcer and focus management helpers
 */

let announcer = null;

/**
 * Initialize global aria-live announcer
 */
export function initAnnouncer() {
  if (announcer) return;

  announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';

  document.body.appendChild(announcer);
}

/**
 * Announce message to screen readers
 */
export function announce(message, priority = 'polite') {
  if (!announcer) initAnnouncer();

  announcer.setAttribute('aria-live', priority);
  announcer.textContent = '';

  // Small delay ensures screen readers catch the update
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
}

/**
 * Focus trap for modals/dialogs
 */
export function trapFocus(element) {
  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focusable = element.querySelectorAll(focusableSelector);

  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

/**
 * Restore focus to previously focused element
 */
export function createFocusRestorer() {
  const previous = document.activeElement;

  return () => {
    if (previous && previous.focus) {
      previous.focus();
    }
  };
}
