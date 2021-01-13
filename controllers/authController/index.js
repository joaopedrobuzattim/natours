// Usar promises com callbacks
const {promisify} = require('util');
const User = require('./../../models/userModel');
const catchAsync = require('../../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require("../../utils/appError");
const Email = require("../../utils/email");
const crypto = require('crypto');



const signToken = id =>{
    return jwt.sign( {id: id}, process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES_IN
    } )
}

const createAndSendToken = (user,statusCode,req,res)=>{
    const token = signToken(user._id);

    const cookieOptions = {
        //Validade
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        // Cookie nao pode ser modificado ou acessado atraves do Broswe
        httpOnly: true
    }
    /* cookieOptions.secure = true -> if the client is only to return the cookie in subsequent requests 
    if those requests  use Secure Hypertext Transfer Protocol (HTTPS); otherwise, false. 
    The default is false. */
    if(req.secure || req.headers('x-forwarded-proto') === 'https')
        cookieOptions.secure = true;//Somente conexao HTTPS
    
    res.cookie('jwt', token , cookieOptions );

    //Remove the password from the output
    user.password = undefined;
    
    res.status(statusCode).json({
        status: 'success',
        token,
        data:{
            user
        }
    })
}

exports.signup = catchAsync(async (req,res,next)=>{
    //Retorna uma promisse para criar um usuario
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role
    }); 
    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser,url).sendWelcome()
    // Criando o TKEN
    // Parametros
    // Payload (dados)
    // Secret, por seguranca, deve ser unica e ter mais de 32 charc
    // Options, exemplo: expiresIn: tempo que deve ser expirado o token
    createAndSendToken(newUser,201,req,res);
 
})

exports.login = catchAsync(async (req,res,next)=>{
    const {email, password} = req.body;

    //1) Check if email and password exist
    if(!email || !password){
        return next(new AppError('Please provide email and password!',400));
    }

    //2) Check if user exists && passowrd is correct
    // +password para mostrar a prop que estava com select definido como false
    const user = await User.findOne({email: email}).select('+password')
    
    //Verificando email e senha para evitr potenciais ataques
    // evitando que o hacker saiba qual campo esta corretou ou errado 
    if(!user || !(await  user.correctPassword(password,user.password))){
        return next(new AppError('Incorrect email or password',401));
    }

    //3) If everything ok, send the token to client
    createAndSendToken(user,200,req,res);

})

exports.logout = (req,res) =>{
    res.cookie('jwt','loggedout',{
        expires: new Date(Date.now()+ 100),
        httpOnly: true
    })
    res.status(200).json({status: 'success'});
}

exports.protect = catchAsync(async(req,res,next)=>{ 
    let token;
    // 1) Getting token and check if it's there
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    } else if(req.cookies.jwt){//Se nao houver token na req, verirficar nos cookies 
        token = req.cookies.jwt;
    }  
    if(!token){
        return next(new AppError('You are not logged in! Please log in to get access',401));
    }
    // 2) Validate the token (Verification)
    const decoded =  await promisify(jwt.verify)(token,process.env.JWT_SECRET)

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id)
    if(!currentUser) {
        return next(new AppError('The user belonging to the token no longer exists!'));
    }
    // 4) Ckeck if user changed password after JWT token was issued(emitido)
    // iat = issued at 
   if(currentUser.changedPasswordAfter(decoded.iat)){
       return next(new AppError('Use recently changed password! Please log in again',401));
   }

   //GRANT ACCESS TO PROTECTED ROUTE
   req.user = currentUser; //Utilizado no middleware restrictTo
   res.locals.user = currentUser; //Pug template tera acesso a res.locals!!
    next();
})

// Only for rendered pages, no error!
exports.isLoggedIn = async(req,res,next)=>{ 
  
    if(req.cookies.jwt){ 
        try{

            token = req.cookies.jwt;
            
        
            // 1) Verify token
            const decoded =  await promisify(jwt.verify)(req.cookies.jwt,process.env.JWT_SECRET)

            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id)
            if(!currentUser) {
                return next();
            }
            // 3) Ckeck if user changed password after JWT token was issued(emitido)
            // iat = issued at 
            if(currentUser.changedPasswordAfter(decoded.iat)){
                return next();
            }

            //THERE IS A LOGGED IN USER
            res.locals.user = currentUser; //Pug template tera acesso a res.locals!! 
        
            return next();
        } catch(err){
            return next();
        }
    }    
    next();
}

exports.restrictTo = (...roles)=>{ 
    return (req,res,next) =>{ 
        // roles example: ['admin','lead-guide']
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action',403));
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async (req,res,next)=>{

    //1) Get user based on posted email
    const user = await User.findOne({ email: req.body.email })
    if(!user) {
        return next(new AppError('There is no user with email address',404));
    }
    
    //2) Generate the random signToken
    const resetToken = user.createPasswordResetToken();
    // Salva as mudancas com a opcao de desativar os validadores,
    // para somente os dados necessarios serem salvos
    await user.save({validateBeforeSave: false});
    
    //3) Send it tu user's email
    
    /* const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}.\n If you didn't forget your password, please ignote this!`; */
    
    try {
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        /* await sendEmail({
            email: user.email,
            subject: 'Your password reset token is valid for 10 min',
            message        
            }) */
        await new Email(user,resetUrl).sendPasswordReset();
    } catch (error) {
        //Se houver algum erro, redefinir estes campos, salvar e enviar para a funcao global de erros uma mensagem
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        console.log(error);
        await user.save(  {validateBeforeSave: false }  )
    
        return next(new AppError('There was an error sending the email. Try again later'),500)
    }

    res.status(200).json({
        status: 'success',
        message: 'Token send to email!'
    })
})

exports.resetPassword =  catchAsync(async(req,res,next)=>{

    //1) Get user based on the Token
     const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

     const user = await User.findOne({
         passwordResetToken: hashedToken,
        passwordResetExpires: {$gt: Date.now()}
    })
    //2) If token has not expired and ther is an user, set new password
    if(!user){
        return next(new AppError('Token is invalid or has expired'),400)
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save()
    //3) Update changedpasswordAt property for the users

    //4) Log the user in, send JWT
    createAndSendToken(user,200,req,res);


})

exports.updatePassword = catchAsync(async(req,res,next) =>{
     
    // 1 ) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2 ) Check if POSTed current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        console.log(req.body.passwordCurrent)
        return next(new AppError('Your current password is wrong'),404)
    }
    // 3 ) If so, update de password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will not work as intended! 

    // 4) Log user in, send JWT
    createAndSendToken(user,200,req,res);
})