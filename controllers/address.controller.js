const Address = require('../models/address.model');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all addresses for logged-in user
 * Route: GET /api/v1/addresses
 */
const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  return ApiResponse.success(res, addresses, 'Addresses fetched successfully.');
});

/**
 * Get single address by ID
 * Route: GET /api/v1/addresses/:id
 */
const getAddressById = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) {
    throw ApiError.notFound('Address not found.');
  }

  return ApiResponse.success(res, address, 'Address fetched successfully.');
});

/**
 * Create a new address
 * Route: POST /api/v1/addresses
 */
const createAddress = asyncHandler(async (req, res) => {
  const { fullName, phone, street, city, state, postalCode, country, isDefault } = req.body;

  // Check if this is the first address, if so make it default
  const addressCount = await Address.countDocuments({ user: req.user._id });
  const shouldBeDefault = addressCount === 0 || isDefault === true;

  if (shouldBeDefault) {
    await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
  }

  const address = await Address.create({
    user: req.user._id,
    fullName,
    phone,
    street,
    city,
    state,
    postalCode,
    country: country || 'India',
    isDefault: shouldBeDefault
  });

  return ApiResponse.created(res, address, 'Address created successfully.');
});

/**
 * Update an existing address
 * Route: PUT /api/v1/addresses/:id
 */
const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) {
    throw ApiError.notFound('Address not found.');
  }

  const { fullName, phone, street, city, state, postalCode, country, isDefault } = req.body;

  if (isDefault === true) {
    await Address.updateMany(
      { user: req.user._id, _id: { $ne: address._id } },
      { $set: { isDefault: false } }
    );
    address.isDefault = true;
  } else if (isDefault === false && address.isDefault) {
    // If unsetting default, make sure at least one default remains if multiple exist
    address.isDefault = false;
  }

  if (fullName !== undefined) address.fullName = fullName;
  if (phone !== undefined) address.phone = phone;
  if (street !== undefined) address.street = street;
  if (city !== undefined) address.city = city;
  if (state !== undefined) address.state = state;
  if (postalCode !== undefined) address.postalCode = postalCode;
  if (country !== undefined) address.country = country;

  await address.save();

  return ApiResponse.success(res, address, 'Address updated successfully.');
});

/**
 * Set address as default
 * Route: PATCH /api/v1/addresses/:id/default
 */
const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) {
    throw ApiError.notFound('Address not found.');
  }

  await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
  address.isDefault = true;
  await address.save();

  return ApiResponse.success(res, address, 'Default address updated successfully.');
});

/**
 * Delete address
 * Route: DELETE /api/v1/addresses/:id
 */
const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) {
    throw ApiError.notFound('Address not found.');
  }

  // If deleted address was default, set the latest remaining address as default
  if (address.isDefault) {
    const nextAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  return ApiResponse.noContent(res, 'Address deleted successfully.');
});

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress
};
