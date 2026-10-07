const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  addressIdParamValidator,
  createAddressValidator,
  updateAddressValidator
} = require('../validators/address.validator');

router.use(protect);

router.get('/', addressController.getAddresses);
router.get('/:id', validate(addressIdParamValidator), addressController.getAddressById);
router.post('/', validate(createAddressValidator), addressController.createAddress);
router.put('/:id', validate(updateAddressValidator), addressController.updateAddress);
router.patch('/:id/default', validate(addressIdParamValidator), addressController.setDefaultAddress);
router.delete('/:id', validate(addressIdParamValidator), addressController.deleteAddress);

module.exports = router;
