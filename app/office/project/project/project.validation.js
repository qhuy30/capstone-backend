const { ValidationProvider } = require('../../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};

validation.load = function(req, res, next) {
    const schema_body = {
        search: Joi.string(),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.object().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_by_department = function(req, res, next) {
    const schema_body = {
        department: Joi.string().required(),
        search: Joi.string().allow(null, ''),
        top: Joi.number(),
        offset: Joi.number(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.load_joined_projects = function(req, res, next) {
    const schema_body = {
        search: Joi.string().allow(null, ''),
        top: Joi.number(),
        offset: Joi.number(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.load_details_m = function (req, res, next) {
    const schema_body = {
        _ids: Joi.array().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function(req, res, next) {
    const schema_body = {
        search: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.checkexist = function(req, res, next) {
    const schema_body = {
        key: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.insert = function (req, res, next) {
    const schema_body = {
        title: Joi.string().required(),
        from_date: Joi.number().required(),
        to_date: Joi.number().required(),
        participant: Joi.array().items(Joi.string()),
        task_id: Joi.string().allow(null, ''),
        workflowPlay_id: Joi.string().allow(null, ''),
        parents: Joi.array(),
        parent: Joi.object()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};


validation.updateParticipant = function(req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        participant: Joi.array().items(Joi.string()).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.delete = function(req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        title: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        title: Joi.string().required(),
        from_date: Joi.number().required(),
        to_date: Joi.number().required(),
        workflowPlay_id: Joi.string().allow(null, ''),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.start = function(req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.close = function(req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.statistic_growth = function (req, res, next) {
    const schema_body = {
        from_date: Joi.number().required(),
        to_date: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.statistic_count = function (req, res, next) {
    const schema_body = {
        from_date: Joi.number().required(),
        to_date: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
exports.validation = validation;
