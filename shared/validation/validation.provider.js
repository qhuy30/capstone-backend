const BaseError = require("../error/BaseError")

const Joi = require('joi');
function overrideSchemaBody(schemaBody){
    if (!schemaBody.username){
        schemaBody.username =Joi.string();
    }
    if (!schemaBody.session){
        schemaBody.session = Joi.any();
    }
    if (!schemaBody._service){
        schemaBody._service = Joi.any();
    }
    return Joi.object().keys(schemaBody).required();
}

function transformJoiError(error) {
    let errorDetails = error.details.map((detail) => {
        return {
            message: detail.message,
            path: detail.path.join("."),
        };
    });
    return errorDetails;
}


// function overrideExtendConfigJoi(config){
//     config.
// }
class ValidationProvider{
    constructor(){}
    initModuleValidation(){
        return Joi;
    }


    createMiddleware(schemaBody,req,res,next){

        let overrideSchemaBodyValue = overrideSchemaBody(schemaBody);
        Joi.validate(req.body,overrideSchemaBodyValue , (err, value) => {

            // create a random number as id
            // const id = Math.ceil(Math.random() * 9999999);

            if (err) {
                // send a 422 error response if validation fails
                res.status(422).json({
                    status: 'error',
                    message: 'Invalid request data',
                    data: err
                });
                res.end();
            } else {
                // send a success response if validation passes
                // attach the random ID to the data response
                // res.json({
                //     status: 'success',
                //     message: 'User created successfully',
                //     data: Object.assign({id}, value)
                // });
                next();
            }
        });
    }

    getDefaultKeys(){
        return {
            username : Joi.string(),
            session : Joi.any()
        }
    }

    createCustomMiddleware(schemaBody,req,res,next){
        Joi.validate(req.body,schemaBody , (err, value) => {

            // create a random number as id
            // const id = Math.ceil(Math.random() * 9999999);

            if (err) {
                // send a 422 error response if validation fails
                res.status(422).json({
                    status: 'error',
                    message: 'Invalid request data',
                    data: err
                });
                res.end();
            } else {
                // send a success response if validation passes
                // attach the random ID to the data response
                // res.json({
                //     status: 'success',
                //     message: 'User created successfully',
                //     data: Object.assign({id}, value)
                // });
                next();
            }
        });
    }

    createValidator (schemaBody, req, res, next, message = null) {
        const schema = overrideSchemaBody(schemaBody);
        const validateResult = Joi.validate(req.body, schema);
        if (validateResult.error) {
            res
                .status(422)
                .json({
                    status: "Validation Error",
                    message: message || "Invalid request data",
                    errors: validateResult.error,
                });
            return;
        }
        req.body = validateResult.value;
        next();
    }

    validateData(schema, data) {
        const validate = Joi.validate(data, schema, {});
        if (validate.error) {
            throw new BaseError("ValidationProvider.validateData", transformJoiError(validate.error), 422);
        }
        return validate.value;
    }

}

exports.ValidationProvider = new ValidationProvider();
