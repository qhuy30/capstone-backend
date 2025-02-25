const {ValidationProvider} = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation ={};

validation.load = function(req,res,next){
    const schema_body = {
        search : Joi.string(),
        active: Joi.boolean(),
        id : Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body,req,res,next);
}

validation.getOrderNumber = function(req,res,next){
    const schema_body = {
        id : Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body,req,res,next);
}

validation.insertAsComponent = function(req,res,next){
    const schema_body = {
        id : Joi.string().required(),
        title : Joi.any().required(),
        keyofmenu : Joi.string().alphanum().required(),
        ordernumber: Joi.number().required(),
        isactive:Joi.boolean().required()
    };
    ValidationProvider.createMiddleware(schema_body,req,res,next);
}

validation.insertAsUrl = function(req,res,next){
    const schema_body = {
        id : Joi.string().required(),
        url : Joi.string().required(),
        ordernumber: Joi.number().required(),
        isactive:Joi.boolean().required(),
        title : Joi.any().required()
    };
    ValidationProvider.createMiddleware(schema_body,req,res,next);
}

validation.updateAsComponent = function(req,res,next){
    const schema_body = {
        id : Joi.string().required(),
        title : Joi.any().required(),
        keyofmenu : Joi.string().alphanum().required(),
        ordernumber: Joi.number().required(),
        isactive:Joi.boolean().required(),
        idofmenu : Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body,req,res,next);
}
validation.updateAsUrl = function(req,res,next){
    const schema_body = {
        id : Joi.string().required(),
        url : Joi.string().required(),
        ordernumber: Joi.number().required(),
        isactive:Joi.boolean().required(),
        idofmenu : Joi.string().required(),
        title : Joi.any().required()
    };
    ValidationProvider.createMiddleware(schema_body,req,res,next);
}
validation.delete = function(req,res,next){
    const schema_body = {
        id : Joi.string().required(),
        idofmenu : Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body,req,res,next);
}
exports.validation = validation;