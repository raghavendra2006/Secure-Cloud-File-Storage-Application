# 🚀 AWS EC2 Deployment Guide — SecureStore

Complete step-by-step guide to deploy SecureStore on an AWS EC2 Ubuntu instance.

---

## 📋 Prerequisites

- AWS Account with EC2 access
- An S3 bucket configured (from README)
- A MongoDB Atlas cluster URI (recommended) or self-hosted MongoDB
- Gmail App Password (or SMTP provider)
- Your project pushed to a GitHub repository

---

## Step 1: Launch EC2 Instance

1. Open **AWS Console → EC2 → Launch Instance**
2. Settings:
   - **Name**: `securestore-server`
   - **AMI**: Ubuntu Server 22.04 LTS (Free Tier eligible)
   - **Instance Type**: `t2.micro` (free tier) or `t3.small` for production
   - **Key Pair**: Create a new key pair, save `.pem` file securely
3. **Security Group** — Allow inbound:
   | Port | Protocol | Source | Purpose |
   |------|----------|--------|---------|
   | 22 | TCP | Your IP | SSH |
   | 80 | TCP | 0.0.0.0/0 | HTTP |
   | 443 | TCP | 0.0.0.0/0 | HTTPS |
   | 5000 | TCP | 0.0.0.0/0 | Node.js (optional, close after Nginx) |
4. **Storage**: 20 GB gp3
5. Click **Launch Instance**

---

## Step 2: Connect via SSH

```bash
# On your local machine (Linux/macOS)
chmod 400 your-key.pem
ssh -i "your-key.pem" ubuntu@<EC2_PUBLIC_IP>

# On Windows — use PuTTY or Windows Terminal with OpenSSH
ssh -i "your-key.pem" ubuntu@<EC2_PUBLIC_IP>
```

---

## Step 3: Update System & Install Node.js

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # Should show v20.x.x
npm --version
```

---

## Step 4: Install MongoDB (Optional — Atlas Recommended)

> **Recommended**: Use MongoDB Atlas free cluster to avoid managing your own MongoDB.  
> If using Atlas, skip this step and use your Atlas connection string in `.env`.

```bash
# To install MongoDB locally on EC2:
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod
```

---

## Step 5: Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

---

## Step 6: Install PM2

```bash
sudo npm install -g pm2

# Configure PM2 to start on boot
pm2 startup systemd
# Run the command it prints, e.g.:
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

## Step 7: Deploy Application

### 7a. Clone & Install

```bash
cd /home/ubuntu
git clone https://github.com/your-username/cloud-storage-app.git
cd cloud-storage-app
npm install --production
```

### 7b. Configure Environment

```bash
cp .env.example .env
nano .env
```

Fill in ALL values:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/cloud-storage
JWT_SECRET=your_very_long_random_secret_here
JWT_EXPIRE=7d
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your@gmail.com
OTP_EXPIRE_MINUTES=5
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → Generate.

### 7c. Create Logs Directory

```bash
mkdir -p logs
```

### 7d. Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save       # Save process list for auto-restart

# Verify it's running
pm2 status
pm2 logs securestore --lines 50
```

Test the app is responding:
```bash
curl http://localhost:5000/api/health
# Should return: {"success":true,"message":"SecureStore API is running 🚀",...}
```

---

## Step 8: Configure Nginx

```bash
# Copy nginx config
sudo cp /home/ubuntu/cloud-storage-app/nginx.conf /etc/nginx/sites-available/securestore

# Update server_name with your IP or domain
sudo nano /etc/nginx/sites-available/securestore
# Change: server_name _;
# To:     server_name YOUR_EC2_PUBLIC_IP;  (or your domain)

# Enable the site
sudo ln -s /etc/nginx/sites-available/securestore /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

Your app is now accessible at: `http://<EC2_PUBLIC_IP>`

---

## Step 9: (Optional) Setup SSL with Let's Encrypt

> Requires a domain name pointed to your EC2 IP.

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (cron)
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Step 10: (Optional) Configure Custom Domain

1. In your DNS provider, add an **A Record**:
   - Host: `@` (or `www`)
   - Value: Your EC2 Public IP
   - TTL: 300

2. Update `nginx.conf`:
   ```nginx
   server_name yourdomain.com www.yourdomain.com;
   ```

3. Reload Nginx: `sudo systemctl reload nginx`

---

## 🔧 PM2 Management Commands

```bash
pm2 status               # View all processes
pm2 logs securestore     # Stream logs
pm2 restart securestore  # Restart app
pm2 stop securestore     # Stop app
pm2 delete securestore   # Remove from PM2
pm2 monit                # Interactive monitoring
```

---

## 🔒 Security Best Practices (Production)

- Close port 5000 in Security Group after Nginx setup
- Keep `.env` out of version control (already in `.gitignore`)
- Use IAM role for EC2 (instead of hardcoded AWS keys)
- Enable AWS S3 "Block All Public Access"
- Set `NODE_ENV=production` — disables stack traces in API errors
- Rotate `JWT_SECRET` periodically

---

## ✅ Deployment Checklist

- [ ] EC2 instance running (Ubuntu 22.04)
- [ ] Security groups: 22, 80, 443 open
- [ ] Node.js 20 installed
- [ ] MongoDB accessible (Atlas URI or local)
- [ ] Nginx installed & running
- [ ] PM2 installed globally
- [ ] Repository cloned to `/home/ubuntu/cloud-storage-app`
- [ ] `.env` configured with all values
- [ ] App started via PM2 (`pm2 start ecosystem.config.js`)
- [ ] PM2 saved and startup configured
- [ ] Nginx site enabled and reloaded
- [ ] App accessible via `http://<EC2_PUBLIC_IP>`
- [ ] (Optional) SSL certificate installed
- [ ] (Optional) Domain configured
