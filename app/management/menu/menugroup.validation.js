const {ValidationProvider} = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation ={};

validation.insert = function(req,res,next){
    const schema_body = {
        title : Joi.any().required(),
        ordernumber: Joi.number().min(0).required(),
        isactive : Joi.boolean().required(),
        icon : Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body,req,res,next);
}

validation.update = function(req,res,next){
    const schema_body = {
        title : Joi.any().required(),
        id : Joi.string().required(),
        ordernumber: Joi.number().min(0).required(),
        isactive : Joi.boolean().required(),
        icon : Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body,req,res,next);
}

validation.delete = function(req,res,next){
    const schema_body = {
        id : Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body,req,res,next);
}

exports.validation = validation;