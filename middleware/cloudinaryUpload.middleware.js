const Busboy = require('busboy');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const config = require('../config/env');
const ApiError = require('../utils/apiError');

const allowedExtensions = new Set(['.jpeg', '.jpg', '.png', '.webp']);
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxFiles = 5;

const uploadImages = (req, res, next) => {
  if (!req.is('multipart/form-data')) {
    return next();
  }

  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) {
    return next(
      ApiError.internal(
        'Image storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
      )
    );
  }

  let busboy;
  try {
    busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: config.business.maxFileSizeMb * 1024 * 1024,
        files: maxFiles,
        fields: 30,
        fieldNameSize: 100,
        fieldSize: 1024 * 1024
      }
    });
  } catch (error) {
    return next(ApiError.badRequest('Invalid multipart form data.'));
  }

  const uploads = [];
  let firstError;
  req.body = {};
  req.files = [];

  const recordError = (error) => {
    if (!firstError) firstError = error;
  };

  busboy.on('field', (name, value, info) => {
    if (info.nameTruncated || info.valueTruncated) {
      recordError(ApiError.badRequest('A form field exceeds the allowed size.'));
      return;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, name)) {
      req.body[name] = Array.isArray(req.body[name])
        ? [...req.body[name], value]
        : [req.body[name], value];
    } else {
      req.body[name] = value;
    }
  });

  busboy.on('fieldsLimit', () => {
    recordError(ApiError.badRequest('Too many fields in the upload form.'));
  });
  busboy.on('filesLimit', () => {
    recordError(ApiError.badRequest(`A maximum of ${maxFiles} images can be uploaded.`));
  });

  busboy.on('file', (fieldName, file, info) => {
    const extension = path.extname(info.filename).toLowerCase();
    if (
      fieldName !== 'images'
      || !allowedExtensions.has(extension)
      || !allowedMimeTypes.has(info.mimeType)
    ) {
      recordError(
        ApiError.badRequest(
          fieldName !== 'images'
            ? 'Image files must use the "images" field.'
            : 'Invalid file format. Only JPEG, JPG, PNG, and WEBP image files are allowed.'
        )
      );
      file.resume();
      return;
    }

    const uploadPromise = new Promise((resolve, reject) => {
      const cloudinaryStream = cloudinary.uploader.upload_stream(
        {
          folder: 'forma/products',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (!result?.secure_url) {
            reject(new Error('Cloudinary did not return a secure image URL.'));
          } else {
            resolve(result);
          }
        }
      );

      file.on('limit', () => {
        const error = ApiError.badRequest(
          `File is too large. Maximum size is ${config.business.maxFileSizeMb}MB.`
        );
        recordError(error);
        cloudinaryStream.destroy(error);
      });

      file.on('error', reject);
      cloudinaryStream.on('error', reject);
      file.pipe(cloudinaryStream);
    });

    uploads.push(uploadPromise);
  });

  busboy.on('error', recordError);
  busboy.on('finish', async () => {
    const results = await Promise.allSettled(uploads);
    const failedUpload = results.find((result) => result.status === 'rejected');

    if (firstError) {
      return next(firstError);
    }
    if (failedUpload) {
      return next(ApiError.internal(`Image upload failed: ${failedUpload.reason.message}`));
    }

    req.files = results.map((result) => result.value);
    next();
  });

  req.pipe(busboy);
};

module.exports = uploadImages;
