# Invoice Request - Cửa Hàng Cát Hải

Ứng dụng web để khách hàng gửi yêu cầu xuất hóa đơn VAT.

## 🏗 Kiến trúc

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Frontend       │────>│   Backend API    │────>│   Telegram   │
│   (Vercel)       │     │   (VPS)          │     │   Bot        │
└──────────────────┘     └──────────────────┘     └──────────────┘
        │                         │
        │                         │
        ▼                         ▼
  invoice.vercel.app      invoice.quanganh.org
```

## ✨ Tính năng

- 📝 Form nhập thông tin khách hàng
- 🔍 **Tra cứu MST tự động** từ API Esgoo
- 📷 Upload/chụp ảnh hóa đơn
- 📱 Gửi thông báo Telegram tự động
- 💾 Lưu lịch sử (localStorage)
- 🌙 Dark Mode

## 🚀 Deploy

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd Invoice
vercel --prod
```

Hoặc kết nối GitHub repo với Vercel dashboard.

### Backend (VPS)

```bash
# SSH vào VPS
ssh -i ~/Desktop/key.pem root@203.55.176.10

# Tạo thư mục
mkdir -p /var/www/invoice-api
cd /var/www/invoice-api

# Copy files (từ máy local)
scp -i ~/Desktop/key.pem -r backend/* root@203.55.176.10:/var/www/invoice-api/

# Trên VPS: cài đặt
npm install --production

# Chạy với PM2
pm2 start server.js --name invoice-api
pm2 save
```

### Nginx Configuration

Thêm vào `/etc/nginx/sites-available/invoice`:

```nginx
server {
    listen 80;
    server_name invoice.quanganh.org;

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        
        # For file uploads
        client_max_body_size 10M;
    }
}
```

Sau đó:
```bash
ln -s /etc/nginx/sites-available/invoice /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 📁 Cấu trúc

```
Invoice/
├── index.html          # Frontend
├── css/styles.css      # Styles
├── js/
│   ├── config.js       # Config (API URL)
│   ├── telegram.js     # API client
│   ├── storage.js      # LocalStorage
│   └── app.js          # Main logic
├── backend/
│   ├── package.json
│   └── server.js       # Express API + Telegram
├── vercel.json         # Vercel config
└── deploy-vps.sh       # VPS deploy script
```

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/invoice` | Submit invoice (multipart/form-data) |

### POST /api/invoice

**Request (multipart/form-data):**
- `name` - Họ tên (required)
- `phone` - SĐT (required)
- `email` - Email (required)
- `mst` - Mã số thuế (required)
- `companyName` - Tên công ty
- `companyAddress` - Địa chỉ
- `representative` - Người đại diện
- `image` - Ảnh hóa đơn (required, file)

**Response:**
```json
{
  "success": true,
  "message": "Yêu cầu xuất hóa đơn đã được gửi thành công",
  "invoiceId": "INV-ABC123"
}
```

---

Made with ❤️ for Cửa Hàng Cát Hải
