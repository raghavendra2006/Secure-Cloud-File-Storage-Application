# ☁️ SecureStore — Secure Cloud File Storage Application

A production-ready full-stack web application for secure personal cloud file storage using **Node.js**, **Express**, **MongoDB**, and **AWS S3**, with **OTP email-verified downloads** and **EC2 deployment**.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🔐 Authentication | JWT-based register/login with bcrypt password hashing |
| ☁️ Cloud Storage | Files stored on AWS S3, metadata in MongoDB |
| 📊 Dashboard | Categorized file view: Images, Videos, Audio, Documents |
| 🔄 File Management | Upload, replace, delete files |
| 🔒 Secure Download | 6-digit OTP emailed to user before each download |
| 🏷️ Categories | Auto-detects file type from MIME |
| 🛡️ Security | Helmet, CORS, rate-limiting, presigned S3 URLs |
| 📱 Responsive | Mobile-friendly dark-theme UI |

---

## 🛠️ Tech Stack

**Backend:** Node.js · Express · MongoDB / Mongoose · JWT · Bcrypt · Multer · AWS S3 SDK v3 · Nodemailer  
**Frontend:** HTML · CSS · Vanilla JavaScript  
**Deployment:** AWS EC2 · Nginx · PM2

---

## 📁 Project Structure

```
cloud-storage-app/
├── server.js                 # Express entry point
├── package.json
├── ecosystem.config.js       # PM2 config
├── nginx.conf                # Nginx reverse proxy
├── .env.example              # Environment variable template
├── config/
│   ├── db.js                 # MongoDB connection
│   └── s3.js                 # AWS S3 client
├── models/
│   ├── User.js               # User schema
│   ├── File.js               # File metadata schema
│   └── OTP.js                # OTP schema (TTL auto-expire)
├── controllers/
│   ├── authController.js     # Register, Login
│   └── fileController.js     # Upload, List, Update, Delete, OTP download
├── routes/
│   ├── auth.js               # /api/auth/*
│   └── files.js              # /api/files/* (protected)
├── middleware/
│   ├── auth.js               # JWT verification
│   └── errorHandler.js       # Global error handler
├── services/
│   ├── s3Service.js          # S3 upload/delete/presigned URL
│   └── emailService.js       # Nodemailer OTP email
└── public/
    ├── index.html            # Login / Register
    ├── dashboard.html        # Main dashboard
    ├── css/style.css
    └── js/
        ├── auth.js
        └── dashboard.js
```

---

## ⚙️ Local Setup

### 1. Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas URI)
- AWS account with S3 bucket
- Gmail account with App Password (or any SMTP)

### 2. Clone & Install

```bash
git clone https://github.com/your-username/cloud-storage-app.git
cd cloud-storage-app
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 4. Run Locally

```bash
npm start          # Production
npm run dev        # Development (nodemon)
```

Open `http://localhost:5000`

---

## 🌍 Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret (use a long random string) |
| `JWT_EXPIRE` | Token expiry (e.g., `7d`) |
| `AWS_ACCESS_KEY_ID` | AWS IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM user secret key |
| `AWS_REGION` | S3 region (e.g., `us-east-1`) |
| `AWS_S3_BUCKET_NAME` | Your S3 bucket name |
| `EMAIL_HOST` | SMTP host (e.g., `smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (`587` for TLS) |
| `EMAIL_USER` | Sender email address |
| `EMAIL_PASS` | Email app password |
| `EMAIL_FROM` | From address in sent emails |
| `OTP_EXPIRE_MINUTES` | OTP validity in minutes (default `5`) |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |

### Files
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/files/upload` | ✅ | Upload file to S3 |
| GET | `/api/files?category=image` | ✅ | List files (optional filter) |
| PUT | `/api/files/:id` | ✅ | Replace file |
| DELETE | `/api/files/:id` | ✅ | Delete from S3 + DB |
| POST | `/api/files/:id/request-download` | ✅ | Send OTP to email |
| POST | `/api/files/:id/verify-download` | ✅ | Verify OTP → presigned URL |

---

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete AWS EC2 deployment guide.

---

## 🔐 AWS S3 Bucket Policy

Make sure your S3 bucket has the following settings:
- **Block all public access**: ✅ ENABLED (files served via presigned URLs only)
- **CORS**: Add the following configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

---

## 📜 License

MIT License — free to use and modify.
