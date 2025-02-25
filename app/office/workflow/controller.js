
const { WorkflowService } = require('./service');
const q = require('q');
const joi = require('joi');

const { FileProvider } = require('../../../shared/file/file.provider');
const { LogProvider } = require('../../../shared/log_nohierarchy/log.provider');

const utils = require('../../../utils/util');
const workflowUtil = require('../../../utils/workflowUtil');
const fileUtils = require('../../../utils/fileUtil');

const { validation } = require('./validation');
const { WORKFLOW_FILE_TYPE, WORKFLOW_DURATION_UNIT, WORKFLOW_ORGANIZATION_SCOPE } = require('../../../utils/constant');
const nameLib = "workflow";
const parentFolder = "office";

function count_follow_department(body){
    let count =0;
    if (body.key ) {
        count++;
    }

    if(body.search && body.search!==""){
        count++;
    }
    return count;
}

function genFilter_follow_department(body) {
    let count = count_follow_department(body);
    if (count === 0) {
        if (body.department) {
            return {
                department: body.department,
            };
        } else {
            return {
                department_scope: WORKFLOW_ORGANIZATION_SCOPE.ALL,
                department: { $eq: null },
            };
        }
    }

    let filter = { $and: [] };
    if (body.department) {
        filter.$and.push({
            department: body.department,
        });
    } else {
        filter.$and.push({
            department_scope: WORKFLOW_ORGANIZATION_SCOPE.ALL,
            department: { $eq: null },
        });
    }

    if (body.key) {
        filter.$and.push({ key: { $in: body.key } });
    }

    if (body.search && body.search !== "") {
        filter.$and.push({ $text: { $search: body.search } });
    }
    return filter;
}

function genFilter(body) {
    const filter = [];

    if (body.department) {
        filter.push({
            department: { $eq: body.department },
        });
    } else {
        filter.push({
            department_scope: { $eq: WORKFLOW_ORGANIZATION_SCOPE.ALL },
            department: { $eq: null },
        });
    }

    if (body.key) {
        filter.push({
            key: { $in: body.key },
        });
    }

    return {
        $and: filter,
    };
}

function count_init(body) {
    let count = 0;
    if (body.key && body.key.length>0) {
        count++;
    }
    if (body.search && body.search !== "") {
        count++;
    }
    return count;
}

function genFilter_init(body) {
    let count = count_init(body);
    if (count === 0) {
        return {};
    }
    if (count === 1) {
        if (body.key && body.key.length>0) {
            return { key: { $in: body.key } }
        }
        if (body.search && body.search !== "") {
            return {$text: { $search: body.search }};
        }
    }
    return {
        $and :[
            { key: { $in: body.key } },
            {$text: { $search: body.search }}
        ]
    };

}

const buildEntity = function (formData) {
    const fields = formData.Fields;
    const baseEntity = {
        title: utils.praseStringToObject(fields.title || {}),
        key: fields.key,
        flow: utils.praseStringToObject(fields.flow, []),
        department_scope: fields.department_scope || WORKFLOW_ORGANIZATION_SCOPE.ALL,
        department: fields.department_scope === WORKFLOW_ORGANIZATION_SCOPE.SPECIFIC ? fields.department : null,
        competence: utils.praseStringToObject(fields.competence, []),
        job: utils.praseStringToObject(fields.job, []),
        role: utils.praseStringToObject(fields.role, []),
        file_type: fields.file_type,
        templateFiles: utils.praseStringToObject(fields.templateFiles, []),
        templateTags: utils.praseStringToObject(fields.templateTags, []),
        allow_appendix: fields.allow_appendix === "true",
        allow_choose_destination: fields.allow_choose_destination === "true",
        is_personal: fields.is_personal === "true",
        is_department: fields.is_department === "true"
    };

    baseEntity.flow = baseEntity.flow.map((flowItem) => {
        if (["string", "number"].includes(typeof flowItem.duration)) {
            flowItem.duration = {
                amount: Number(flowItem.duration),
                unit: WORKFLOW_DURATION_UNIT.BUSINESS_DAY,
            };
            return flowItem;
        }
        return flowItem;
    });

    const uploadedFiles = fileUtils.getUploadedFilesWithSpecificKey({
        nameLib,
        formData,
        fieldKey: "file",
    });

    if (uploadedFiles.length > 0) {
        if (baseEntity.file_type === WORKFLOW_FILE_TYPE.CUSTOM_TEMPLATE) {
            baseEntity.templateFiles = [uploadedFiles[0]];
        } else {
            baseEntity.templateFiles = baseEntity.templateFiles.concat(uploadedFiles);
        }
    }

    return baseEntity;
};

const buildUpdateEntity = function (formData) {
    const baseEntity = buildEntity(formData);
    const fields = formData.Fields;
    return Object.assign(baseEntity, {
        id: fields.id,
    });
};

const genData = function (fields) {
    let result = {};
    result.title = JSON.parse(fields.title);
    result.key = fields.key;
    result.department = fields.department;
    result.competence = JSON.parse(fields.competence);
    result.job = JSON.parse(fields.job);
    result.role = JSON.parse(fields.role);
    result.flow = JSON.parse(fields.flow);
    result.customTemplateTags = utils.praseStringToObject(
        fields.customTemplateTags,
        []
    );
    return Object.assign(fields, result);
};

class WorkflowController {
    constructor() { }
    load_details(body) {
        return WorkflowService.load_details(body._service[0].dbname_prefix, body.id);
    }

    load(body) {
        return WorkflowService.load(body._service[0].dbname_prefix, genFilter(body));
    }

    load_follow_department(body) {
        return WorkflowService.load(body._service[0].dbname_prefix, genFilter_follow_department(body));
    }

