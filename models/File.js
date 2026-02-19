const mongoose = require('mongoose');

const CATEGORIES = ['image', 'video', 'audio', 'document', 'other'];

const fileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        originalName: {
            type: String,
            required: true,
            trim: true,
        },
        s3Key: {
            type: String,
            required: true,
            unique: true,
        },
        s3Url: {
            type: String,
            required: true,
        },
        mimeType: {
            type: String,
            required: true,
        },
        size: {
            type: Number,
            required: true, // bytes
        },
        category: {
            type: String,
            enum: CATEGORIES,
            default: 'other',
        },
    },
    { timestamps: true }
);

// Helper to derive category from mimetype
fileSchema.statics.getCategoryFromMime = function (mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (
        mimeType === 'application/pdf' ||
        mimeType.includes('word') ||
        mimeType.includes('sheet') ||
        mimeType.includes('presentation') ||
        mimeType.includes('text') ||
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
        return 'document';
    return 'other';
};

module.exports = mongoose.model('File', fileSchema);
