// Utility functions for the WhatsApp AI Assistant

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Get log label for different message types
 * @param {string} type - Log type
 * @returns {string} Formatted label
 */
function getLogLabel(type) {
    const labels = {
        'info': 'INFO',
        'success': 'SUCCESS',
        'warning': 'WARNING',
        'error': 'ERROR',
        'message': 'MESSAGE',
        'response': 'RESPONSE',
        'setup': 'SETUP',
        'auth': 'AUTH',
        'unauthorized': 'UNAUTHORIZED'
    };
    return labels[type] || 'INFO';
}

/**
 * Generate a consistent color for a user ID
 * @param {string} userId - User identifier
 * @returns {string} CSS color
 */
function getUserColor(userId) {
    if (!userId) return '#666';
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 60%)`;
}

/**
 * Format timestamp for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(date) {
    return date.toLocaleTimeString();
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid
 */
function isValidPhoneNumber(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Sanitize user input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = {
    escapeHtml,
    getLogLabel,
    getUserColor,
    formatTimestamp,
    isValidPhoneNumber,
    sanitizeInput,
    debounce,
    generateId
}; 