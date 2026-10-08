const express = require('express');
const request = require('supertest');

jest.mock('../config/cloudinary', () => ({
  uploader: {
    upload_stream: jest.fn((options, callback) => {
      const { PassThrough } = require('stream');
      const stream = new PassThrough();
      stream.on('finish', () => {
        callback(null, {
          secure_url: 'https://res.cloudinary.com/test/image/upload/test-image.jpg'
        });
      });
      return stream;
    })
  }
}));

const config = require('../config/env');
const uploadImages = require('../middleware/cloudinaryUpload.middleware');

const app = express();
app.post('/upload', uploadImages, (req, res) => {
  res.json({
    name: req.body.name,
    images: req.files.map((file) => file.secure_url)
  });
});
app.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({ message: error.message });
});

beforeAll(() => {
  config.cloudinary.cloudName = 'test';
  config.cloudinary.apiKey = 'test';
  config.cloudinary.apiSecret = 'test';
});

describe('Cloudinary image upload middleware', () => {
  it('streams uploaded images and parses multipart fields', async () => {
    const response = await request(app)
      .post('/upload')
      .field('name', 'Test product')
      .attach('images', Buffer.from('test image'), {
        filename: 'product.png',
        contentType: 'image/png'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Test product');
    expect(response.body.images).toEqual([
      'https://res.cloudinary.com/test/image/upload/test-image.jpg'
    ]);
  });

  it('rejects unsupported file types', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('images', Buffer.from('not an image'), {
        filename: 'document.pdf',
        contentType: 'application/pdf'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toMatch(/Only JPEG, JPG, PNG, and WEBP/);
  });
});
