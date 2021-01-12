const User = require('../../models/userModel');
// UPLOAD PHOTO
const multer = require('multer');
//RESIZE IMAGES
const sharp = require('sharp');
//const APIFeatures = require('../../utils/apiFeatures');
const Tour = require('../../models/tourModel');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('./../../utils/appError');
const factory = require('./../handlerFactory');

// BOA PRATICA, armazenar a imagem no buffer(memoria)! Ao redimencionar seu tamanho
// a proxima middleware nao tera que ler o arquivo no disco
const multerStorage = multer.memoryStorage();

//Testar se o arquivo passado é uma imagem (true) ou false se n for
const multerFilter = (req,file,callback) =>{
    if(file.mimetype.startsWith('image')){
        callback(null,true)
    } else{
        callback(new AppError('Not an image!!',404),false)
    }
}

// Uploading image
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

exports.uploadTourImages = upload.fields([
    {
        name: 'imageCover',
        maxCount: 1
    },
    {
        name: 'images',
        maxCount: 3 
    }
])
//SE FOSSEMOS FAZER SOMENTE COM O images
/* upload.array('images',3) ----------> req.files */ 
exports.resizeTourImages = catchAsync(async(req,res,next) =>{
    
    
    //Se não houver imagens, ir para a proxima middleware
    if(!req.files.imageCover || !req.files.images) return next();

    //1) Cover images
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)

    //.resize(size,size)
    .resize(2000,1333)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    //Escrever em disco
    .toFile(`public/img/tours/${req.body.imageCover}`);

    //2) Images
    req.body.images = new Array();

    await Promise.all(
        //Vai retornar uma promise, se nao houvess esse recurso, o codigo nao esperaria
        // o loop finalizar para ir para next(), deixando o array req.body.images incompleto
        req.files.images.map(async(file, index) => {

            const filename = `tour-${req.params.id}-${Date.now()}-${index+1}.jpeg`;
            
            await sharp(file.buffer)
            
            //.resize(size,size)
            .resize(2000,1333)
            .toFormat('jpeg')
            .jpeg({quality: 90})
            //Escrever em disco
            .toFile(`public/img/tours/${filename}`);
            
            req.body.images.push(filename);
    }));

    next();
})
exports.aliasTopTours =  (req,res,next)=>{
        //127.0.0.1:3000/api/v1/tours/?limit=5&sort=-ratingsAverage,price&fields=name,price,ratingsAverage,summary,difficulty
        req.query.limit = '5';
        req.query.sort = '-ratingsAverage,price';
        req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
        next();
}


exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, {path: 'reviews'})
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async(req,res,next)=>{
    const stats =  await Tour.aggregate([
        {
            $match: { ratingsAverage: {$gte: 4.5}}
        },
        {
            $group: {
                //Agrupa o resultado e calcula as operacoes para cada dificuldade
                // 'easy', 'medium', 'difficulty'
                // toUpper converte para caixa alta 
                _id: { $toUpper:  '$difficulty'},
                //Para cada documento, soma 1
                numTours: {$sum: 1}, 
                //Para cada documento, soma ratingsQuantity  
                numRatings: {$sum: '$ratingsQuantity'},
                //Media
                avgRating: { $avg: '$ratingsAverage' },
                //Media
                avgPrice: { $avg: '$price' },
                //Minimo
                minPrice: { $min: '$price' },
                //Maximo
                maxPrice: {$max: '$price'}
                }
                
            },
            {
                //Ordenacao: 1: crescente  -1: decrescente
                $sort: { avgPrice: 1 }
            }
        ]);
        res.status(200).json({
            status: "success",
            data:{
                stats
            }
        })
    })

    exports.getMonthlyPlan = catchAsync(async(req,res,next)=>{
        
        const year = Number(req.params.year);
        
        const plan = await Tour.aggregate([
            {
                // Este estagio desconstroi um array presente em cada documento
                // informado e retorna um documento para cada elemento do array
                $unwind: '$startDates'
            },
            {   //Seleciona as datas que facam parte do ano passado com id na URL
                $match: { 
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                //AGRUPA
              $group: { 
                  _id: { $month: '$startDates'},
                  numTourStarts: { $sum: 1 },
                  // CRIA UM ARRAY E ADICIONA 
                  tours: { $push: '$name'}
                }  
            },
            {
                $sort: { numTourStarts: -1} 
            },
            {
                //ADICIONA CAMPOS
                $addFields: { month: '$_id' }
            },
            {
                //SEFOR ATRIBUIDO O VALOR 0, O CAMPO SERA REMOVIDO
                $project: { _id: 0 }
            },
            {
                // NUMERO MAX DE DOCUMENTOS MOSTRADOS SERA 6
                $limit: 6
            }
        ]);
        res.status(200).json({
            status: "success",
            data:{
                plan
            }
        })
    })

    ///tours-within/:distance/center/:latlng/unit/:unit
    //tours-within/561/center/-29.695712642227146,-53.8493348685321/unit/km
    exports.getTourWithin = catchAsync(async(req,res,next)=>{

        const{ distance, latlng, unit } = req.params;
        const[lat,lng] = latlng.split(',');

        if(!lat || !lng){
           return next(new AppError('Please provide latitude an longitude in the format lat,lng',400));
        }

        // Dividir a distancia pelo raio da Terra
        const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

        const tours = await Tour.find({ 
            startLocation: { 
                $geoWithin: { 
                    $centerSphere: [[lng,lat], radius ] // raio deve ser em radianos
                } 
            } 
        })


        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                data: tours
            }
        })

    })

    exports.getDistances = catchAsync(async(req,res,next)=>{

        const{ latlng, unit } = req.params;
        const[lat,lng] = latlng.split(',');

        if(!lat || !lng){
           return next(new AppError('Please provide latitude an longitude in the format lat,lng',400));
        }

        const multiplier = unit === 'mi' ? 0.000621371 : 0.001

        const distances = await Tour.aggregate([
            {   
                // Um campo do model precisa de geospacial index!!
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [Number(lng),Number(lat)]
                    },
                    //Campo que armazenará as distancias!
                    distanceField: 'distance',
                    distanceMultiplier: multiplier
                }  
            },
            {
                $project:{ 
                    // Mostrando apenas os marados com 1
                    distance: 1,
                    name: 1
                }
            }
        ])

        res.status(200).json({
            status: 'success',
            data: {
                data: distances
            }
        })


    })


    /* exports.getAllTours = catchAsync(async (req,res,next)=>{     
        const features = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

        //EXECUTE THE QUERY
        const tours = await features.query;

        //SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                tours
            }
        }) 
}) */
    
    /* exports.getTour = catchAsync(async(req,res,next)=>{

    const tour = await Tour.findById(req.params.id).populate('reviews');
    //Tour.findOne( {_id: req.params.id} )

    if(!tour){
        return next(new AppError('No tour found with that ID',404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    })
   
}) */
    
    /* exports.createTour =  catchAsync(async (req,res,next)=>{
        // const newTour = new Tour({});
        //newTour.save(); 
        
        const newTour = await Tour.create(req.body);
            res.status(201).json({
                status: 'success',
                data:{
                    tour: newTour
                }
            })
    }) */
    
    
    /* exports.updateTour = catchAsync(async(req,res,next)=>{
    
            const tour =  await Tour.findByIdAndUpdate(req.params.id, req.body , {
                new: true,
                runValidators: true
            } );
    
            if(!tour){
                return next(new AppError('No tour found with that id',404));
            }
    
            res.status(200).json({
                status: "success",
                data:{
                    tour
                }
            })
    
    }) */
    
    
    /* exports.deleteTour  = catchAsync(async(req,res,next)=>{
        
           const tour = await Tour.findByIdAndDelete(req.params.id)
    
           if(!tour){
            return next(new AppError('No tour found with that id',404));
            }
    
            res.status(204).json({
                status: "success",
                data: null
            })
            
        
    })
     */