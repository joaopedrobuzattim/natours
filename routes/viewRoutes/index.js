const express = require('express');
const viewController = require('../../controllers/viewController');
const { protect,isLoggedIn } = require('./../../controllers/authController');
const bookingController = require('../../controllers/bookingController');

const router = express.Router();


router.get('/',isLoggedIn,viewController.getOverview );
router.get('/tour/:slug',isLoggedIn,viewController.getTour);
router.get('/login',isLoggedIn,viewController.getLoginForm);
router.get('/me',protect,viewController.getAccount);
router.get('/my-tours', /* bookingController.createBookingCheckout,*/protect,  viewController.getMyTours);
//router.post('/submit-user-data', protect, viewController.updateUserData);

module.exports = router;