
const express = require('express');
const {getAllTours,
    createTour,
    getTour,
    updateTour,
    deleteTour, 
    aliasTopTours, 
    getTourStats,
    getMonthlyPlan,
getTourWithin,
getDistances,
uploadTourImages,
resizeTourImages} = require('../../controllers/tourController');
const { protect, restrictTo } = require('../../controllers/authController');
const reviewRouter = require('./../reviewRoutes');

const router = express.Router();

//router.param('id', checkId);

// Nested Routes
router.use('/:tourId/reviews', reviewRouter);

router
.route('/top-5-cheap')
.get(aliasTopTours, getAllTours); //127.0.0.1:3000/api/v1/tours/?limit=5&sort=-ratingsAverage,price&fields=name,price,ratingsAverage,summary,difficulty

router
.route('/tour-stats')
.get(getTourStats)

router
.route('/monthly-plan/:year')
.get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan)

router
.route('/tours-within/:distance/center/:latlng/unit/:unit')
.get(getTourWithin);
//Another way:
// tours-distance?distance=123&center=-40,45

router.route('/distances/:latlng/unit/:unit').get(getDistances)

router
.route('/')
.get(getAllTours)
.post(protect,restrictTo('admin', 'lead-guide') ,createTour)

router
.route('/:id')
.get(getTour)
.patch(protect,restrictTo('admin','lead-guide'), uploadTourImages , resizeTourImages,updateTour)
.delete(protect,restrictTo('admin','lead-guide'),deleteTour)



module.exports = router;