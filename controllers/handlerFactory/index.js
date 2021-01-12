const APIFeatures = require('../../utils/apiFeatures');
const catchAsync = require('./../../utils/catchAsync');
const AppError = require('./../../utils/appError');

//Factory functions ---> functions that return another function

// Para eliminar os blocos trycatch, a funcao assincrona foi
// encapsulada pela funcao catchAsync, essa funcao ira retornar uma funcao
// anonima, que será atribuida para createTour
// basicamente, essa funcao anonima que sera chamada assim que uma nova
// tour for criada
// Lembre-se: Utilizamos o return em catchAsync pois createTour deve
// ser uma funcao, e não o resultado de uma chamada


exports.deleteOne = Model => catchAsync(async(req,res,next)=>{
    
    const doc = await Model.findByIdAndDelete(req.params.id)

    if(!doc){
     return next(new AppError('No document found with that id',404));
     }

     res.status(204).json({
         status: "success",
         data: null
     })
     
 
})

exports.updateOne = Model => catchAsync(async(req,res,next)=>{

    const doc =  await Model.findByIdAndUpdate(req.params.id, req.body , {
        new: true,
        runValidators: true
    } );

    if(!doc){
        return next(new AppError('No document found with that id',404));
    }

    res.status(200).json({
        status: "success",
        data:{
            data: doc
        }
    })

})

exports.createOne = Model => catchAsync(async (req,res,next)=>{
    /* const newTour = new Tour({});
    newTour.save(); */
    
    const doc = await Model.create(req.body);
        res.status(201).json({
            status: 'success',
            data:{
                data: doc
            }
        })
})

exports.getOne = (Model, populateOptions) => catchAsync(async(req,res,next)=>{

    let query = Model.findById(req.params.id);
    //Tour.findOne( {_id: req.params.id} )

    if(populateOptions) query = query.populate(populateOptions);    

    const doc = await query;


    if(!doc){
        return next(new AppError('No document found with that ID',404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            data:doc
        }
    })
   
})

exports.getAll = Model => catchAsync(async (req,res,next)=>{
    
    //To allow for nested GET reviews on tour (hack)
    let filter = {};

    if(req.params.tourId) filter = { tour: req.params.tourId };

    //Se filter estiver vazio, todas as reviews serao procuradas,
    // caso o contrario, somente as com o id passado no objeto

    const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

    //EXECUTE THE QUERY
    const doc = await features.query;//.explain();

    //SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
            data: doc
        }
    }) 
})