    insert(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, undefined, undefined, parentFolder, "template")
            .then(function (formData) {
                const entity = buildEntity(formData);

                const { value: workflowEntity, error: validateError } = joi.validate(entity, validation.insertSchema());

                if (validateError) {
                    const errorDetails = validateError.details;
                    dfd.reject({
                        errorCode: "VALIDATION_ERROR",
                        mes: errorDetails.map(function (value) {
                            return {
                                path: value.path.join("."),
                                message: value.message,
                            };
                        }),
                    });
                    return;
                }

                const validateResult = workflowUtil.validateTagsInWorkflow(workflowEntity);
                if (validateResult.valid === false) {
                    return dfd.reject({
                        errorCode: "VALIDATION_ERROR",
                        mes: validateResult.message,
                    });
                }

                const compareResult = workflowUtil.validateTagsNodeWithTemplate(workflowEntity, validateResult.tags);
                if (compareResult.valid === false) {
                    dfd.reject({
                        errorCode: "VALIDATION_ERROR",
                        mes: compareResult.message,
                    });
                    return;
                }

                return WorkflowService.insert(
                    req.body._service[0].dbname_prefix,
                    req.body.username,
                    entity.title,
                    entity.key,
                    entity.flow,
                    entity.department,
                    entity.competence,
                    entity.job,
                    entity.role,
                    entity.file_type,
                    entity.templateFiles,
                    entity.templateTags,
                    entity.allow_appendix,
                    entity.allow_choose_destination,
                    entity.department_scope,
                    entity.is_personal,
                    entity.is_department
                );
            })
            .then(function (result) {
                dfd.resolve(true);
            })
            .catch(function (error) {
                LogProvider.error(`Can not insert workflow + ${error.mes || error.message}`);
                dfd.reject({
                    path: "WorkflowController.insert",
                    mes: "Unexpected error occur when inserting workflow",
                    err: error,
                });
            });
        return dfd.promise;
    }

    update(request) {
        const dfd = q.defer();
        let tracingPath = "WorkflowController.upload"

        FileProvider.upload(
            request,
            nameLib,
            undefined,
            undefined,
            parentFolder,
            'template'
        )
            .then(function (formData) {
                const entity = buildUpdateEntity(formData);

                const { value: workflowEntity, error: validateError } =
                    joi.validate(entity, validation.updateSchema());

                if (validateError) {
                    const errorDetails = validateError.details;
                    dfd.reject({
                        errorCode: 'VALIDATION_ERROR',
                        mes: errorDetails.map(function (value) {
                            return {
                                path: value.path.join('.'),
                                message: value.message,
                            };
                        }),
                    });
                    return;
                }

                const validateResult =
                    workflowUtil.validateTagsInWorkflow(workflowEntity);
                if (validateResult.valid === false) {
                    return dfd.reject({
                        errorCode: 'VALIDATION_ERROR',
                        mes: validateResult.message,
                    });
                }

                const compareResult = workflowUtil.validateTagsNodeWithTemplate(
                    workflowEntity,
                    validateResult.tags,
                );
                if (compareResult.valid === false) {
                    dfd.reject({
                        errorCode: 'VALIDATION_ERROR',
                        mes: compareResult.message,
                    });
                    return;
                }

                return WorkflowService.update(
                    request.body._service[0].dbname_prefix,
                    request.body.username,
                    entity.id,
                    entity.title,
                    entity.key,
                    entity.flow,
                    entity.department,
                    entity.competence,
                    entity.job,
                    entity.role,
                    entity.templateFiles,
                    entity.templateTags,
                    entity.file_type,
                    entity.allow_appendix,
                    entity.allow_choose_destination,
                    entity.department_scope,
                    entity.is_personal,
                    entity.is_department
                );
            })
            .then(function (result) {
                dfd.resolve(true);
            })
            .catch(function (error) {
                LogProvider.error(`Can not update workflow + ${error.mes || error.message}`);
                dfd.reject({
                    path: tracingPath,
                    mes: 'Unexpected error occur when updating workflow',
                    err: error,
                });
            });

        return dfd.promise;
    }

    delete(body) {
        return WorkflowService.delete(body._service[0].dbname_prefix, body.username, body.id);
    }

    loadfiletemplateinfo(body) {
        let dfd = q.defer();

        FileProvider.loadFile(body._service[0].dbname_prefix, body.session, 'template', body.name, undefined, undefined, ['office/workflow'], undefined).then(
            function (fileinfo) {
                fileinfo.display = body.name;
                dfd.resolve(fileinfo);
                fileinfo = undefined;
            },
            function (err) {
                dfd.reject(err);
                fileInfo = undefined;
                err = undefined;
            }
        )
        return dfd.promise;

    }

    downloadfile(body) {
        return FileProvider.download(body._service[0].dbname_prefix + '/office/workflow/template/' + body.filename);
    }

    templateParser(request) {
        let tracingPath = 'WorkflowController.upload';
        const dfd = q.defer();
        FileProvider.getAllFilesFromRequest(request)
            .then(function (files) {
                if (!Array.isArray(files) || files.length === 0) {
                    dfd.reject({
                        path: tracingPath,
                        mes: 'File is required',
                    });
                }
                tracingPath =
                    'WorkflowController.WorkflowService.templateParser';
                const result = WorkflowService.templateParser(files[0]);

                dfd.resolve(result);
            })
            .catch(function (error) {
                dfd.reject({
                    path: tracingPath,
                    err: error,
                    mes: error.mes || 'Unexpected error occur while processing file',
                });
            });
        return dfd.promise;
    }

    processPreviewTemplate(body) {
        return WorkflowService.processPreviewTemplate(body);
    }

}
exports.WorkflowController = new WorkflowController();
