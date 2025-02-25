const { ValidationProvider } = require('../../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};

validation.loadListOfEmployee = function (req, res, next) {
    const schema_body = {
        idar: Joi.array().items(Joi.string().required()).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetails = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        type: Joi.string(),
        specialized: Joi.string(),
        it: Joi.string(),
        degree_english: Joi.string(),
        department: Joi.string(),
        status: Joi.string(),
        top:Joi.number().required(),
        offset:Joi.number().required(),
        sort:Joi.any().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        type: Joi.string(),
        specialized: Joi.string(),
        it: Joi.string(),
        degree_english: Joi.string(),
        department: Joi.string(),
        status: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.insert = Joi.object().keys({
    basic_salary: Joi.string().required(),
    type: Joi.string().required(),
    lastname: Joi.string().required(),
    midname: Joi.string().allow(""),
    firstname: Joi.string().required(),
    living: Joi.string().required(),
    permanent_address: Joi.string().required(),
    type_residence: Joi.string().required(),

    birth_date: Joi.string().required(),
    phonenumber: Joi.string().required(),
    email: Joi.string(),
    idcard : Joi.string().required(),
    nationality : Joi.string().required(),
    religion : Joi.string().required(),

    training_school : Joi.string().required(),
    graduation_year : Joi.string().required(),
    education : Joi.string().required(),
    degree : Joi.string().required(),
    specialized : Joi.string().required(),
    state_management : Joi.string().required(),
    political_theory : Joi.string().required(),
    it : Joi.string().required(),
    degree_english : Joi.string().required(),

    department : Joi.string().required(),
    competence : Joi.string().required(),

    from_date : Joi.string().required(),
    to_date : Joi.string().required()
}).required();

validation.genData_attachLabor = Joi.object().keys({
    id: Joi.string().required(),
    basic_salary: Joi.string().required(),
    type: Joi.string().required(),
    lastname: Joi.string().required(),
    midname: Joi.string().allow(""),
    firstname: Joi.string().required(),
    living: Joi.string().required(),
    permanent_address: Joi.string().required(),
    type_residence: Joi.string().required(),

    birth_date: Joi.string().required(),
    phonenumber: Joi.string().required(),
    email: Joi.string(),
    idcard : Joi.string().required(),
    nationality : Joi.string().required(),
    religion : Joi.string().required(),

    training_school : Joi.string().required(),
    graduation_year : Joi.string().required(),
    education : Joi.string().required(),
    degree : Joi.string().required(),
    specialized : Joi.string().required(),
    state_management : Joi.string().required(),
    political_theory : Joi.string().required(),
    it : Joi.string().required(),
    degree_english : Joi.string().required(),

    department : Joi.string().required(),
    competence : Joi.string().required(),

    from_date : Joi.string().required(),
    to_date : Joi.string().required()
}).required();

validation.update = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        basic_salary: Joi.number().required(),
        type: Joi.string().required(),
        lastname: Joi.string().required(),
        midname: Joi.string().allow(""),
        firstname: Joi.string().required(),
        living: Joi.any(),
        permanent_address: Joi.any(),
        type_residence: Joi.string(),

        birth_date : Joi.any(),
        phonenumber: Joi.string(),
        email: Joi.string(),
        idcard : Joi.string(),
        nationality : Joi.string(),
        religion : Joi.string(),
    
        training_school : Joi.string(),
        graduation_year : Joi.string(),
        education : Joi.string(),
        degree : Joi.string(),
        specialized : Joi.string(),
        state_management : Joi.string(),
        political_theory : Joi.string(),
        it : Joi.string(),
        degree_english : Joi.string(),
    
        department : Joi.string(),
        competence : Joi.string(),
    
        from_date : Joi.number(),
        to_date : Joi.number()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.pushFile = Joi.object().keys({
    id: Joi.string().required()
}).required();

validation.removeFile = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename : Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.approval = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        basic_salary: Joi.number().required(),
        type: Joi.string().required(),
        lastname: Joi.string().required(),
        midname: Joi.string().allow(""),
        firstname: Joi.string().required(),
        living: Joi.any().required(),
        permanent_address: Joi.any().required(),
        type_residence: Joi.string().required(),
        
        birth_date : Joi.any(),
        phonenumber: Joi.string().required(),
        email: Joi.string().required(),
        idcard : Joi.string().required(),
        nationality : Joi.string().required(),
        religion : Joi.string().required(),
    
        training_school : Joi.string().required(),
        graduation_year : Joi.string().required(),
        education : Joi.string().required(),
        degree : Joi.string().required(),
        specialized : Joi.string().required(),
        state_management : Joi.string().required(),
        political_theory : Joi.string().required(),
        it : Joi.string().required(),
        degree_english : Joi.string().required(),
    
        department : Joi.string().required(),
        competence : Joi.string().required(),
    
        from_date : Joi.number().required(),
        to_date : Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadFileInfo = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.deleteMulti = function (req, res, next) {
    const schema_body = {
        idar: Joi.array().items(Joi.string().required()).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;