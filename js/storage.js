/**
 * Local Storage Module - Handles saving invoice requests
 */

const Storage = {
    saveInvoice(invoiceData) {
        try {
            const id = 'INV-' + Date.now().toString(36).toUpperCase();
            const record = {
                id,
                ...invoiceData,
                createdAt: new Date().toISOString(),
                status: 'pending'
            };

            if (record.imagePreview) {
                record.hasImage = true;
                delete record.imagePreview;
            }

            const invoices = this.getAllInvoices();
            invoices.unshift(record);

            localStorage.setItem(CONFIG.STORAGE_KEYS.INVOICES, JSON.stringify(invoices.slice(0, 100)));
            localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_REQUEST, JSON.stringify(record));

            return id;
        } catch (error) {
            console.error('Failed to save invoice:', error);
            throw error;
        }
    },

    getAllInvoices() {
        try {
            const data = localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    },

    getLastRequest() {
        try {
            const data = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_REQUEST);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            return null;
        }
    },

    clearAll() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.INVOICES);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.LAST_REQUEST);
    }
};

Object.freeze(Storage);
