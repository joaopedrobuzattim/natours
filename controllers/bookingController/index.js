const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const e = require('express');
//const APIFeatures = require('../../utils/apiFeatures');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Booking = require('../../models/bookingModel');
const catchAsync = require('../../utils/catchAsync');
const factory = require('./../handlerFactory');

exports.getCheckoutSession = catchAsync(  async(req,res,next)=>{

    //Get Currently booked tour
    const tour = await Tour.findById(req.params.tourID)

    //Create checktout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        /* success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`, */
        success_url: `${req.protocol}://${req.get('host')}/`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourID,
        //Product
        line_items:[
            {
                name: `${tour.name} Tour`,
                description: tour.summary,
                images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
                amount: tour.price * 100,
                currency: 'usd',
                quantity: 1
            }
        ]
    })
    // Create session as response
    res.status(200).json({
        status: 'success',
        session
    })
})   

/* exports.createBookingCheckout = catchAsync(async (req,res,next) =>{

    //UNSECURE WAY
    const {tour, user, price} = req.query;

    if(!tour || !user || !price) return next();

    await Booking.create({
        tour,
        user,
        price
    })
    //Removendo as querys por questoes de seguranca
    // para evitar acesso direto a ela e perimitir que pessoas adquiram sem pagar
    // Redirect vai criar um novo req para esta url,
    // contudo, as querys foram removidas, e ao acessar essa middleware novamente, o if inicial ira redirecionar para a proxima middleware
    res.redirect(req.originalUrl.split('?')[0]);
})
 */

 const createBookingCheckout = async session =>{

    const tour = session.client_reference_id;
    const user = await User.findOne( { email: session.customer_email } )
    console.log('Session customer_email',session.customer_email)
    console.log(user);
    const price = session.display_items[0].amount / 100;

    await Booking.create({
        tour,
        user: user.id,
        price
    })
 }

exports.webhookCheckout = (req,res,next)=>{
    const signature = req.headers['stripe-signature'];
    let event;

    try{
        event = stripe.webhooks
        .constructEvents(req.body, 
            signature, 
            process.env.STRIPE_WEBHOOK_SECRET);
    } catch(err){
        res.status(400).send(`Webhook error: ${err.message}`)
    }
    if(event.type === 'checkout.session.completed')
        createBookingCheckout(event.data.object);

    res.status(200).json({
        received: true
    })

}

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);