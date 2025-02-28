const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};

validation.login = function (req, res, next) {
    const schema_body = {
        data: Joi.object().keys({
            username: Joi.string().required(),
            password: Joi.string().required(),
            remember: Joi.boolean().required()
        }).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.refreshToken = function (req, res, next) {
    const schema_body = {
        refreshToken: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.changePassword = function (req, res, next) {
    const schema_body = {
        password: Joi.string().required(),
        newpassword: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.changeLanguage = function (req, res, next) {
    const schema_body = {
        key: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.changeLanguageMobile = function (req, res, next) {
    const schema_body = {
        key: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.register = function (req, res, next) {
    const schema_body = {
        title: Joi.string().required(),
        account: Joi.string().required(),
        password: Joi.string().required(),
        language:Joi.string(),
        isactive:Joi.boolean(),
        department: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.sub_register = function (req, res, next) {
    const schema_body = {
        username: Joi.string().required(),
        password: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_for_add_friend = function (req, res, next) {
    const schema_body = {
        search: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        isactive: Joi.boolean(),
        top:Joi.number().required(),
        offset:Joi.number().required(),
        sort : Joi.object().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_for_pick_user_directive = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        // department: Joi.string().required(),
        department: Joi.string(),
        top:Joi.number().required(),
        offset:Joi.number().required(),
        sort : Joi.object().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_by_rule = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        rule: Joi.string().required(),
        top:Joi.number().required(),
        offset:Joi.number().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count_by_rule = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        rule: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadForDirective = function (req, res, next) {
    const schema_body = {
        account: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadManyForDirective = function (req, res, next) {
    const schema_body = {
        usernames: Joi.array().items(Joi.string().required())
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetails = function (req, res, next) {
    const schema_body = {
        account : Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        isactive: Joi.boolean()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count_for_pick_user_directive = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        department: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.checkexist = function (req, res, next) {
    const schema_body = {
        account: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        title: Joi.string(),
        isactive: Joi.boolean().required(),
        role: Joi.array().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.reset_password = function (req, res, next) {
    const schema_body = {
        account: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.reset_permission = function (req, res, next) {
    const schema_body = {
        account: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.pushRule = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        rule: Joi.object({
            rule :Joi.string().required(),
            details : Joi.object()
        }).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.removeRule = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        rule: Joi.object({
            rule :Joi.string().required(),
            details : Joi.object()
        }).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}




validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.loadByRole = function (req, res, next) {
    const schema_body = {
        role: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.loadByDepartment = function (req, res, next) {
    const schema_body = {
        department: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update_FCM_token = function (req, res, next) {
    const schema_body = {
        token: Joi.string().allow(""),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;