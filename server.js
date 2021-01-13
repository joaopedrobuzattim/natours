//UTILIZAR VARIAVEIS DE AMBIENTE
const dotenv = require('dotenv');
//Mongoose
const mongoose = require('mongoose');

process.on('uncaughtException',err=>{
    //console.log(err.name,err.message);
    console.log('UNCAUGHT EXCEPTION! Shutting down...');
    process.exit(1);
})


//UTILIZAR VARIAVEIS DE AMBIENTE
dotenv.config({path: './config.env'});

const app = require('./app.js');

const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);

mongoose
.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
})
.then( () => console.log("DB CONNECTION SUCCESSFULL!"));



// 4 - STARTS THE SERVER 
const port = process.env.PORT || 3000;
const server = app.listen(port,()=>{
    console.log("App running on port: "+port+"...");
})

//SEMPRE QUE HOUNER REJEICAO DE UMA PROMISE NAO TRATADA
// O EVENETO ABAIXO OCORRERÁ, BASTA OUVIR E EXECUTAR O CALLBACK
process.on('unhandledRejection',err=>{
    console.log(err.name,err.message);
    console.log('UNHANDLER REJECTION!! Shutting down...')
    server.close(()=>{
        //Apos o servidor fechar, finalize aplicação
        process.exit(1)
    })
    //0 - Success
    // 1 - Uncaught Exception
})

process.on('SIGTERM', ()=>{
    console.log('SIGTERM RECIEVED. Shuting down gracefully');
    server.close(()=>{
        console.log('Process terminated!');
    })
})

