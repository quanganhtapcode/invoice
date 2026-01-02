# 📄 Invoice Request - Cửa Hàng Cát Hải

Ứng dụng web để khách hàng gửi yêu cầu xuất hóa đơn VAT cho Cửa hàng Cát Hải.

## ✨ Tính năng

- 📝 **Form đẹp mắt** - Giao diện Apple-style với floating labels
- 🔍 **Tra cứu MST tự động** - Tích hợp API Esgoo để lấy thông tin doanh nghiệp
- 📷 **Chụp/Upload ảnh** - Hỗ trợ camera và chọn file
- 📱 **Responsive** - Hoạt động tốt trên mọi thiết bị
- 🌙 **Dark Mode** - Tự động theo system preference
- 📲 **Gửi Telegram** - Thông báo qua Telegram Bot
- 💾 **Lưu trữ** - Lưu dữ liệu vào localStorage

## 🚀 Cài đặt

### 1. Clone repo

```bash
git clone https://github.com/quanganhtapcode/invoice.git
cd invoice
```

### 2. Cấu hình Telegram Bot

Mở file `js/config.js` và cập nhật:

```javascript
const CONFIG = {
    TELEGRAM_BOT_TOKEN: 'YOUR_BOT_TOKEN_HERE',  // Lấy từ @BotFather
    TELEGRAM_CHAT_ID: 'YOUR_CHAT_ID_HERE',      // Chat ID của bạn
    // ...
};
```

#### Cách lấy Bot Token:
1. Mở Telegram, tìm **@BotFather**
2. Gửi `/newbot` và làm theo hướng dẫn
3. Copy token được cung cấp

#### Cách lấy Chat ID:
1. Gửi tin nhắn bất kỳ đến bot của bạn
2. Truy cập: `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Tìm `"chat":{"id":XXXXX}` - XXXXX là Chat ID

### 3. Deploy lên GitHub Pages

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

Vào Settings > Pages > Source: Deploy from branch `main` / `root`

## 📁 Cấu trúc

```
invoice/
├── index.html          # Trang chính
├── css/
│   └── styles.css      # Styles với dark mode
├── js/
│   ├── config.js       # Cấu hình Telegram
│   ├── telegram.js     # Module gửi Telegram
│   ├── storage.js      # Module localStorage
│   └── app.js          # Logic chính
└── README.md
```

## 🔧 API Esgoo

Ứng dụng sử dụng API miễn phí từ [Esgoo.net](https://esgoo.net) để tra cứu thông tin doanh nghiệp:

```
GET https://esgoo.net/api-mst/{MST}.htm
```

## 📄 License

MIT

---

<p align="center">Made with ❤️ for Cửa Hàng Cát Hải</p>
