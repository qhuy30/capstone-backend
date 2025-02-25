const q = require('q');
const path = require('path');
const PizZip = require('pizzip');
const DocxTemplater = require('docxtemplater');
const InspectModule = require('docxtemplater/js/inspect-module');
const mongodb = require('mongodb');

const BaseError = require('../../../shared/error/BaseError');

const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const { LogProvider } = require('../../../shared/log_nohierarchy/log.provider');
const { removeUnicode } = require('../../../utils/util');
const { FileProvider } = require('../../../shared/file/file.provider');
const DocumentTemplate = require('../../../shared/docxtemplater/DocumentTemplate');
const settings = require('../../../utils/setting');
const templateUtil = require('../../../utils/templateUtil');

const { CUSTOM_TEMPLATE_TAG_TYPE, WORKFLOW_FILE_TYPE } = require('../../../utils/constant');

const mergeWorkflow = function (current, incoming) {
    const mergedObject = {
        title: incoming.title || current.title,
        key: incoming.key || current.key,
        flow: incoming.flow || current.flow,
        department: incoming.department || current.department,
        competence: incoming.competence || current.competence,
        job: incoming.job || current.job,
        role: incoming.role || current.role,
        file_type: incoming.file_type || current.file_type,
        templateTags: incoming.templateTags || [],
        allow_appendix: incoming.allow_appendix,
        allow_choose_destination: incoming.allow_choose_destination,
        department_scope: incoming.department_scope,
        is_personal: incoming.is_personal || current.is_personal,
        is_department: incoming.is_department || current.is_department
    };

    let templateFiles = [];

    templateFiles = incoming.templateFiles.reduce((fileList, file) => {
        if (file.timePath) {
            fileList.push(file);
        }
        const keptFile = current.templateFiles.find(
            (curr) => curr.name === file.name,
        );
        if (keptFile) {
            fileList.push(keptFile);
        }
        return fileList;
    }, []);

    return Object.assign(mergedObject, {
        templateFiles,
    });
};

const processTemplateTag = function (dbname_prefix, templateTags, tagsValue) {
    const dfd = q.defer();
    let filter = { $or: [] };
    templateTags.forEach((tag) => {
        if (tag.type === "signature") {
            filter.$or.push({
                department: tag.department,
                competence: tag.competence,
            });
        }
    });
    MongoDBProvider.load_onOffice(dbname_prefix, 'employee', filter)
        .then(function (employees) {
            const tags = templateTags.reduce((prev, tag) => {
                if (tag.type !== 'signature') {
                    tag.value = tagsValue[tag.name] || null;
                    prev.push(tag);
                    return prev;
                }
                const targetEmployee = employees.find(
                    (em) =>
                        tag.department === em.department &&
                        tag.competence === em.competence &&
                        !!em.signature
                );

                tag.link = !targetEmployee ? null : getSignaturePath(dbname_prefix, targetEmployee);
                prev.push(tag);
                return prev;
            }, []);
            dfd.resolve(tags);
        })
        .catch(function (error) {
            dfd.reject(error);
        });
    return dfd.promise;
};

const getSignaturePath = function(dbname_prefix, employee) {
    let imagePath = settings.adminDomain + '/datasources/images/default/no_sign.png';
    if (!employee.signature) {
        return imagePath;
    }

    let idCard = employee.idcard || 'undefined';
    const folderName = removeUnicode(employee.fullname.toLowerCase())
        .replace(/ /g, '_') + '_' + idCard;

    return path.join(dbname_prefix, '/office/human/employee/signature', folderName, employee.signature.name);
};

class WorkflowService {
    constructor() {}

    load_details(dbname_prefix, id) {
        return MongoDBProvider.getOne_onOffice(dbname_prefix, "workflow", {
            _id: { $eq: new require("mongodb").ObjectID(id) },
        });
    }

