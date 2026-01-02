#!/bin/bash

# Invoice API - VPS Deployment Script
# Usage: ./deploy.sh

set -e

echo "📦 Deploying Invoice API to VPS..."

# VPS Configuration
VPS_HOST="203.55.176.10"
VPS_USER="root"
SSH_KEY="~/Desktop/key.pem"
REMOTE_DIR="/var/www/invoice.quanganh.org/api"

# Create remote directory if not exists
ssh -i $SSH_KEY $VPS_USER@$VPS_HOST "mkdir -p $REMOTE_DIR"

# Copy backend files to VPS
scp -i $SSH_KEY -r backend/* $VPS_USER@$VPS_HOST:$REMOTE_DIR/

# Install dependencies and start server with PM2
ssh -i $SSH_KEY $VPS_USER@$VPS_HOST << 'ENDSSH'
cd /var/www/invoice.quanganh.org/api

# Install Node.js dependencies
npm install --production

# Start with PM2
pm2 delete invoice-api 2>/dev/null || true
pm2 start server.js --name invoice-api
pm2 save

echo "✅ Invoice API deployed successfully!"
echo "🌐 API available at: https://invoice.quanganh.org/api"
ENDSSH

echo "🎉 Deployment complete!"
