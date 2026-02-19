const multer = require('multer');
const File = require('../models/File');
const OTP = require('../models/OTP');
const { uploadToS3, deleteFromS3, getSignedDownloadUrl } = require('../services/s3Service');
const { sendOTPEmail } = require('../services/emailService');

// --- Multer: memory storage (no disk writes) ---
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
}).single('file');

// Helper: generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─────────────────────────────────────────────
// @route   POST /api/files/upload
// @access  Private
// ─────────────────────────────────────────────
const uploadFile = (req, res, next) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        }
        if (err) return next(err);
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file provided.' });
        }

        try {
            const { buffer, originalname, mimetype, size } = req.file;

            const { s3Key, s3Url } = await uploadToS3(buffer, originalname, mimetype, req.user._id.toString());

            const category = File.getCategoryFromMime(mimetype);

            const file = await File.create({
                userId: req.user._id,
                originalName: originalname,
                s3Key,
                s3Url,
                mimeType: mimetype,
                size,
                category,
            });

            res.status(201).json({ success: true, message: 'File uploaded successfully.', file });
        } catch (error) {
            next(error);
        }
    });
};

// ─────────────────────────────────────────────
// @route   GET /api/files
// @access  Private
// ─────────────────────────────────────────────
const listFiles = async (req, res, next) => {
    try {
        const filter = { userId: req.user._id };
        if (req.query.category && req.query.category !== 'all') {
            filter.category = req.query.category;
        }

        const files = await File.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, count: files.length, files });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────
// @route   PUT /api/files/:id
// @access  Private
// ─────────────────────────────────────────────
const updateFile = (req, res, next) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        }
        if (err) return next(err);
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No replacement file provided.' });
        }

        try {
            const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
            if (!file) {
                return res.status(404).json({ success: false, message: 'File not found.' });
            }

            // Delete old S3 object
            await deleteFromS3(file.s3Key);

            const { buffer, originalname, mimetype, size } = req.file;
            const { s3Key, s3Url } = await uploadToS3(buffer, originalname, mimetype, req.user._id.toString());
            const category = File.getCategoryFromMime(mimetype);

            file.originalName = originalname;
            file.s3Key = s3Key;
            file.s3Url = s3Url;
            file.mimeType = mimetype;
            file.size = size;
            file.category = category;

            await file.save();
            res.json({ success: true, message: 'File updated successfully.', file });
        } catch (error) {
            next(error);
        }
    });
};

// ─────────────────────────────────────────────
// @route   DELETE /api/files/:id
// @access  Private
// ─────────────────────────────────────────────
const deleteFile = async (req, res, next) => {
    try {
        const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found.' });
        }

        await deleteFromS3(file.s3Key);
        await File.deleteOne({ _id: file._id });
        // Clean up any OTPs
        await OTP.deleteMany({ fileId: file._id });

        res.json({ success: true, message: 'File deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────
// @route   POST /api/files/:id/request-download
// @access  Private
// ─────────────────────────────────────────────
const requestDownload = async (req, res, next) => {
    try {
        const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found.' });
        }

        // Invalidate any existing unused OTPs for this file+user
        await OTP.deleteMany({ userId: req.user._id, fileId: file._id, used: false });

        const code = generateOTP();
        const expireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES || '5', 10);
        const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);

        await OTP.create({ userId: req.user._id, fileId: file._id, code, expiresAt });

        await sendOTPEmail(req.user.email, code, file.originalName);

        res.json({
            success: true,
            message: `OTP sent to ${req.user.email}. Valid for ${expireMinutes} minutes.`,
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────
// @route   POST /api/files/:id/verify-download
// @access  Private
// ─────────────────────────────────────────────
const verifyDownload = async (req, res, next) => {
    try {
        const { otp } = req.body;
        if (!otp) {
            return res.status(400).json({ success: false, message: 'OTP is required.' });
        }

        const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found.' });
        }

        const otpRecord = await OTP.findOne({
            userId: req.user._id,
            fileId: file._id,
            code: otp.toString(),
            used: false,
        });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        }

        if (new Date() > otpRecord.expiresAt) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Mark OTP as used
        otpRecord.used = true;
        await otpRecord.save();

        // Generate a 60-second presigned download URL
        const downloadUrl = await getSignedDownloadUrl(file.s3Key, 60);

        res.json({
            success: true,
            message: 'OTP verified. Download link generated.',
            downloadUrl,
            fileName: file.originalName,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { uploadFile, listFiles, updateFile, deleteFile, requestDownload, verifyDownload };
