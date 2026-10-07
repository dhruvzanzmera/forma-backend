const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/apiError');
const config = require('../config/env');

const uploadDir = path.resolve(__dirname, '../uploads/products');

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${extension}`);
  }
});

// File filter (accept images only)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedExtensions.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(
    ApiError.badRequest(
      'Invalid file format. Only JPEG, JPG, PNG, and WEBP image files are allowed.'
    )
  );
};

const upload = multer({
  storage,
  limits: {
    fileSize: config.business.maxFileSizeMb * 1024 * 1024 // e.g. 5MB
  },
  fileFilter
});

module.exports = upload;
