const User = require('../../models/userModel');
// UPLOAD PHOTO
const multer = require('multer');
//RESIZE IMAGES
const sharp = require('sharp');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('./../../utils/appError');
const factory = require('./../handlerFactory');


// multer for upload images

// amazenar a imagem no armazenamento (disco)
/* const multerStorage = multer.diskStorage({
    // callback é similar a next do express
    destination: (req,res,callback) => {
        // 1 param: erro, 2 param, destination
        callback(null,'public/img/users' )
    },
    filename: (req,file,callback) =>{
        // Nome da imagem: user-userId-currentTimeStamp.extension
        // extraindo a extensao
        const extension = file.mimetype.split('/')[1];
        // 1 param: erro, 2 param: file Name
        callback(null, `user-${req.user.id}-${Date.now()}.${extension}`)
    }
}) */
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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async(req,res,next) =>{
    //Se não houver imagens, ir para a proxima middleware
    if(!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    
    await sharp(req.file.buffer)

    //.resize(size,size)
    .resize(500,500)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    //Escrever em disco
    .toFile(`public/img/users/${req.file.filename}`);

    next();
})

const filterObj = (obj, ...allowedFields)=>{

    const newObj = {};

    //Retorna um awway com as keys do obj, por ele faremos uma interacao
    Object.keys(obj).forEach(el =>{
        if(allowedFields.includes(el)) newObj[el] = obj[el]
    })
    return newObj;
}

exports.getMe = (req,rex,next)=>{
    req.params.id = req.user.id;
    next();
}

exports.updateMe = catchAsync(async(req,res,next)=>{

// 1) Create error if user POSTs password data
if(req.body.password || req.body.confirmPassword){
    return next(new AppError('This route is no for password updates. Please use /updateMyPassword '),400)
}

// 2) Filtered out unwanted fields names that are not allowed to be updated
const filteredBody = filterObj(req.body,'name','email');
//Verificando se uma imagem foi adicionada
// So adicionaremos o nome da imagem ao banco de dados
if(req.file) filteredBody.photo = req.file.filename;

// 3) Update user document
// Agora podemos usar findByIdAndUpdate, ja que nao precisamos
// do validator de COnfirmar de senha

// new: true , retorna o novo objeto
const updatedUser = await User.findByIdAndUpdate(req.user.id,filteredBody,{new:true, runValidators:true});


res.status(200).json({
    status:'success',
    data:{
        user:updatedUser
    }
})
})

exports.deleteMe = catchAsync( async(req,res,next)=>{

    await User.findByIdAndUpdate(req.user.id, {active:false});

    res.status(204).json({
        status: 'success',
        data:null
    })

})



exports.createUser = async(req,res)=>{
    
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet define. Please use /signup instead!'
    })


}
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.deleteUser = factory.deleteOne(User);
//Do NOT update passwords with this (validators not running!)
exports.updateUser = factory.updateOne(User);

/* exports.getAllUsers = catchAsync(async(req,res)=>{
    
    const users = await User.find();

        //SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        }) 
}) */


/* exports.getUser = async(req,res)=>{
    
    res.status(500).json({
        status: 'error',
        message: 'this route is not yet define'
    })


} */

/* exports.deleteUser = async(req,res)=>{
    
    res.status(500).json({
        status: 'error',
        message: 'this route is not yet define'
    })


} */

/* exports.updateUser = async(req,res)=>{
    
    res.status(500).json({
        status: 'error',
        message: 'this route is not yet define'
    })


}
 */