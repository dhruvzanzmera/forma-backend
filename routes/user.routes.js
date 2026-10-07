const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { updateProfileValidator } = require('../validators/auth.validator');

router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileValidator), userController.updateProfile);

module.exports = router;
