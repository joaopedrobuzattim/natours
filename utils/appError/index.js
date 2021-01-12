class AppError extends Error{

    constructor(message, statusCode){
        //Como a classe extende de Error, e o parametro passado para error sera a mensagem, au chamar super(message), this.message sera o valor da mensagem passada para error!
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        //A funcão construtora nao vai aparecer na stack trace do erro (log que mostra onde o erro ocorreu)
        Error.captureStackTrace(this, this.constructor)
    }


}

module.exports = AppError;