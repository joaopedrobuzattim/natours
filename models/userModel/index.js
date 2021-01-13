// Reset token password
const crypto = require('crypto');
const mongoose = require('mongoose');
//LIB PARA VALIDACAO
const validator = require('validator');
//HASH Passwords
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({

    name:{
        type: String,
        required: [true, 'Please tell us your name!']
    },
    email:{
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        //Convert all to lower case
        lowercase: true,
        //Validator for email
        validate:[validator.isEmail, 'Please provide a valid email!']

    },
    role:{
        type: String,
        enum:['user','guide','lead-guide','admin'],
        default: 'user'
    },
    photo:{
        type: String,
        default: 'default.jpg'
    },
    password: {
        type: String,
        required:[true, 'Please provide a password'],
        minlength:8,
        //Quando os usuarios forem listados, esse campo não será mostrado
        select: false
    },
    passwordConfirm:{
        type:String,
        required: [true, 'Please confim your password'],
        validate:{
            // This only works on CREATE and SAVE!! 
            validator: function(el){
                return el === this.password
            },
            message: 'Passwords are not the same!'
        }
    },

    passwordChangedAt: Date,

    passwordResetToken: String,

    passwordResetExpires: Date,

    active:{
        type: Boolean,
        default:true,
        select:false
    }



})

//Document middleware
// Hash da senha (encryption)
userSchema.pre('save', async function(next){
    //SE O CAMPO NÃO FOI MODIFICADO, RETORNE DA FUNCAO
    if(!this.isModified('password')) return next();
    
    //Primeiro param - senha , segundo - forca da CPU usada na operacao
    this.password = await bcrypt.hash(this.password, 12);
    //A confirmacao nao deve ser armazenada no DB, serve somente para valdiacao
    // por isso esta sendo deletada 
    this.passwordConfirm = undefined;
})

userSchema.pre('save',function(next){
    //Se a senha nao foi modificada ou se o documento é novo
    //retorna 
    if(!this.isModified('password') || this.isNew) return next()
    //As vezes o token pode demorar para ser cruado e passwordChangedAt
    // fica é maior do que a data de criacao do token, causando um erro
    // logo, subtraimos 1s para evitar isso
    this.passwordChangedAt = Date.now() -1000;
    next()
})

//QUERY MIDDLEWARE
/* userSchema.pre(/^find/,function(next){

    // this points to the current query
    this.find({active: { $ne: false } });
    next();

}) */

//Instance method, metodo que estara disponivel em todos os documentos 
//da mesma colecao.
//this se refere-se ao documento atual
userSchema.methods.correctPassword = async function(candidatePassword,userPassword){
    //Compara as duas senhas
    return await bcrypt.compare(candidatePassword, userPassword)

}

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp){
    
    if(this.passwordChangedAt){

        const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
        console.log(changedTimestamp, JWTTimeStamp);
        return JWTTimeStamp < changedTimestamp;
    }
    //False means NOT changed
    return false;
}

userSchema.methods.createPasswordResetToken = function(){
    
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    //  + 10 min covertidos em millissegundos
    this.passwordResetExpires = Date.now() + 10 * 60 *1000;

    return resetToken;

}

const User = mongoose.model('User',userSchema);
module.exports = User;