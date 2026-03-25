const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../uploads/avatars');

const storage = multer.diskStorage({
    destination(_req, _file, cb) {
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename(_req, file, cb) {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const safeExt = ext || '.png';
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    },
});

const imageUpload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
    fileFilter(_req, file, cb) {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
            const err = new Error('Only image files are allowed');
            err.status = 400;
            err.code = 'BAD_REQUEST';
            cb(err);
            return;
        }

        cb(null, true);
    },
});

module.exports = {
    imageUpload,
};
