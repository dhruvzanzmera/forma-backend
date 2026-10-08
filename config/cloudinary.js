const cloudinary = require('cloudinary').v2;
const config = require('./env');

const credentials = config.cloudinary;

if (credentials.cloudName && credentials.apiKey && credentials.apiSecret) {
  cloudinary.config({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true
  });
}

module.exports = cloudinary;
