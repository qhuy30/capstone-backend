const { string } = require("joi");
const { ValidationProvider } = require("../../../shared/validation/validation.provider");
const {
    CUSTOM_TEMPLATE_TAG_TYPE,
    WORKFLOW_FILE_TYPE,
    WORKFLOW_DURATION_UNIT,
    WORKFLOW_ORGANIZATION_SCOPE,
} = require("../../../utils/constant");

const Joi = ValidationProvider.initModuleValidation();

var validation = {};

function buildBaseSchema() {
    const baseSchema = {
        title: Joi.object({
            "vi-VN": Joi.string().required(),
            "en-US": Joi.string().required(),
        }),
        key: Joi.string().required(),
        flow: buildFlowSchema(),
        department_scope: Joi.string().valid(Object.values(WORKFLOW_ORGANIZATION_SCOPE)).required(),
        department: Joi.when("department_scope", {
            is: WORKFLOW_ORGANIZATION_SCOPE.SPECIFIC,
            then: Joi.string().required(),
            otherwise: Joi.string().allow(null, ""),
        }),
        competence: Joi.array().items(Joi.string()),
        job: Joi.array().items(Joi.string()),
        role: Joi.array().items(Joi.string()),
        file_type: Joi.string().valid(WORKFLOW_FILE_TYPE.FILE_UPLOAD, WORKFLOW_FILE_TYPE.CUSTOM_TEMPLATE),
        templateFiles: Joi.when("file_type", {
            is: WORKFLOW_FILE_TYPE.CUSTOM_TEMPLATE,
            then: Joi.array().items(Joi.object().required()),
            otherwise: Joi.array().items(Joi.object()),
        }),
        templateTags: Joi.alternatives().try(
            Joi.array().length(0).optional(),
            buildCustomTagsSchema()
          ),
        allow_appendix: Joi.boolean().required(),
        allow_choose_destination: Joi.boolean().required(),
        is_personal: Joi.boolean().optional(),
        is_department: Joi.boolean().optional(),
    };
    return Joi.object().keys(baseSchema);
}

function buildCustomTagsSchema() {
    const baseSchema = {
        name: Joi.string().required(),
        label: Joi.string().required(),
        type: Joi.string()
            .valid(
                CUSTOM_TEMPLATE_TAG_TYPE.TEXT,
                CUSTOM_TEMPLATE_TAG_TYPE.NUMBER,
                CUSTOM_TEMPLATE_TAG_TYPE.DATE,
                CUSTOM_TEMPLATE_TAG_TYPE.DROP_DOWN,
                CUSTOM_TEMPLATE_TAG_TYPE.PICK,
                CUSTOM_TEMPLATE_TAG_TYPE.SIGNATURE,
                CUSTOM_TEMPLATE_TAG_TYPE.QUOTATION_MARK,
                CUSTOM_TEMPLATE_TAG_TYPE.CREATOR_SIGNATURE,
                CUSTOM_TEMPLATE_TAG_TYPE.CREATOR_QUOTATION_MARK,
            )
            .required(),
        format: Joi.when("type", {
            is: "date",
            then: Joi.string().required(),
            otherwise: Joi.forbidden(),
        }),
        masterKey: Joi.when("type", {
            is: "dropdown",
            then: Joi.string().required(),
            otherwise: Joi.forbidden(),
        }),
        pickKey: Joi.when("type", {
            is: "pick",
            then: Joi.string().required(),
            otherwise: Joi.forbidden(),
        }),
    };
    return Joi.array().items(Joi.object().keys(baseSchema).required());
}

function buildFlowItemSchema() {
    const baseSchema = {
        id: Joi.string().required(),
        department: Joi.allow(null, "").default(null),
        competence: Joi.allow(null, "").default(null),
        role: Joi.string().allow(null, "").default(null),
        signature: Joi.string().allow(null, "").default(null),
        quotationMark: Joi.string().allow(null, "").default(null),
        methods: Joi.string().allow(null, "").default(null),
        processType: Joi.string().allow(null, "").default(null),
        rule: Joi.array().items(Joi.string()).default([]),
    };
    return Joi.object().keys(baseSchema);
}

function buildFlowSchema() {
    const baseSchema = {
        id: Joi.string().required(),
        title: Joi.string().required(),
        type: Joi.string().valid("one", "all", "process","receiver").required(),
        items: Joi.array().items(buildFlowItemSchema().required()),
        duration: Joi.object().keys({
            amount: Joi.number().positive().required(),
            unit: Joi.string().valid(Object.values(WORKFLOW_DURATION_UNIT)).required(),
        }),
        auto_completed_task: Joi.boolean().required()
    };
    return Joi.array().items(Joi.object().keys(baseSchema).required());
}

validation.load_details = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.load = function (req, res, next) {
    const schema_body = {
        key: Joi.string(),
        department: Joi.string().allow(null, "").required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.loadFileTemplateInfo = function (req, res, next) {
    const schema_body = {
        name: Joi.string(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.downloadfile = function (req, res, next) {
    const schema_body = {
        filename: Joi.string(),
        id: Joi.any(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.load_follow_department = function (req, res, next) {
    const schema_body = {
        key: Joi.array().items(Joi.string()),
        department: Joi.string().allow(null, "").required(),
        search: Joi.string(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.insert = function (req, res, next) {
    const schema_body = {
        title: Joi.any().required(),
        key: Joi.string().required(),
        flow: Joi.any().required(),
        department_scope: Joi.string().valid(Object.values(WORKFLOW_ORGANIZATION_SCOPE)).required(),
        department: Joi.when("department_scope", {
            is: WORKFLOW_ORGANIZATION_SCOPE.SPECIFIC,
            then: Joi.string().required(),
            otherwise: Joi.string().allow(null, ""),
        }),
        competence: Joi.array(),
        job: Joi.array(),
        role: Joi.array(),
        is_personal: Joi.boolean().optional(),
        is_department: Joi.boolean().optional(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.update = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        title: Joi.any().required(),
        key: Joi.string(),
        flow: Joi.any(),
        department_scope: Joi.string().valid(Object.values(WORKFLOW_ORGANIZATION_SCOPE)).required(),
        department: Joi.when("department_scope", {
            is: WORKFLOW_ORGANIZATION_SCOPE.SPECIFIC,
            then: Joi.string().required(),
            otherwise: Joi.string().allow(null, ""),
        }),
        competence: Joi.array(),
        job: Joi.array(),
        role: Joi.array(),
        is_personal: Joi.boolean().optional(),
        is_department: Joi.boolean().optional(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.insertSchema = function () {
    return buildBaseSchema().required();
};

validation.updateSchema = function () {
    const baseSchema = buildBaseSchema();
    const extended = baseSchema.keys({
        id: Joi.string().required(),
    });
    return extended.required();
};

validation.customTemplatePreview = function (req, res, next) {
    const schemaBody = {
        workflowId: Joi.string().required(),
        tagsValue: Joi.object().required(),
    };
    ValidationProvider.createMiddleware(schemaBody, req, res, next);
};

exports.validation = validation;
