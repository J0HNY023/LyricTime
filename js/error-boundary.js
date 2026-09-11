/* ==========================================================================
   error-boundary.js — Error handling and recovery utilities
   Provides graceful error handling for async operations and UI interactions
   ========================================================================== */

/**
 * Global error handler for uncaught exceptions
 */
window.addEventListener('error', (event) => {
  console.error('[Error Boundary] Uncaught error:', event.error);
  
  // Show user-friendly error message
  showErrorNotification(
    'An unexpected error occurred. Some features may not work correctly.',
    'error'
  );
  
  // Don't prevent default - let browser handle it too
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Error Boundary] Unhandled promise rejection:', event.reason);
  
  showErrorNotification(
    'A background operation failed. Check console for details.',
    'warning'
  );
  
  event.preventDefault();
});

/**
 * Show a user-friendly error notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'error', 'warning', 'info', 'success'
 * @param {number} duration - Duration in milliseconds (default: 5000)
 */
function showErrorNotification(message, type = 'error', duration = 5000) {
  const notification = document.createElement('div');
  notification.className = `error-notification notification-${type}`;
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'assertive');
  
  const icons = {
    error: '⛔',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✓'
  };
  
  const colors = {
    error: '#ff4444',
    warning: '#ffaa00',
    info: '#00e5ff',
    success: '#00ff88'
  };
  
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: ${colors[type] || colors.error};
    color: #000;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    z-index: 99999;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    transition: transform 0.3s ease, opacity 0.3s ease;
    opacity: 0;
    max-width: 90%;
    text-align: center;
  `;
  
  notification.innerHTML = `${icons[type] || icons.error} ${escapeHtml(message)}`;
  document.body.appendChild(notification);
  
  // Animate in
  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(-50%) translateY(0)';
    notification.style.opacity = '1';
  });
  
  // Auto-remove after duration
  setTimeout(() => {
    notification.style.transform = 'translateX(-50%) translateY(100px)';
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Wrap an async function with error handling
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} errorMessage - Custom error message
 * @param {boolean} showNotification - Whether to show notification on error
 * @returns {Promise} Wrapped function result or null on error
 */
async function withErrorHandling(asyncFn, errorMessage = 'Operation failed', showNotification = true) {
  try {
    return await asyncFn();
  } catch (error) {
    console.error(`[Error Boundary] ${errorMessage}:`, error);
    
    if (showNotification) {
      showErrorNotification(errorMessage, 'error');
    }
    
    return null;
  }
}

/**
 * Validate user input for security
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove potential script tags and dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Export for use in other modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showErrorNotification,
    escapeHtml,
    withErrorHandling,
    sanitizeInput
  };
}
