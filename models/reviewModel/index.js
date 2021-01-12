// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour  = require('./../tourModel');


const reviewSchema = new mongoose.Schema({
    
    review:{
        type: String,
        required: [true, 'Review can not be empty!']
    },

    rating:{
        type: Number,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tour:{
        type:mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to an tour.']
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to an user.']
    }
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true }
})

// Preventing duplicated reviews
// cada combinacao de tour e user deve ser unica 
reviewSchema.index({tour: 1, user: 1}, { unique: true } )



//MIDDLEWARE PARA POPULAR OS DADOS REFERNCIADOS NA QUERY
    //Populate mostra os dados relacionados por referência, mas somente na
    // query, e não no DB.
    // lembre que .populate cria uma nova query, logo a performance sera afetada
    // em aplicacoes pequenas, nao fara mta diferenca
    reviewSchema.pre(/^find/, function(next){
        /* this.populate({
            path: 'tour', // Campo q sera populado
            select: 'name' // Selecionando alguns campos no documento populado
        }).populate({
            path: 'user', // Campo q sera populado
            select: 'name photo' // Selecionando alguns campos no documento populado
        }); */
        this.populate({
            path: 'user', // Campo q sera populado
            select: 'name photo' // Selecionando alguns campos no documento populado
        });

        next();
    })
//Static methods
reviewSchema.statics.calcAverageRatings = async function(tourId){
//This aponta para o Model atual
    const stats = await this.aggregate( [
        {
            $match: {tour: tourId}
        },
        {
            $group:{
                _id: '$tour',
                nRating: { $sum: 1 },
                averageRating: {$avg: '$rating'}
            }
        }
    ] )
    //console.log(stats);
    if(stats.length > 0)
    {
        await Tour.findByIdAndUpdate(tourId,{
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].averageRating
        })
    } else{
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }
}

//Post middlware nao tem acesso a funcao next()
// Nesse caso, utilizamos post pois desejamos calcular as estatisticas apos 
// a review ser criada
reviewSchema.post('save', function(){
    //this points to current created review

    this.constructor.calcAverageRatings(this.tour);
    // this.constructor == Review
    // Utilizamos dessa forma para poder acessar metodos estaticos de Review
    // anted de sua declaração 

})
//findByIdAndUpdate -- > findOneAndUpdate()
//findByIdAndDelete -- > findOneAndDelete()
reviewSchema.pre(/^findOneAnd/, async function(next){
    //this is the current query
    // utilizamos this para passar os dados da pre middleware para post middleware
    this.r = await this.findOne();
    next();
})
reviewSchema.post(/^findOneAnd/, async function(){
    // this.r = await this.findOne(); does NOT WORK here, query has already been created
    await this.r.constructor.calcAverageRatings(this.r.tour);
})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

