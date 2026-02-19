const express = require('express');
const protect = require('../middleware/auth');
const {
    uploadFile,
    listFiles,
    updateFile,
    deleteFile,
    requestDownload,
    verifyDownload,
} = require('../controllers/fileController');

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/upload', uploadFile);
router.get('/', listFiles);
router.put('/:id', updateFile);
router.delete('/:id', deleteFile);
router.post('/:id/request-download', requestDownload);
router.post('/:id/verify-download', verifyDownload);

module.exports = router;
