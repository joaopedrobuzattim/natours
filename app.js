const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter  = require('./routes/tourRoutes');
const userRouter  = require('./routes/userRoutes');
const revierRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.enable('trust proxy');

// Setting view Engine
app.set('view engine','pug');
// Set view location
app.set('views',path.join(__dirname,'views'));

// 1 - GLOBAL MIDDLEWARES

//Implement cors
//Para todos os dominios: Access-Control-Allow-Origin * 
app.use(cors());

// Permitindo em dominios espedificos (ex: api e front em locais diferentes)
// api -> api.natours.com , frontEnd -> natours.com
// app.use(cors({ origin: 'https://www.natours.com/'  }))

// Non incoming requests, ex: delete request
// O metodo options serve para verificar se essas requisicoes sao permitidas
app.options('*', cors());
// Example com rota especifica
// app.options('api/v1/tours/:id', cors());

//Serving statics files
app.use(express.static(path.join(__dirname,'public')));

// Set Security HTTP Headers
app.use(helmet())

//Development login
if(process.env.NODE_ENV === 'development'){
    app.use(morgan("dev"));
}

//Limit requests from same API
const limiter = rateLimit({
    //Perimite no maximo 100 req de um mesmo ip por hora
    max:100,
    windowMs: 60 * 60 * 1000,
    message: "To many requests from this IP, please try again in an hour"
})
app.use('/api',limiter)

//Body parser, reading data from body into req.body
app.use(express.json({
    limit: '10kb' // Limitar a quantidade maxima de dados por body
}));
app.use(express.urlencoded({ extended: true, limit: '10kb' })) // Parse data coming from url enconded form (<form action='url' method='POST')
app.use(cookieParser()) // Parse cookies

//Data sanitization againtst NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Prevent parameter polution
app.use(hpp({
    //Permitirdos a duplicação
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));

app.use(compression());

//Teste
app.use((req,res,next)=>{
    req.requestTime = new Date().toISOString();
    next();
})

// 2 -ROUTES



//Mounting the routes
app.use('/', viewRouter);
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',revierRouter);
app.use('/api/v1/booking',bookingRouter);
/**/

// 3) HANDLING ERRORS


//All http methods
//Se nenhuma rota for tratada por nenhum middleware
//Execute: 
app.all('*', (req,res,next)=>{
    next(new AppError(`Can't find ${req.originalUrl} on this server!`,404));
});

//SEMPRE QUE A FUNCAO NEXT RECEBER UM ARGUMENTO
//EXPRESS IRÁ TRATAR COMO ERRO
// TODAS AS PROXIMAS FUNCOES DE MIDDLEWARES NA SEQUENCIA SERAO PULADAS
// ATE CHEGAR NA FUNCAO PARA TRATAR O ERRO PASSADO
// ENTÃO A FUNCAO PARA TRATAR O ERRO SERA EXECUTADA 

//Ao especificar os 4 parametros, expresse interpreta como uma funcao
// para tratar erros 

app.use(globalErrorHandler);

module.exports = app;