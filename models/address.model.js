const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Address must belong to a user'],
      index: true
    },
    fullName: {
      type: String,
      required: [true, 'Please provide the contact full name'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Please provide the contact phone number'],
      trim: true
    },
    street: {
      type: String,
      required: [true, 'Please provide the street address / landmark'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Please provide the city'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'Please provide the state'],
      trim: true
    },
    postalCode: {
      type: String,
      required: [true, 'Please provide the postal / zip code'],
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// If this address is set as default, unset previous default for this user
addressSchema.pre('save', async function (next) {
  if (this.isModified('isDefault') && this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
