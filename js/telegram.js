/**
 * Telegram Bot API Module
 * Handles sending messages and photos to Telegram
 */

const TelegramBot = {
    /**
     * Get the Telegram API base URL
     */
    getApiUrl() {
        return `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}`;
    },

    /**
     * Send a text message to Telegram
     * @param {string} message - The message to send
     * @returns {Promise<object>} - API response
     */
    async sendMessage(message) {
        const url = `${this.getApiUrl()}/sendMessage`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: CONFIG.TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            const data = await response.json();

            if (!data.ok) {
                throw new Error(data.description || 'Failed to send message');
            }

            return data;
        } catch (error) {
            console.error('Telegram sendMessage error:', error);
            throw error;
        }
    },

    /**
     * Send a photo to Telegram
     * @param {File|Blob} photo - The photo file to send
     * @param {string} caption - Optional caption for the photo
     * @returns {Promise<object>} - API response
     */
    async sendPhoto(photo, caption = '') {
        const url = `${this.getApiUrl()}/sendPhoto`;

        const formData = new FormData();
        formData.append('chat_id', CONFIG.TELEGRAM_CHAT_ID);
        formData.append('photo', photo);

        if (caption) {
            formData.append('caption', caption);
            formData.append('parse_mode', 'HTML');
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!data.ok) {
                throw new Error(data.description || 'Failed to send photo');
            }

            return data;
        } catch (error) {
            console.error('Telegram sendPhoto error:', error);
            throw error;
        }
    },

    /**
     * Send invoice request to Telegram (photo + message)
     * @param {object} invoiceData - The invoice request data
     * @param {File} imageFile - The invoice image file
     * @returns {Promise<boolean>} - Success status
     */
    async sendInvoiceRequest(invoiceData, imageFile) {
        try {
            // Format the message
            const message = this.formatInvoiceMessage(invoiceData);

            // Prepare caption for the photo (first 1024 chars only - Telegram limit)
            const caption = this.formatPhotoCaption(invoiceData);

            // Send photo with caption first
            await this.sendPhoto(imageFile, caption);

            // Send detailed message
            await this.sendMessage(message);

            return true;
        } catch (error) {
            console.error('Failed to send invoice request to Telegram:', error);
            throw error;
        }
    },

    /**
     * Format invoice data into a Telegram message
     * @param {object} data - Invoice data
     * @returns {string} - Formatted message
     */
    formatInvoiceMessage(data) {
        const timestamp = new Date().toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `🧾 <b>YÊU CẦU XUẤT HÓA ĐƠN MỚI</b>
━━━━━━━━━━━━━━━━━━━━

📅 <b>Thời gian:</b> ${timestamp}

👤 <b>THÔNG TIN KHÁCH HÀNG</b>
• Họ tên: ${data.name}
• Điện thoại: ${data.phone}
• Email: ${data.email}

🏢 <b>THÔNG TIN DOANH NGHIỆP</b>
• MST: <code>${data.mst}</code>
• Công ty: ${data.companyName || 'N/A'}
• Địa chỉ: ${data.companyAddress || 'N/A'}
• Đại diện: ${data.representative || 'N/A'}

━━━━━━━━━━━━━━━━━━━━
📌 <i>${CONFIG.STORE_NAME}</i>`;
    },

    /**
     * Format a shorter caption for the photo
     * @param {object} data - Invoice data
     * @returns {string} - Photo caption
     */
    formatPhotoCaption(data) {
        return `📷 Ảnh hóa đơn
👤 ${data.name}
📱 ${data.phone}
🏢 MST: ${data.mst}`;
    },

    /**
     * Validate if Telegram config is set
     * @returns {boolean} - Whether config is valid
     */
    isConfigured() {
        return CONFIG.TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE'
            && CONFIG.TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID_HERE';
    }
};

// Freeze to prevent modifications
Object.freeze(TelegramBot);
