require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const errorHandler = require('./middleware/errorHandler');

// ── Connect to MongoDB ─────────────────────────────────────
connectDB();

const app = express();

// ── Security Middleware ────────────────────────────────────
app.use(
    helmet({
        contentSecurityPolicy: false, // Allow inline scripts from dashboard
    })
);

app.use(
    cors({
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Rate limiting – 100 requests per 15 minutes per IP
app.use(
    '/api',
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { success: false, message: 'Too many requests. Please try again later.' },
    })
);

// ── Body Parsers ───────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Static Frontend ────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// ── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'SecureStore API is running 🚀', timestamp: new Date().toISOString() });
});

// ── SPA Fallback for all non-API routes ────────────────────
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 SecureStore server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
process.on('unhandledRejection', (err) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});

module.exports = app;
