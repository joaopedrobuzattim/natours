const mongoose = require('mongoose');
const slugify = require('slugify');
/* const User = require('../userModel'); */

/* const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);

mongoose
.connect(DB, {

    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})
.then( () => console.log("DB CONNECTION SUCCESSFULL!")); */

const toursSchema = new mongoose.Schema({
 name: {
     type: String,
     //VALIDATOR
     required: [true, 'A tour must have a name!'],
     unique: true,
     //Remove espacos em branco no fim e no comeco
     trim: true,
     //VALIDATORS
     maxlength: [40, 'A tour name must have less or equal than 40 characters'],
     minlength: [10, 'A tour name must have more or equal than 10 characters'],
     //validate: [validator.isAlpha, 'Tour name must only contain characters']
 },
 slug: String,
 duration:{
    type: Number,
    required: [true, 'A tour must have a duration!']
 },
 maxGroupSize:{
     type: Number,
     required: [true, 'A tour must have a group size!']
 },
 difficulty:{
    type: String,
    //VALIDATORS
    required: [true, 'A tour must have a difficulty!'],
    enum: {
        //SÓ SAO PERMITIDOS ESTES VALORES!
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is not  either easy, medium, difficult'
    }
 },  
 ratingsAverage: {
    type:Number,
     default: 4.5,
     //VALIDATORS
     min: [1, 'Rating must be above 1.0'],
     max: [5, 'Rating must be below 5.0'],
     //Funcao q roda cada vez que um valor é setado em ratingsAverage
     set: (currentValue) => Math.round(currentValue * 10) / 10 // Truque para arredondar
     // Se nao fizermos isso: 4.66666 ficará 5. Com o modo a cima: 4.6666 * 10 = 47 => 47 /10 =  4.7 
 },
 ratingsQuantity:{
     type: Number,
     default: 0
 },
 price: {
     type: Number,
     required: [true, 'A tour must have a price!']
 },
 priceDiscount:{
     type: Number,
     validate:{
        //Funcao para validar, recebe a propriedade atual como parametro
        // this refere-se ao documento atual somente ao criar novos elementos,
        // não ao atualizar um existente
        validator: function(val){
            return val < this.price; 
         },
         //MENSAGEM CASO A FUNCAO RETORNE FALSO
         // {VALUE} é propriedade do mongoose, retorna o valor da propriedade atual
         message:'Discount price ({VALUE}) should be bellow the regular price!'  
     } 
 },
 summary:{
     type: String,
     //Remove espacos em branco no fim e no comeco
     trim: true,
     //VALIDATOR
     required: [true, 'A tour mus have a description!']
 },
 description:{
     type: String,
     trim: true
 },
 imageCover:{
     type:String,
     required: [true, 'A tour must have a cover image!']
 },
 //Array of Strings 
 images:[String],
 createdAt:{
     type: Date,
     default: Date.now(),
     //Faz a propriedade nao ser listada ao fazer o Get 
     select: false
 },
 //Array of Dates 
 startDates:[Date],
 secretTour: {
     type: Boolean,
     default: false
 },
 startLocation:{
     //GeoJSON
     type: {
         type:String,
         default: 'Point',
         enum: ['Point']
     },
     coordinates:[Number], // [Number] == Array of numbers
     address: String,
     description: String
 },
 //embbeded documents --> (Array of Objects )
 locations:[
   {
       type: {
           type:String,
           default: 'Point',
           enum:['Point']
       },
       coordinates: [Number],
       address: String,
       description: String,
       day: Number
   }  
 ],
 guides: [
     //Tipo deve receber um MongoDB Id
    {
        type:mongoose.Schema.ObjectId,
        ref: 'User' // Reference --- > User não precisa estar importado neste arquivo
    }
 ]
}, {
    // Permite utilizar VIRTUAL PROPERTIES
    toJSON: { virtuals: true },
    toObject: { virtuals: true}
})

//Definindo um index para o preco: 1 = Armazenado em orden crescente
// - 1 = Armazenado em ordem decrescente
// Index são um exemplo de como id funciona, os ids são armazenados em um local separado
// Ao realizar uma acao baseada no id, somente a lista com o id sera analisada, e nãp
// todo o documento, isso gera ganhos de performance
// Faremos o mesmo com o preco e ratingsAverage, pois é um campo frequentemente procurado pelo usuario
// Cuidado ao definir muitos index, pois cada vez q o campo for atualizado, o index tbm devera ser, consumindo recursos!
toursSchema.index({price: 1, ratingsAverage: -1})
toursSchema.index({slug: 1})
toursSchema.index({startLocation: '2dsphere'})

// DEFINE VIRTUAL PROPERTIES
// Propriedades que nao serãop armazenadas no banco de dados
// Apenas serao exibidas quando cada documento for pego (get)
// Nao podem ser especificadas na query

toursSchema.virtual('durationweeks').get(function(){
    return this.duration / 7;
})
// Virtual populate
toursSchema.virtual('reviews',{
    ref: 'Review',
    //Nome do campo no ref model ( Review )
    foreignField: 'tour',
    // _id no model local é chamado de Tour no model ref
    localField: '_id'
})

//DOCUMENT MIDDLEWARE: runs before .save() and .create()
// NAO EXECUTA PARA O METODO .insertMany()
// a palavra this refere-se ao proprio documento  
toursSchema.pre('save',function(next){
    this.slug = slugify(this.name, {lower: true});
    next();
})

///EMBEDDING GUIDES ON TOURS
/* toursSchema.pre('save',async function(next){
    const guidesPromises = this.guides.map(async id => User.findById(id))
    this.guides = await Promise.all(guidesPromises);
    next()
}) */
/* // ocorre depois da criacao, o parametro doc refere-se ao
   // doc criado
toursSchema.post('save',function(doc,next){
    console.log(doc);
    next();
}) */


//QUERY MIDDLEWARE
// executa antes de uma query ser executada
// this se refere a query atual
//  executa antes de todos os comandos q iniciam com find ( /^find / )
// find, findOne (findById), ...
 
toursSchema.pre(/^find/,function(next){
    // Seleciona os documentos em que secret tour nao e igual ($ne) a true    
    this.find({secretTour: {$ne: true}});
    this.start = Date.now();
    next();
})

//MIDDLEWARE PARA POPULAR OS DADOS REFERNCIADOS NA QUERY
    //Populate mostra os dados relacionados por referência, mas somente na
    // query, e não no DB.
    // lembre que .populate cria uma nova query, logo a performance sera afetada
    // em aplicacoes pequenas, nao fara mta diferenca
toursSchema.pre(/^find/, function(next){
    this.populate({
        path: 'guides', // Campo q sera populado
        select: '-__v -passwordChangedAt' // Removendo alguns campos no documento populado
    });
    next();
})
//AGGREGATION MIDDLEWARE
toursSchema.pre('aggregate',function(next){

    
    // geoNear deve ser o primeiro!!!
    if(!this.pipeline()[0].$geoNear) {

        //Adiciona um filtro no inicio (unshift) do array aggregate
        this.pipeline().unshift({ $match: { secretTour: {$ne: true}}});
        console.log(this.pipeline());

    }
    next();
})
toursSchema.post(/^find/, function(docs,next){
    console.log(`Query took ${Date.now() - this.start} milliseconds`);
    next();
})


const Tour = mongoose.model('Tour', toursSchema);
module.exports = Tour;