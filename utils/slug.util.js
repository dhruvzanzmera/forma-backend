const slugify = require('slugify');

/**
 * Generate a clean URL-friendly slug
 * @param {string} text 
 * @returns {string}
 */
const createSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true
  });
};

module.exports = {
  createSlug
};
