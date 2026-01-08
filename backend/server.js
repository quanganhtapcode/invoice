/**
 * Invoice API Backend Server
 * Handles invoice submissions, storage, and Telegram notifications
 */

const express = require('express');
// const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const app = express();

// Configuration
const CONFIG = {
    PORT: process.env.PORT || 3000,
    // Use env vars in production ideally
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8595016320:AAFxAisC35UXL3ukQ3Kg_qbORZ174zcCilo',
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '5245151002',
    STORE_NAME: 'Cửa hàng Cát Hải'
};

// Data Persistence
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'invoices.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Middleware
// app.use(cors({ origin: '*', methods: ['GET', 'POST'] })); // Handled by Nginx Gateway
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `invoice-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images are allowed'), false);
    }
});

// Database Helpers
function saveInvoiceToDb(invoice) {
    let invoices = [];
    if (fs.existsSync(DB_FILE)) {
        try {
            invoices = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        } catch (e) { console.error('Error reading DB:', e); }
    }
    invoices.push(invoice);
    fs.writeFileSync(DB_FILE, JSON.stringify(invoices, null, 2));
}

function getTodayInvoices() {
    if (!fs.existsSync(DB_FILE)) return [];
    try {
        const invoices = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        const today = new Date().toDateString();
        return invoices.filter(inv => new Date(inv.timestamp).toDateString() === today);
    } catch (e) { return []; }
}

// Telegram Helpers
async function sendTelegramMessage(text) {
    try {
        const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: 'HTML'
            })
        });
    } catch (e) { console.error('Telegram Send Message Error:', e); }
}

async function sendTelegramPhoto(imagePath, caption) {
    try {
        const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendPhoto`;
        const formData = new FormData();
        formData.append('chat_id', CONFIG.TELEGRAM_CHAT_ID);
        formData.append('photo', fs.createReadStream(imagePath));
        if (caption) {
            formData.append('caption', caption);
            formData.append('parse_mode', 'HTML');
        }
        await fetch(url, { method: 'POST', body: formData });
    } catch (e) { console.error('Telegram Send Photo Error:', e); }
}

// Cron Jobs

// 1. Cleanup old files (older than 7 days) everyday at 00:00
cron.schedule('0 0 * * *', () => {
    console.log('Running daily cleanup...');
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) return;
        const now = Date.now();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

        files.forEach(file => {
            const filePath = path.join(UPLOAD_DIR, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                if (now - stats.mtimeMs > SEVEN_DAYS) {
                    fs.unlink(filePath, () => console.log(`Deleted old file: ${file}`));
                }
            });
        });
    });
});

// 2. Daily Report at 20:00 (8 PM)
cron.schedule('0 20 * * *', async () => {
    console.log('Sending daily report...');
    const todayInvoices = getTodayInvoices();

    if (todayInvoices.length === 0) {
        await sendTelegramMessage(`📅 <b>BÁO CÁO NGÀY ${new Date().toLocaleDateString('vi-VN')}</b>\n\nHôm nay không có yêu cầu hóa đơn nào.`);
        return;
    }

    let message = `📅 <b>BÁO CÁO NGÀY ${new Date().toLocaleDateString('vi-VN')}</b>\n`;
    message += `Tổng số: <b>${todayInvoices.length} yêu cầu</b>\n────────────────\n`;

    todayInvoices.forEach((inv, index) => {
        message += `${index + 1}. <b>${inv.companyName || 'N/A'}</b> - MST: ${inv.mst}\n`;
        message += `   (Khách: ${inv.name} - ${inv.phone})\n\n`;
    });

    await sendTelegramMessage(message);
});

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/invoice', upload.single('image'), async (req, res) => {
    try {
        let { name, phone, email, mst, companyName, companyAddress, representative } = req.body;
        name = name || 'Khách hàng';

        if (!phone || !email || !mst || !req.file) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        const timestamp = new Date().toISOString();
        const invoiceData = {
            id: 'INV-' + Date.now().toString(36).toUpperCase(),
            timestamp,
            name, phone, email, mst, companyName, companyAddress, representative,
            imagePath: req.file.path
        };

        // 1. Save to DB
        saveInvoiceToDb(invoiceData);

        // 2. Send Telegram (Async)
        const caption = `📷 Hóa đơn mới\nMST: ${mst}\nKH: ${name} - ${phone}`;
        await sendTelegramPhoto(req.file.path, caption);

        const detailMsg = `🧾 <b>YÊU CẦU MỚI</b>\nMST: <code>${mst}</code>\nCty: ${companyName}\nĐ/c: ${companyAddress}\nKH: ${name} (${phone})\nEmail: ${email}`;
        await sendTelegramMessage(detailMsg);

        // 3. Response
        // Note: We DO NOT delete the file here anymore. Cron will do it in 7 days.

        res.json({
            success: true,
            message: 'Đã nhận yêu cầu',
            invoiceId: invoiceData.id
        });

    } catch (error) {
        console.error('Processing Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Start
app.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log(`🚀 API Server running on port ${CONFIG.PORT}`);
    console.log('📅 Cron jobs scheduled (Cleanup: 00:00, Report: 20:00)');
});
