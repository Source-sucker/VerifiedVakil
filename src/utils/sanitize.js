/**
 * HTML sanitization for AI/user-generated content
 * Prevents XSS by escaping all HTML entities before DOM insertion
 */

export function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Safe DOM text insertion - always use this for AI/user content
 */
export function safeSetText(element, text) {
  if (!element) return;
  element.textContent = sanitizeHTML(text);
}

/**
 * Safe attribute setting - prevents attribute injection
 */
export function safeSetAttribute(element, attr, value) {
  if (!element) return;

  // Whitelist of safe attributes
  const safeAttrs = ['id', 'class', 'aria-label', 'aria-live', 'aria-hidden', 'role', 'title'];

  if (!safeAttrs.includes(attr)) {
    console.warn(`Attempted to set non-whitelisted attribute: ${attr}`);
    return;
  }

  element.setAttribute(attr, sanitizeHTML(value));
}
