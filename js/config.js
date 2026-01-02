/**
 * Configuration file for Invoice Request App
 * 
 * IMPORTANT: Replace the placeholder values with your actual credentials
 */

const CONFIG = {
    // Telegram Bot Configuration
    // Get your bot token from @BotFather on Telegram
    TELEGRAM_BOT_TOKEN: 'YOUR_BOT_TOKEN_HERE',
    
    // Your Telegram Chat ID (can be a user ID or group ID)
    // To get your chat ID, send a message to your bot and visit:
    // https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
    TELEGRAM_CHAT_ID: 'YOUR_CHAT_ID_HERE',
    
    // Esgoo API for MST lookup
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
