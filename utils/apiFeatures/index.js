class APIFeatures{

    constructor(query, queryString){
        this.query = query;
        this.queryString = queryString;
    }

    filter(){
        const queryObj = { ...this.queryString };//Copiando o req.query para query Object
        const exludedFields = ['page','sort','limit','fields'];
        exludedFields.forEach( el => delete queryObj[el]  )

        //1B) Advanced Filtering

        let queryStr = JSON.stringify(queryObj);
        queryStr =  queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        // { difficulty: 'easy', duration: { $gte: 5 } }

        this.query = this.query.find(JSON.parse(queryStr))
    
        return this;
    }

    sort(){
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
            // Ex ordenando com duas querys
            //sort('price ratingsAverage');
        } else {
            //Caso nao houver query sort, ordenar pela ordem decrescente de criacao
            this.query =  this.query.sort('-createdAt')
        }
        return this;
    }

    limitFields(){
        if(this.queryString.fields){
            const fields = this.queryString.fields.split(',').join(' ');
            this.query =  this.query.select(fields);
            //Envia so os campos presentes na query
        } else{
            //O menos serve para excluir uma prop
            // A prop __v serve somente para uso interno do MongoDB
            this.query =  this.query.select('-__v');
        }
        return this;
    }

    paginate(){

        //127.0.0.1:3000/api/v1/page=2&limit=10 -- > pagina 2 com 10 el por pagina
        // 1 - 10, page 1; 11 - 20, page 2; ... 
        // o metodo skip define quantos resultados devem ser pulados ate chegar na pagina correta 
        const page = Number(this.queryString.page) || 1;
        const limit = Number(this.queryString.limit) || 100;
        const skip = (page - 1) * limit;
        this.query =  this.query.skip(skip).limit(limit);

        return this; 
    }

}

module.exports = APIFeatures;

// <--- EXPLICAÇÃO --->
/*
A FUNCAO CONSTRUTORA DA CLASSE RECEBE DOIS PARAMETROS: Tour.find() e req.query

-> Tour.find() retorna uma query do banco de dados que pode utilizar os metodos .sort,.filter,.skip, ...

-> req.query sao as queries passadas na URL 

CADA METODO DA CLASSE FAZ AS ALTERACOE NECESSARIAS NA QUERY DA URL 
E APLICA OS METODOS NA QUERY RETORNADA POR Tour.find() 

CADA METODO RETORNA this (o proprio objeto) COM AS MODIFICACOES JA FEITAS 

A QUERY ENTAO E EXECUTADA NO CONTROLLER, POR MEIO DO AWAIT, E OS DADOS SAO RETORNADOS!
*/ 