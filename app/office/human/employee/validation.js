const { ValidationProvider } = require('../../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};
validation.loadDetails = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetails_dm = function (req, res, next) {
    const schema_body = {
        id: Joi.array().items(Joi.string().required()).required(),
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
validation.insert_many = function (req, res, next) {
    const schema_body = {
        data: Joi.array().items(Joi.object().required()).required()
    };

    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.insert = function (req, res, next) {
    const schema_body = {
        lastname: Joi.string().required(),
        midname: Joi.string().allow(""),
        firstname: Joi.string().required(),
        birth_date: Joi.any().required(),
    
        phonenumber: Joi.string().required(),
        email: Joi.string().required(),
        idcard : Joi.string().required(),
        department : Joi.string().required(),
        competence : Joi.string().required()
    };

    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update_background_general = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        lastname: Joi.string().required(),
        midname: Joi.string().allow(""),
        firstname: Joi.string().required(),
        birth_date: Joi.any().required(),
        living: Joi.any(),
        permanent_address: Joi.any(),
        place_birth: Joi.any(),
        domicile: Joi.any(),
        permanent_address: Joi.any(),
        type_residence: Joi.string(),
    
        phonenumber: Joi.string(),
        email: Joi.string(),
        idcard : Joi.string(),
        nationality : Joi.string(),
        religion : Joi.string(),
        folk: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.push_background_family = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        childid: Joi.string().required(),
        fullname: Joi.string().required(),
        job: Joi.string().required(),
        born_in: Joi.string().required(),
        relationship: Joi.string().required(),
        t8_1945: Joi.string().required(),
        tdPhap: Joi.string().required(),
        n1955: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.remove_background_family = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        childid: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update_background_family = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        childid: Joi.string().required(),
        fullname: Joi.string(),
        job: Joi.string(),
        born_in: Joi.string(),
        relationship: Joi.string(),
        t8_1945: Joi.string(),
        tdPhap: Joi.string(),
        n1955: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update_signature = Joi.object().keys({
    id: Joi.string().required(),
    oldfile: Joi.string()
}).required();

validation.update_education_general = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        training_school : Joi.string(),
        graduation_year : Joi.string(),
        education : Joi.string(),
        degree : Joi.string(),
        specialized : Joi.string(),
        state_management : Joi.string(),
        political_theory : Joi.string(),
        it : Joi.string(),
        degree_english : Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update_mission_general = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        department : Joi.string().required(),
        competence : Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update_salary_general = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        basic_salary : Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_user = function (req, res, next) {
    const schema_body = {
        id : Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.register_account = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        user : Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.check_declaration = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update_quotation_mark = Joi.object()
    .keys({
        id: Joi.string().required(),
        oldfile: Joi.string(),
    })
    .required();

exports.validation = validation;