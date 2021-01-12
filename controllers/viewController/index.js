const Tour = require('../../models/tourModel');
const Booking = require('../../models/bookingModel');
const catchAsync = require('./../../utils/catchAsync');
const AppError = require('../../utils/appError');
const User = require('./../../models/userModel');
exports.getOverview =  catchAsync( async (req,res)=>{

    // 1 ) Get tour data fromn collection
    const tours = await Tour.find();

    
    // 2) Build template
    // 3) Render that template using tour dta from step 1
    res.status(200).render('overview',{
        tours // tours: tours
    });
})

exports.getTour = catchAsync(async(req,res,next)=>{

    

    // 1) Get the data, for the requested tour (including reviews and tour guides)
    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews',
        fields: 'review rating user'
    })
    if(!tour)
        return next(new AppError('There is no tour with that name',404));
    // 2) Build template

    // 3) Rende teh template using the date from step 1 
    res.status(200).set(
        'Content-Security-Policy',
        "default-src 'self' https://*.mapbox.com https://*.stripe.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com/v3/ 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        ).render('tour',{
        title: `${tour.name} tour`,
        tour
    });
})

exports.getLoginForm = catchAsync( async (req,res)=>{

    res.status(200).render('login',{
        title: 'Log into your account'
    });
})

exports.getAccount =  (req,res)=>{

    res.status(200).render('account',{
        title: 'Your account'
    });

}

exports.getMyTours = catchAsync(async (req,res,next)=>{
    // 1) Find all bookings
    const bookings = await Booking.find( {user: req.user.id} );

    // 2) Find tours with the returned ID's
    const tourIDs = bookings.map(el => el.tour);
    
    // 3 ) Get the tours
    // $in seleciona os que estiverem dentro do array
    const tours = await Tour.find( {_id: { $in : tourIDs} } )

    res.status(200).render('overview', {
        title: 'My tours',
        tours
    })
})

exports.updateUserData = catchAsync( async (req,res) =>{

    const updatedUser = await User.findByIdAndUpdate(req.user.id,{
        name: req.body.name,
        email: req.body.email
    },{
        new: true,
        runValidators: true
    })

    res.status(200).render('account',{
        title: 'Your account',
        // Passando o valor atualizado ao rendereizar a pagina
        // de perfil, caso isso nao for feito, sera carregado
        // o valor desatualizado que é passado pela protect middleware
        user: updatedUser
    });
    

})