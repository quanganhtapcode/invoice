/**
 * Invoice API Backend Server
 * Handles invoice submissions and sends to Telegram
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();

// Configuration
const CONFIG = {
    PORT: process.env.PORT || 3000,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8595016320:AAFxAisC35UXL3ukQ3Kg_qbORZ174zcCilo',
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '5245151002',
    STORE_NAME: 'Cửa hàng Cát Hải'
};

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for now, can be restricted later
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `invoice-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

// Telegram API Functions
async function sendTelegramMessage(text) {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CONFIG.TELEGRAM_CHAT_ID,
            text: text,
            parse_mode: 'HTML'
        })
    });

    return response.json();
}

async function sendTelegramPhoto(imagePath, caption) {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendPhoto`;

    const formData = new FormData();
    formData.append('chat_id', CONFIG.TELEGRAM_CHAT_ID);
    formData.append('photo', fs.createReadStream(imagePath));

    if (caption) {
        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');
    }

    const response = await fetch(url, {
        method: 'POST',
        body: formData
    });

    return response.json();
}

function formatInvoiceMessage(data) {
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
}

function formatPhotoCaption(data) {
    return `📷 Ảnh hóa đơn
👤 ${data.name}
📱 ${data.phone}
🏢 MST: ${data.mst}`;
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Invoice API'
    });
});

// Submit invoice request
app.post('/api/invoice', upload.single('image'), async (req, res) => {
    try {
        const { name, phone, email, mst, companyName, companyAddress, representative } = req.body;

        // Validate required fields
        if (!name || !phone || !email || !mst) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng tải lên ảnh hóa đơn'
            });
        }

        const invoiceData = { name, phone, email, mst, companyName, companyAddress, representative };

        console.log('Received invoice request:', invoiceData);
        console.log('Image file:', req.file.path);

        // Send photo with short caption
        const photoCaption = formatPhotoCaption(invoiceData);
        const photoResult = await sendTelegramPhoto(req.file.path, photoCaption);

        if (!photoResult.ok) {
            console.error('Failed to send photo:', photoResult);
        }

        // Send detailed message
        const message = formatInvoiceMessage(invoiceData);
        const messageResult = await sendTelegramMessage(message);

        if (!messageResult.ok) {
            console.error('Failed to send message:', messageResult);
        }

        // Clean up uploaded file after sending
        setTimeout(() => {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Failed to delete temp file:', err);
            });
        }, 5000);

        // Generate invoice ID
        const invoiceId = 'INV-' + Date.now().toString(36).toUpperCase();

        res.json({
            success: true,
            message: 'Yêu cầu xuất hóa đơn đã được gửi thành công',
            invoiceId: invoiceId
        });

    } catch (error) {
        console.error('Error processing invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB'
            });
        }
    }

    res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
    });
});

// Start server
app.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log(`🚀 Invoice API Server running on port ${CONFIG.PORT}`);
    console.log(`📱 Telegram Bot configured for chat: ${CONFIG.TELEGRAM_CHAT_ID}`);
});
