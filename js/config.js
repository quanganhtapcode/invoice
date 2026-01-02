/**
 * Configuration file for Invoice Request App
 */

const CONFIG = {
    // Backend API URL (VPS server)
    API_URL: 'https://invoice.quanganh.org/api',

    // Esgoo API for MST lookup (called from frontend directly)
    ESGOO_API_URL: 'https://esgoo.net/api-mst/',

    // Store Information
    STORE_NAME: 'Cửa hàng Cát Hải',
    STORE_EMAIL: 'cathai@example.com',

    // Local Storage Keys
    STORAGE_KEYS: {
        INVOICES: 'invoice_requests',
        LAST_REQUEST: 'last_request'
    },

    // Validation Rules
    VALIDATION: {
        MST_MIN_LENGTH: 10,
        MST_MAX_LENGTH: 14,
        PHONE_PATTERN: /^[0-9]{9,11}$/,
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.VALIDATION);
