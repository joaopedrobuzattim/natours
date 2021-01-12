const AppError = require("../../utils/appError");

const sendErrorDev = (err,req,res)=>{

    //Se a url for da API, entao enviaremos um erro em formato JSON com as informacoes
    // Caso contrario, estaremos nas views, entao  renderizaremos um erro na pagina
    // API
    if(req.originalUrl.startsWith('/api')){
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err,
            stack:err.stack
        })
    } 
    // RENDERED WEBSITE
    console.error('ERROR!!',err);
    return res.status(err.statusCode).render('error',{
        title: 'Something went wrong!',
        msg: err.message
    })
    

}

const sendErrorProduction = (err,req,res)=>{

    //API
    if(req.originalUrl.startsWith('/api')){
        //Operational, trusted error: send message to the cliente
        // Erros que sabemos o que causou e queremos alertar o usuario
        // Aqui nao estao erros relacionados a erros de codigo!
        if(err.isOperational){
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            })
        }
        //Programming or another unknow error: don't leak error details
         
            //1) LOG the error
                console.error('ERROR!!',err);
            //2) Send generic message
            return res.status(500).json({
                status: 'error',
                message: 'Something went very wrong!',
            })
        

    } 
    //RENDERED WEBSITE
    //Operational, trusted error: send message to the cliente
    // Erros que sabemos o que causou e queremos alertar o usuario
    // Aqui nao estao erros relacionados a erros de codigo!
    if(err.isOperational){    
        return res.status(err.statusCode).render('error',{
            title: 'Something went wrong!',
            msg: err.message
        })
    }
    //Programming or another unknow error: don't leak error details
        
    //1) LOG the error
        console.error('ERROR!!',err);
    //2) Send generic message
    // RENDERED WEBSITE
    return res.status(err.statusCode).render('error',{
        title: 'Something went wrong!',
        msg: 'Please try again later'
    })
    
        
    

    
}

const handleCastErrorDB = (err)=>{
     const message = `Invalid ${err.path}: ${err.value}`;
     return new AppError(message, 400);
}

const handleDuplicatedFields = (err)=>{
    const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    const message = `Duplicated field value: ${value}. Please use another value!`;
    return new AppError(message,400)
}

const handleValidationErrorDB = (err)=>{
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data.${errors.join('. ')}`;
    return new AppError(message, 400);

}

const handleJWTError = () => new AppError('Invalid token. Please log in again!',401);

const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again!',401)


module.exports = (err, req,res,next)=>{

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err,req,res);
    }else if(process.env.NODE_ENV === 'production'){
        //Copiando err
        let error = { ...err }
        //Resolvendo erro, o objeto que recebe a copai de err
        // não estava recebendo a prop message, por isso, foi setada manualmente
        error.message = err.message;
        //Mongoose Error (Formata para o formato de erro da nossa classe )
        if(error.name === 'CastError') error = handleCastErrorDB(error);
        if(error.code === 11000) error = handleDuplicatedFields(error);
        if(error.name === 'ValidatorError') error = handleValidationErrorDB(error);
        if(error.name === 'JsonWebTokenError') error = handleJWTError();
        if(error.name === 'TokenExpiredError') error = handleJWTExpiredError()
        sendErrorProduction(error,req,res);
    }


    
    
}