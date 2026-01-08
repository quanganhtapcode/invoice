/**
 * Telegram API Module
 * Sends invoice requests to backend API which then forwards to Telegram
 */

const TelegramBot = {
    /**
     * Send invoice request via backend API
     * @param {object} invoiceData - The invoice request data
     * @param {File} imageFile - The invoice image file
     * @returns {Promise<boolean>} - Success status
     */
    async sendInvoiceRequest(invoiceData, imageFile) {
        try {
            const formData = new FormData();

            // Add invoice data
            formData.append('name', invoiceData.name);
            formData.append('phone', invoiceData.phone);
            formData.append('email', invoiceData.email);
            formData.append('mst', invoiceData.mst);
            formData.append('companyName', invoiceData.companyName || '');
            formData.append('companyAddress', invoiceData.companyAddress || '');
            formData.append('representative', invoiceData.representative || '');

            // Add image file
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const response = await fetch(`${CONFIG.API_URL}/api/invoice`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to send invoice');
            }

            const result = await response.json();
            console.log('Invoice sent successfully:', result);

            return true;
        } catch (error) {
            console.error('Failed to send invoice request:', error);
            throw error;
        }
    },

    /**
     * Check if API is available
     * @returns {boolean} - Always true since we're using backend API
     */
    isConfigured() {
        return CONFIG.API_URL && CONFIG.API_URL !== '';
    }
};

// Freeze to prevent modifications
Object.freeze(TelegramBot);
