const {
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const BUCKET = process.env.AWS_S3_BUCKET_NAME;

/**
 * Upload a file buffer to S3
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original file name
 * @param {string} mimeType - File MIME type
 * @param {string} userId - Authenticated user's ID
 * @returns {{ s3Key: string, s3Url: string }}
 */
const uploadToS3 = async (buffer, originalName, mimeType, userId) => {
    const ext = path.extname(originalName);
    const s3Key = `uploads/${userId}/${uuidv4()}${ext}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType,
    });

    await s3Client.send(command);

    const s3Url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    return { s3Key, s3Url };
};

/**
 * Delete a file from S3 by key
 * @param {string} s3Key
 */
const deleteFromS3 = async (s3Key) => {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
    });
    await s3Client.send(command);
};

/**
 * Generate a short-lived signed URL for downloading a private S3 file
 * @param {string} s3Key
 * @param {number} expiresInSeconds - Default 60 seconds
 * @returns {string} presigned URL
 */
const getSignedDownloadUrl = async (s3Key, expiresInSeconds = 60) => {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
};

module.exports = { uploadToS3, deleteFromS3, getSignedDownloadUrl };
