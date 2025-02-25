const {ValidationProvider} = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation ={};

validation.getDetailsBykey = function(req,res,next){
    const schema_body = {
        key : Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body,req,res,next);
}

exports.validation = validation;