    load(dbname_prefix, filter) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "workflow", filter);
    }

    insert(
        dbname_prefix,
        username,
        title,
        key,
        flow,
        department,
        competence,
        job,
        role,
        file_type,
        templateFiles,
        templateTags,
        allow_appendix,
        allow_choose_destination,
        department_scope,
        is_personal,
        is_department
    ) {
        return MongoDBProvider.insert_onOffice(dbname_prefix, "workflow", username, {
            title,
            title_search: removeUnicode(title["en-US"]),
            key,
            flow,
            department,
            competence,
            job,
            role,
            file_type,
            templateFiles,
            templateTags,
            allow_appendix,
            allow_choose_destination,
            department_scope,
            is_personal,
            is_department
        });
    }

    update(
        dbname_prefix,
        username,
        id,
        title,
        key,
        flow,
        department,
        competence,
        job,
        role,
        templateFiles,
        templateTags,
        file_type,
        allow_appendix,
        allow_choose_destination,
        department_scope,
        is_personal,
        is_department
    ) {
        const dfd = q.defer();
        MongoDBProvider.getOne_onOffice(dbname_prefix, "workflow", {
            _id: { $eq: new require("mongodb").ObjectID(id) },
        })
            .then(function (currentWorkflow) {
                const incomingWorkflow = {
                    id,
                    title,
                    key,
                    flow,
                    department,
                    competence,
                    job,
                    role,
                    templateFiles,
                    templateTags,
                    file_type,
                    allow_appendix,
                    allow_choose_destination,
                    department_scope,
                    is_personal,
                    is_department
                };

                const mergedWorkflow = mergeWorkflow(currentWorkflow, incomingWorkflow);

                return MongoDBProvider.update_onOffice(
                    dbname_prefix,
                    "workflow",
                    username,
                    { _id: { $eq: new require("mongodb").ObjectID(id) } },
                    {
                        $set: {
                            title: mergedWorkflow.title,
                            key: mergedWorkflow.key,
                            flow: mergedWorkflow.flow,
                            department: mergedWorkflow.department,
                            competence: mergedWorkflow.competence,
                            job: mergedWorkflow.job,
                            role: mergedWorkflow.role,
                            title_search: removeUnicode(mergedWorkflow.title["en-US"]),
                            templateFiles: mergedWorkflow.templateFiles,
                            templateTags: mergedWorkflow.templateTags,
                            allow_appendix: mergedWorkflow.allow_appendix,
                            allow_choose_destination: mergedWorkflow.allow_choose_destination,
                            department_scope: mergedWorkflow.department_scope,
                            is_personal: mergedWorkflow.is_personal,
                            is_department: mergedWorkflow.is_department
                        },
                    },
                );
            })
            .then(function (data) {
                dfd.resolve({
                    success: true,
                });
            })
            .catch(function (error) {
                LogProvider.error(
                    "Can not update workflow with reason: " + error.mes || error.message,
                    "WorkflowService.update.err",
                );
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError("WorkflowService.update.err", "Unexpected error occur when updating workflow"),
                );
            });
        return dfd.promise;
    }

    delete(dbname_prefix, username, id) {
        return MongoDBProvider.delete_onOffice(dbname_prefix, "workflow", username, {
            _id: { $eq: new require("mongodb").ObjectID(id) },
        });
    }

    templateParser(file) {
        try {
            const zip = new PizZip(file.buffer);
            const inspectModule = InspectModule();
            const docx = new DocxTemplater(zip, {
                modules: [inspectModule],
                paragraphLoop: true,
                errorLogging: false,
            });
            const tags = inspectModule.getAllTags();
            return {
                tags: Object.keys(tags).map(function (key) {
                    return {
                        name: key,
                    };
                }),
            };
        } catch (error) {
            let errorMessages;
            if (error.properties && error.properties.errors instanceof Array) {
                errorMessages = error.properties.errors.map(function (error) {
                    return error.properties.explanation;
                });
            }
            const err = new Error(error.message);
            err.path = "WorkflowService.templateParser";
            err.mes = errorMessages;
            throw err;
        }
    }

    processPreviewTemplate(body) {
        const dfd = q.defer();
        const dbname_prefix = body._service[0].dbname_prefix;
        const currentUser = body.session;
        const workflowId = body.workflowId;
        let fileName = '';
        let documentTemplate;

        MongoDBProvider.getOne_onOffice(dbname_prefix, "workflow", {
            _id: { $eq: new mongodb.ObjectId(workflowId) },
        })
            .then(function (workflow) {
                if (workflow.file_type === WORKFLOW_FILE_TYPE.FILE_UPLOAD) {
                    return dfd.reject({
                        path: "WorkflowService.processPreviewTemplate",
                        mes: "NotSupportTypeFileUpload",
                    });
                }

                if (!workflow.templateFiles || workflow.templateFiles.length === 0) {
                    return dfd.reject({
                        path: "WorkflowService.processPreviewTemplate",
                        mes: "NotFoundTemplateFile",
                    });
                }

                const fileNeedToProcess = workflow.templateFiles[0];
                const filePath = `${fileNeedToProcess.folder}/${fileNeedToProcess.name}`;

                return q.all([
                    FileProvider.downloadBuffer(filePath),
                    templateUtil.resolveTemplateTag(
                        dbname_prefix,
                        workflow.templateTags,
                        body.tagsValue,
                        currentUser.employee_details,
                        {
                            skipQuotationMark: true,
                            skipSignature: true,
                            currentLanguage: body.session.language.current,
                            username: currentUser.username
                        },
                    ),
                    workflow,
                ]);
            })
            .then(function ([fileBuffer, tags, workflowDetail]) {
                documentTemplate = new DocumentTemplate(fileBuffer, {
                    dbname_prefix,
                });
                documentTemplate.processTagsValue(tags);
                const buffer = documentTemplate.getAsBuffer();
                return FileProvider.uploadByBuffer(
                    dbname_prefix,
                    buffer,
                    "workflow",
                    "",
                    `tmp_${new Date().getTime()}.docx`,
                    "custom-template",
                    "temp",
                );
            })
            .then(function (fileInfo) {
                fileName = fileInfo.named;
                const filePath = `${dbname_prefix}/temp/custom-template/workflow/${fileName}`;
                return FileProvider.makeFilePublic(filePath);
            })
            .then((data) => {
                dfd.resolve({
                    url: data,
                    display: fileName,
                });
            })
            .catch(function (error) {
                dfd.reject({
                    path: "WorkflowService.processPreviewTemplate",
                    mes: "Unexpected error occur when processing template",
                    err: error,
                });
            });
        return dfd.promise;
    }
}


exports.WorkflowService = new WorkflowService();
