const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const { NOTIFY_TAB, NOTIFY_TYPE } = require('./const');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};

validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        department: Joi.string(),
        checks: Joi.array().items(Joi.string().valid( Object.values(NOTIFY_TAB))).required(),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.any().required(),
        start_date: Joi.date().timestamp(),
        end_date: Joi.date().timestamp(),
        news_type: Joi.string(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.save_bookmark = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.unsave_bookmark = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.load_home = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        group: Joi.string(),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.any().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.load_details = function (req, res, next) {
    const schema_body = {
        id: Joi.string().optional(),
        code: Joi.string().optional()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.reload_details = function (req, res, next) {
    const schema_body = {
        id: Joi.string().optional(),
        code: Joi.string().optional()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string().allow(''),
        checks: Joi.array().items(Joi.string().valid( Object.values(NOTIFY_TAB))).required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.count_home = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        group: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.load_file_info = function (req, res, next) {
    const schema_body = {
        code: Joi.string().optional(),
        id: Joi.string().optional(),
        filename: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.downloadfile = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.pushfile = Joi.object().keys({
    id: Joi.string().required(),
}).required();

validation.removefile = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.insert = Joi.object().keys({
    title: Joi.string().required(),
    content: Joi.string().required(),
    group: Joi.string().required(),
    type: Joi.string().valid(Object.values(NOTIFY_TYPE)).required(),
    to_employee: Joi.string().required(),
    to_department: Joi.string().required(),
    to_director: Joi.string(),
    task_id: Joi.string()
}).required();

validation.approval = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        note: Joi.string().allow(''),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.reject = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        reason: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.seen = function (req, res, next) {
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

validation.recall = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        recall_reason: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.like = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.unlike = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.throw_to_recyclebin = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.restore_from_recyclebin = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_quick_handle = function (req, res, next) {
    const schema_body = {
        search: Joi.string().allow(''),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.any().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.count_quick_handle = function (req, res, next) {
    const schema_body = {
        search: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;
