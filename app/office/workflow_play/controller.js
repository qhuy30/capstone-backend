const path = require('path');
const ImageModule = require("docxtemplater-image-module-free");
const PizZip = require('pizzip');
const fs = require('fs');
const q = require('q');
const Docxtemplater = require('docxtemplater');
const sizeOf = require('buffer-image-size');

const BaseError = require("@shared/error/BaseError");

const { getCurrentDate, praseStringToObject, getValidValue, getDbNamePrefix, generateParent, genFilterRuleUser, genFilterGetUsersByRule, genFilterGetUsersByRuleAndDepartment } = require("../../../utils/util");
const templateUtil = require("../../../utils/templateUtil");
const workflowUtil = require("../../../utils/workflowUtil");
const workflowPlayUtil = require("../../../utils/workflowPlayUtil");
const fileUtil = require("../../../utils/fileUtil");
const ReferenceUtil = require("@utils/referenceUtil");
const DocumentTemplate = require("../../../shared/docxtemplater/DocumentTemplate");
const { FileProvider } = require("../../../shared/file/file.provider");
const { HTTPRequestProvider } = require("../../../shared/httpRequest/http.provider");
const { ODBController } = require('../outgoing_dispatch/controller');

const { ODBService: OutGoingDispatchService } = require("@app/office/outgoing_dispatch/service");
const { WorkflowPlayService, TaskWorkFlowPlayService, UserService } = require('./service');
const { TaskService } = require('../task/service');
const { RingBellItemService } = require('../../management/ringbell_item/service');
const { BriefCaseService } = require('../briefcase/service');
const { EmployeeService } = require('../human/employee/service');
const { LogProvider } = require('../../../shared/log_nohierarchy/log.provider');

const { CUSTOM_TEMPLATE_TAG_TYPE, WORKFLOW_FILE_TYPE, WORKFLOW_PLAY_STATUS, OBD_STATUS } = require("@utils/constant");
const { NAME_LIB, WORKFLOW_PLAY_RULE, ARCHIVE_RULE } = require("@app/office/workflow_play/const");

const { validation } = require("./validation");
const WorkflowPlayFilter = require("./filter");
const { OBJECT_NAME } = require("@utils/referenceConstant");
const { resolveParents } = require("@utils/referenceUtil");

const nameLib = "workflow_play";
const fieldSearchAr = ["search", "status", "document_type", "statuses", "checks"];
const parentFolder = "office";
const folderArray = ["office"];
const { BuildFilterAggregate } = require('./utility');
const { v4: uuidv4 } = require('uuid');
const  {WorkflowService}  = require('../workflow/service');


function doCount(aggregationSteps = []) {
    aggregationSteps.push({
        $count: "count",
    });
}

function verify_ReturnCreatorAdditionalDocument(body, id){
    let dfd = q.defer();
    WorkflowPlayService.loadDetails(body._service[0].dbname_prefix, body.username, id).then(function(wf){
        dfd.resolve(wf);
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

const genFilter = function (body) {
    const rule = body.session && body.session.rule;
    const department = body.session && body.session.department;

    const ruleConditions = []
    let ruleManage_leader_department = rule.filter((e) => e.rule === WORKFLOW_PLAY_RULE.DEPARTMENT_LEADER_MANAGE)[0];
    if (ruleManage_leader_department && ruleManage_leader_department.details) {
        switch (ruleManage_leader_department.details.type) {
            case "All":
                ruleConditions.push({
                    "flow_info.title.en-US": "Transfer Ticket",
                    status: { $in: [WORKFLOW_PLAY_STATUS.PENDING] },
                });
                break;
            case "Specific":
                ruleConditions.push({
                    $and: [
                        { "flow_info.title.en-US": "Transfer Ticket" },
                        {
                            status: { $in: [WORKFLOW_PLAY_STATUS.PENDING] },
                        },
                        {
                            $or: [
                                {to_department: { $in: ruleManage_leader.details.department } , node: { $ne: 1 } },
                                {department: { $in: ruleManage_leader.details.department }, node: 1 },
                            ],
                        },
                    ],
                });
                break;
            case "Working":
                ruleConditions.push({
                    $and: [
                        { "flow_info.title.en-US": "Transfer Ticket" },
                        {
                            status: { $in: [WORKFLOW_PLAY_STATUS.PENDING] },
                        },
                        {
                            $or: [
                                { to_department: department, node: { $ne: 1 } },
                                { department: department, node: 1 },
                            ],
                        },
                    ],
                });
                break;
        }
    }

    let ruleManage_leader = rule.filter((e) => e.rule === WORKFLOW_PLAY_RULE.LEADER_MANAGE)[0];
    if (ruleManage_leader && ruleManage_leader.details) {
        switch (ruleManage_leader.details.type) {
            case "All":
                ruleConditions.push({
                    "flow_info.title.en-US": "Transfer Ticket",
                    status: { $in: [WORKFLOW_PLAY_STATUS.PENDING] },
                });
                break;
            case "Specific":
                ruleConditions.push({
                    $and: [
                        { "flow_info.title.en-US": "Transfer Ticket" },
                        {
                            status: { $in: [WORKFLOW_PLAY_STATUS.PENDING] },
                        },

                        {
                            $or: [
                                {to_department: { $in: ruleManage_leader.details.department } , node: { $ne: 1 } },
                                {department: { $in: ruleManage_leader.details.department }, node: 1 },
                            ],
                        },
                    ],
                });
                break;
            case "Working":
                ruleConditions.push({
                    $and: [
                        { "flow_info.title.en-US": "Transfer Ticket" },
                        {
                            status: { $in: [WORKFLOW_PLAY_STATUS.PENDING] },
                        },
                        {
                            $or: [
                                { to_department: department, node: { $ne: 1 } },
                                { department: department, node: 1 },
                            ],
                        },
                    ],
                });
                break;
        }
    }

    const conditionsMap = {
        Created: { username: { $eq: body.username } },
        Approved: {
            $or: [
                {
                    username: { $eq: body.username },
                    status: { $in: ['Approved', 'SaveODB'] },
                },
                {
                    event: {
                        $elemMatch: {
                            username: body.username,
                            action: { $in: ['Approved', 'SaveODB'] },
                        },
                    },
                },
            ],
        },
        Returned: {
            event: {
                $elemMatch: {
                    username: body.username,
                    action: 'Returned',
                },
            },
        },
        Rejected: {
            event: {
                $elemMatch: {
                    username: body.username,
                    action: 'Rejected',
                },
            },
        },
        NeedToHandle: {
            $and: ruleConditions
        },
    };

    const filter = [];
    const tabConditions = [];


    if (body.search) {
        filter.push({
            $match:
            {
                $text: {
                    $search: `"${body.search}"`,
                },
            }
            ,
        });
    }

    const selectedChecks = body.checks || [];
    selectedChecks.forEach(check => {
        const condition = conditionsMap[check];
        if (condition) {
            tabConditions.push(condition);
        }
    });

    if (tabConditions.length > 0) {
        filter.push({ $match: { $or: tabConditions } });
    }

    if (body.is_personal) {
        filter.push({ is_personal: true });
    }

    if (body.is_department) {
        filter.push({ is_department: true });
    }


    if (body.statuses && body.statuses.length) {
        filter.push({
            status: { $in: body.statuses }
        });
    }

    return filter;
}


function checkDocxContent(filename, username) {
    let dfd = q.defer();
    FileProvider.downloadBuffer(filename).then(function (data) {
        const stringsToCheck = [`{%sign_${username}}`, `{%quatationmark_${username}}`];
        // const stringsToCheck = [`Win/`];
        const zip = new PizZip(data);
        const doc = new Docxtemplater();
        doc.loadZip(zip);
        const isAnyStringIncluded = stringsToCheck.some(string => doc.getFullText().includes(string));
        dfd.resolve({ check: isAnyStringIncluded, zip });
    }, function (err) {
        console.log(err);
        dfd.reject(err);
    });
    return dfd.promise;
}

function bindSignatureToFile(zip, username, dbname_prefix, userId, data, filename) {
    let dfd = q.defer();
    try {
        // Load image from gcp of user signing
        EmployeeService.loadDetails(dbname_prefix, userId).then(
            (empl) => {
                // Image signature of user signing
                const imageFilePath = empl.signature.link;
                // Default data need to sign
                let stringsToCheck = [`sign_${username}`, `quotationmark_${username}`];
                let objSetData = {};
                // Default value of format and image need to sign
                let arrSign = [
                    { name: `sign_${username}`, src: imageFilePath },
                    { name: `quotationmark_${username}`, src: imageFilePath },
                ];

                if (data.attachment.length > 0) {
                    let fileAttach = data.attachment.find((f) => f.name === filename) || undefined;
                    if (fileAttach.sign && fileAttach.sign.length > 0) {
                        // Add value for user has signed
                        for (let i in fileAttach.sign) {
                            stringsToCheck.push(
                                `sign_${fileAttach.sign[i].username}`,
                            );
                            stringsToCheck.push(
                                `quotationmark_${fileAttach.sign[i].username}`,
                            );
                            arrSign.push({
                                name: `sign_${fileAttach.sign[i].username}`,
                                src: fileAttach.sign[i].signPath,
                            });
                            arrSign.push({
                                name: `quotationmark_${fileAttach.sign[i].username}`,
                                src: fileAttach.sign[i].signPath,
                            });
                        }
                    }
                }

                for (let i in stringsToCheck) {
                    objSetData[stringsToCheck[i]] = stringsToCheck[i];
                }

                let dfdArr = [];
                // Create new array to set image after download
                let dataResponse = [];
                for (let j in arrSign) {
                    // With user signing we only need get because have url from gcp we get above
                    if (arrSign[j].name.includes(username)) {
                        dfdArr.push(
                            HTTPRequestProvider.get(arrSign[j].src, { responseType: 'arraybuffer' }).then((data) => {
                                dataResponse.push({ name: arrSign[j].name, buffer: data.data });
                            })
                        );
                    } else {
                        // With user signed, we need get gcp url from path and get image to handle
                        const downloadPromise = FileProvider.download(arrSign[j].src);
                        const promise = downloadPromise.then((src) => {
                            const responsePromise = HTTPRequestProvider.get(src, { responseType: 'arraybuffer' });
                            return responsePromise.then((response) => {
                                dataResponse.push({ name: arrSign[j].name, buffer: response.data });
                            });
                        });
                        dfdArr.push(promise);
                    }
                }

                q.all(dfdArr).then(
                    (response) => {
                        var opts = {};
                        opts.centered = false; //Set to true to always center images
                        opts.fileType = 'docx'; //Or pptx
                        // Get image for each format sign
                        opts.getImage = function (tagValue, tagName) {
                            const image = dataResponse.find((i) => i.name === tagName);
                            return image.buffer;
                        };
                        // Get size imge for each format sign
                        opts.getSize = function (tagValue, tagName) {
                            const image = dataResponse.find((i) => i.name === tagName);
                            const dimensions = sizeOf(image.buffer);
                            let width = dimensions.width;
                            let height = dimensions.height >= 120 ? 120 : dimensions.height;
                            if (dimensions.height >= 120) {
                                width = Math.floor((height * dimensions.width) / dimensions.height);
                            }
                            return [width, height];
                        };

                        var imageModule = new ImageModule(opts);
                        var doc = new Docxtemplater()
                            .attachModule(imageModule)
                            .loadZip(zip)
                            .setData(objSetData)
                            .render();

                        var buffer = doc.getZip().generate({ type: 'nodebuffer' });
                        dfd.resolve({ buffer, imageFilePath: empl.signature.filePath });
                        empl = undefined;
                        response = undefined;
                    },
                    (e) => {
                        dfd.reject({ path: 'WorkflowPlayController.bindSignatureToFile.err', e });
                        console.log(e);
                        empl = undefined;
                        e = undefined;
                    }
                );
            },
            (err) => {
                dfd.reject({ path: 'WorkflowPlayController.bindSignatureToFile.err', err });
                console.log(err);
                err = undefined;
            }
        );
    } catch (error) {
        dfd.reject({ path: 'WorkflowPlayController.bindSignatureToFile.err', error });
        console.log(error);
        error = undefined;
    }

    return dfd.promise;
}

function validateForSign(dbname, username, id, filename) {
    let dfd = q.defer();
    WorkflowPlayService.loadDetails(dbname, username, id).then(function (data) {
        try {

            let notSigned = true;
            let fileExist = false;
            let originalFileDisplay;
            for (let i in data.attachment) {
                if (data.attachment[i].name === filename) {
                    fileExist = true;
                    originalFileDisplay = data.attachment[i].display;
                    for (let j in data.attachment[i].sign) {
                        if (data.attachment[i].sign[j].username === username) {
                            notSigned = false;
                            break;
                        }
                    }
                    break;
                }
            }

            if (notSigned && fileExist) {
                let fileOrigin = data.originAttachment.find(file => file.display === originalFileDisplay);
                let fileNameOrigin = fileOrigin.name || filename;
                const fullPath = dbname + "/" + folderArray.join('/') + '/' + nameLib + '/' + data.username + '/' + fileNameOrigin;

                checkDocxContent(fullPath, username).then(function (checkValue) {

                    if (checkValue.check) {
                        dfd.resolve({ data, zip: checkValue.zip, originalFileDisplay });
                    } else {
                        dfd.reject({ path: "WorkflowPlayController.validateForSign.FileNotIncludeSignPosition", mes: "FileNotIncludeSignPosition" });
                    }
                }, function (err) {
                    dfd.reject(err);
                });
            } else {
                if (!notSigned) {
                    dfd.reject({
                        path: 'WorkflowPlayController.validateForSign.TheUserisAdreadySigned',
                        mes: 'TheUserisAdreadySigned',
                    });
                }
                if (!fileExist) {
                    dfd.reject({
                        path: 'WorkflowPlayController.validateForSign.TheUserisAdreadySigned',
                        mes: 'TheUserisAdreadySigned',
                    });
                }
                if (!notSigned && !fileExist) {
                    dfd.reject({
                        path: 'WorkflowPlayController.validateForSign.DataIsNotValid',
                        mes: 'DataIsNotValid',
                    });
                }
            }
        } catch (error) {
            console.log(error);
        }

    }, function (err) {
        dfd.reject(err);
    });
    return dfd.promise;
}

function generateBaseEntity(formData, username) {
    const d = new Date();
    const fields = formData.Fields;

    let entity = {
        id: fields.id,
        title: fields.title,
        flow_info: praseStringToObject(fields.flow_info, {}),
        flow: praseStringToObject(fields.flow, []),
        document_type: fields.document_type,
        tags_value: praseStringToObject(fields.tags_value, {}),
        event: [{ username, action: 'Created', time: d.getTime() }],
        attachment: [],
        originAttachment: [],
        relatedfile: [],
        created_at: new Date().getTime(),
        archived_documents: praseStringToObject(fields.archived_documents, []),
        department_destination: praseStringToObject(fields.department_destination, []),
        is_personal: fields.is_personal,
        is_department: fields.is_department,
        transfer_ticket: praseStringToObject(fields.transfer_ticket, null),
    };

    entity.attachment = fileUtil.getUploadedFilesWithSpecificKey({
        nameLib,
        formData,
        fieldKey: 'file',
    });

    entity.relatedfile = fileUtil.getUploadedFilesWithSpecificKey({
        nameLib,
        formData,
        fieldKey: 'relatedfile',
    });

    entity.appendix = fileUtil.getUploadedFilesWithSpecificKey({
        nameLib,
        formData,
        fieldKey: 'appendix',
    });
    entity.parent = fields.parent ? JSON.parse(fields.parent) : {};
    entity.parents = generateParent(fields.parents ? JSON.parse(fields.parents) : [], entity.parent);
    return entity;
}

function generateBaseEntity_transfer_ticket(formData, username) {
    const d = new Date();
    const fields = formData.Fields;

    let entity = {
        id: fields.id,
        title: fields.title,
        flow_info: praseStringToObject(fields.flow_info, {}),
        flow: praseStringToObject(fields.flow, []),
        document_type: fields.document_type,
        tags_value: praseStringToObject(fields.tags_value, {}),
        event: [{ username, action: 'Created', time: d.getTime() }],
        attachment: [],
        originAttachment: [],
        relatedfile: [],
        created_at: new Date().getTime(),
        archived_documents: praseStringToObject(fields.archived_documents, []),
        user_and_department_destination: praseStringToObject(fields.user_and_department_destination, {}),
        is_personal: fields.is_personal,
        is_department: fields.is_department,
        transfer_ticket: praseStringToObject(fields.transfer_ticket, null),
    };

    entity.attachment = fileUtil.getUploadedFilesWithSpecificKey({
        nameLib,
        formData,
        fieldKey: 'file',
    });

    entity.relatedfile = fileUtil.getUploadedFilesWithSpecificKey({
        nameLib,
        formData,
        fieldKey: 'relatedfile',
    });

    entity.appendix = fileUtil.getUploadedFilesWithSpecificKey({
        nameLib,
        formData,
        fieldKey: 'appendix',
    });
    entity.parent = fields.parent ? JSON.parse(fields.parent) : {};
    entity.parents = generateParent(fields.parents ? JSON.parse(fields.parents) : [], entity.parent);
    return entity;
}

function generateResubmitEntity(formData, username) {
    const fields = formData.Fields;
    let entity = {
        id: fields.id,
        title: fields.title,
        tags_value: praseStringToObject(fields.tags_value, {}),
        comment: fields.comment,
        preserve_relatedfile: praseStringToObject(fields.preserve_relatedfile, []),
        preserve_appendix: praseStringToObject(fields.preserve_appendix, []),
        is_personal: fields.is_personal,
        is_department: fields.is_department,
    };
    entity.attachment = fileUtil.getUploadedFilesWithSpecificKey({
        nameLib,
        formData,
        fieldKey: 'file',
    });
    entity.relatedfile = fileUtil.getUploadedFilesWithSpecificKey({
        nameLib,
        formData,
        fieldKey: 'relatedfile',
    });
    entity.appendix = fileUtil.getUploadedFilesWithSpecificKey({
        nameLib,
        formData,
        fieldKey: 'appendix',
    });
    return entity;
}

function generateApprovalEntity(formData, username) {
    const fields = formData.Fields;
    return {
        id: getValidValue(fields.id),
        comment: getValidValue(fields.comment),
        note: getValidValue(fields.note),
        relatedfile: fileUtil.getUploadedFilesWithSpecificKey({
            nameLib,
            formData,
            fieldKey: 'relatedfile',
        }),
    };
}

function generateRejectEntity(formData, username) {
    const fields = formData.Fields;
    return {
        id: getValidValue(fields.id),
        comment: getValidValue(fields.comment),
        notes: getValidValue(fields.note),
        relatedfile: fileUtil.getUploadedFilesWithSpecificKey({
            nameLib,
            formData,
            fieldKey: 'relatedfile',
        }),
    };
}

function generateReturnEntity(formData, username) {
    const fields = formData.Fields;
    return {
        id: getValidValue(fields.id),
        comment: getValidValue(fields.comment),
        notes: getValidValue(fields.note),
        relatedfile: fileUtil.getUploadedFilesWithSpecificKey({
            nameLib,
            formData,
            fieldKey: 'relatedfile',
        }),
    };
}

function processTemplateFile(dbPrefix, workflow, tagValue, creator) {
    const dfd = q.defer();
    let templateDocument;
    let templateFile;
    const username = creator.username;
    const creatorDetail = creator.employee_details;

    q.fcall(() => {
        if (
            !Array.isArray(workflow.templateFiles) ||
            workflow.templateFiles.length === 0
        ) {
            return dfd.reject({
                path: 'WorkflowPlayController.processWorkflowPlayTemplate.err',
                mes: 'NotFoundAutoGenerateTemplate',
            });
        }

        templateFile = workflow.templateFiles[0];
        const templatePath = `${templateFile.folder}/${templateFile.name}`;
        const filteredTags = workflowUtil.getTemplateTagFromWorkflow(workflow, {
            excludeTagTypes: [
                CUSTOM_TEMPLATE_TAG_TYPE.SIGNATURE,
                CUSTOM_TEMPLATE_TAG_TYPE.QUOTATION_MARK,
            ],
        });

        return q.all([
            templateUtil.resolveTemplateTag(
                dbPrefix,
                filteredTags,
                tagValue,
                creatorDetail,
            ),
            FileProvider.downloadBuffer(templatePath),
        ]);
    })
        .then(([documentTags, buffer]) => {
            templateDocument = new DocumentTemplate(buffer);
            templateDocument.processTagsValue(documentTags);
            const bufferResult = templateDocument.getAsBuffer();
            const fileName = templateFile.display;
            return FileProvider.uploadByBuffer(
                dbPrefix,
                bufferResult,
                nameLib,
                username,
                fileName,
                undefined,
                parentFolder,
            );
        })
        .then((fileInfo) => {
            const storageFolder = path.join(
                dbPrefix,
                parentFolder,
                nameLib,
                username,
            );

            const attachment = {
                nameLib: fileInfo.nameLib,
                display: fileInfo.filename,
                name: fileInfo.named,
                type: fileInfo.type,
                folder: storageFolder,
                sign: [],
            }

            dfd.resolve({
                attachment,
                templateFile
            });
        })
        .catch((err) => {
            dfd.reject(err);
        });
    return dfd.promise;
}

function processUploadedFiles(dbPrefix, workflow, creator, attachments) {
    const dfd = q.defer()
    const creatorDetail = creator.employee_details
    const creatorSignTags = workflowUtil.getTemplateTagFromWorkflow(workflow, {
        includeTagTypes: [
            CUSTOM_TEMPLATE_TAG_TYPE.CREATOR_SIGNATURE,
            CUSTOM_TEMPLATE_TAG_TYPE.CREATOR_QUOTATION_MARK,
        ],
    })
    q.fcall(function () {
        if (creatorSignTags.length === 0) {
            return dfd.resolve(attachments)
        }
        return templateUtil.resolveTemplateTag(dbPrefix, creatorSignTags, {}, creatorDetail)
    })
        .then((processedTags) => {
            const promises = attachments.map((attachment) => {
                return processDocumentTags(dbPrefix, creator.username, attachment, processedTags)
            })
            return q.all(promises)
        })
        .then(function (processedDocuments) {
            dfd.resolve(processedDocuments)
        })
        .catch(function (error) {
            dfd.reject({
                path: 'WorkflowPlayController.processUploadedFiles.err',
                mes: 'ProcessUploadedFilesError',
            })
        })
    return dfd.promise
}

function processDocumentTags(dbPrefix, username, attachment, processedTags) {
    const dfd = q.defer();
    const filePath = `${attachment.folder}/${attachment.name}`;
    FileProvider.downloadBuffer(filePath)
        .then((buffer) => {
            const templateDocument = new DocumentTemplate(buffer)
            templateDocument.processTagsValue(processedTags)
            return FileProvider.uploadByBuffer(
                dbPrefix,
                templateDocument.getAsBuffer(),
                nameLib,
                username,
                attachment.display,
                undefined,
                parentFolder,
            )
        })
        .then((fileInfo) => {
            const storageFolder = path.join(
                dbPrefix,
                parentFolder,
                nameLib,
                username,
            )
            const file = {
                nameLib: fileInfo.nameLib,
                display: fileInfo.filename,
                name: fileInfo.named,
                type: fileInfo.type,
                folder: storageFolder,
                sign: [],
            }
            dfd.resolve(file)
        })
        .catch((err) => {
            dfd.reject(err)
        })
    return dfd.promise;
}


function validateTagsInAttachment(attachment, signatureTags) {
    const dfd = q.defer();
    const filePath = `${attachment.folder}/${attachment.name}`;
    FileProvider.downloadBuffer(filePath)
        .then((buffer) => {
            const base64 = buffer.toString('base64');
            const tagInTemplate = templateUtil.getTagsInTemplate(base64);
            const tags = signatureTags.filter((tag) => {
                return !tagInTemplate.tags.some((ele) => tag.name === ele.name);
            });
            dfd.resolve({
                name: attachment.name,
                valid: tags.length === 0,
                missingTags: tags,
            });
        })
        .catch(function (err) {
            LogProvider.error(
                `Validate tag in attachment error with reason: ${err.mes || err.message
                }`,
            );
            dfd.resolve({
                valid: false,
                message: err.mes || 'ValidateTagInAttachmentError'
            });
        });
    return dfd.promise;
}

function validateTagsInAttachments(attachments, workflowDetail) {
    const dfd = q.defer();
    const tagNeedToValidate = workflowUtil.getTemplateTagFromWorkflow(
        workflowDetail,
        {
            includeTagTypes: [
                CUSTOM_TEMPLATE_TAG_TYPE.SIGNATURE,
                CUSTOM_TEMPLATE_TAG_TYPE.CREATOR_SIGNATURE,
                CUSTOM_TEMPLATE_TAG_TYPE.QUOTATION_MARK,
                CUSTOM_TEMPLATE_TAG_TYPE.CREATOR_QUOTATION_MARK,
            ],
        },
    );
    q.fcall(function () {
        if (tagNeedToValidate.length === 0) {
            return dfd.resolve(null);
        }
        let promises = attachments.map((attachment) => {
            return validateTagsInAttachment(attachment, tagNeedToValidate);
        });
        return q.all(promises);
    })
        .then((results) => {
            for (const result of results) {
                if (result.valid === false) {
                    return dfd.reject({
                        path: 'WorkflowPlayController.validateUserFileTags.err',
                        mes: 'MissingTagInAttachment',
                    });
                }
            }
            return dfd.resolve(null);
        })
        .catch((err) => {
            dfd.reject({
                path: 'WorkflowPlayController.validateUserFileTags.err',
                mes: 'ValidateUserFileTagsError',
            });
        });

    return dfd.promise;
}

function mergeRelatedFiles(
    currentRelatedFiles = [],
    newRelatedFiles,
    preserveRelatedFiles
) {
    let mergedRelatedFile = [];
    mergedRelatedFile = mergedRelatedFile.concat(newRelatedFiles);
    for (const relatedFile of currentRelatedFiles) {
        const isKeep = preserveRelatedFiles.some((file) => {
            return file.name === relatedFile.name;
        });
        if (isKeep) {
            mergedRelatedFile.push(relatedFile);
        }
    }
    return mergedRelatedFile;
}

function mergeAppendixFiles(currentAppendixFiles = [], incomingAppendixFiles, preserveAppendixFiles) {
    let mergeAppendixFiles = [];
    mergeAppendixFiles = mergeAppendixFiles.concat(incomingAppendixFiles);
    for (const currentAppendixFile of currentAppendixFiles) {
        const isKeep = preserveAppendixFiles.some((file) => {
            return file.name === currentAppendixFile.name;
        });
        if (isKeep) {
            mergeAppendixFiles.push(currentAppendixFile);
        }
    }
    return mergeAppendixFiles;
}

function loadExploitedOutgoingDispatch(dbname_prefix, username, workflowPlay, id) {
    const dfd = q.defer();
    ODBController.loadDetail(dbname_prefix, { username, id })
        .then((odb) => {
            Object.assign(workflowPlay, {
                exploitedDocument: odb,
            });
            dfd.resolve(true);
        })
        .catch(err => dfd.reject(err));
    return dfd.promise;
}

function buildOutgoingDispatchDTOFromRequest(formData) {
    const fields = formData.Fields;
    const dto = {
        outgoing_dispatch_id: getValidValue(fields.outgoing_dispatch_id),
        outgoing_dispatch_book: getValidValue(fields.outgoing_dispatch_book),
        workflow_play_id: getValidValue(fields.workflow_play_id),
        document_date: fields.document_date,
        outgoing_documents: [],
        attach_documents: [],
        excerpt: getValidValue(fields.excerpt),
        signers: fields.signers,
        draft_department: fields.draft_department,
        receiver_notification: fields.receiver_notification,
        department_notification: fields.department_notification,
        document_quantity: fields.document_quantity,
        transfer_date: fields.transfer_date,
        note: getValidValue(fields.note),
        expiration_date: fields.expiration_date,
        priority: fields.priority,
        code: fields.code,
        number: fields.number
    };
    dto.outgoing_documents = fileUtil.getUploadedFilesWithSpecificKey({
        nameLib: NAME_LIB,
        formData,
        fieldKey: "outgoing_documents",
    });
    dto.attach_documents = fileUtil.getUploadedFilesWithSpecificKey({
        nameLib: NAME_LIB,
        formData,
        fieldKey: "attach_documents",
    });

    dto.attach_documents = dto.attach_documents.concat(praseStringToObject(fields.old_attach_documents, []));
    dto.outgoing_documents = dto.outgoing_documents.concat(praseStringToObject(fields.old_outgoing_documents, []));
    dto.parent = fields.parent ? JSON.parse(fields.parent) : {};
    dto.parents = generateParent(fields.parents ? JSON.parse(fields.parents) : [], dto.parent);
    return dto;
}

function buildUpdateReferencesOutgoingDispatchDTOFromRequest(formData) {
    const fields = formData.Fields;
    const dto = {
        references: fields.references
    };
    return dto;
}

function buildOutgoingDispatchInsertEntityFromDTO(dto, workflowPlay) {
    const entity = {
        outgoing_dispatch_book: dto.outgoing_dispatch_book,
        document_date: dto.document_date,
        outgoing_documents: dto.outgoing_documents,
        attach_documents: dto.attach_documents,
        excerpt: dto.excerpt,
        signers: dto.signers,
        draft_department: dto.draft_department,
        receiver_notification: dto.receiver_notification,
        department_notification: dto.department_notification,
        document_quantity: dto.document_quantity,
        transfer_date: dto.transfer_date,
        note: dto.note,
        expiration_date: dto.expiration_date,
        priority: dto.priority,
        references: [],
        parents: dto.parents,
        parent: {
            object: OBJECT_NAME.WORKFLOW_PLAY,
            value: workflowPlay._id.toString(),
        },
        code:dto.code
    };

    if (dto.workflow_play_id) {
        entity.references.push({
            type: "object",
            object: "workflow_play",
            value: dto.workflow_play_id,
            isDefault: true
        });
    }

    return entity;
}

function buildOutgoingDispatchUpdateEntityFromDTO(dto, oldDispatch) {
    const entity = {
        outgoing_dispatch_book: dto.outgoing_dispatch_book,
        document_date: dto.document_date,
        outgoing_documents: dto.outgoing_documents,
        attach_documents: dto.attach_documents,
        excerpt: dto.excerpt,
        signers: dto.signers,
        draft_department: dto.draft_department,
        receiver_notification: dto.receiver_notification,
        department_notification: dto.department_notification,
        document_quantity: dto.document_quantity,
        transfer_date: dto.transfer_date,
        note: dto.note,
        expiration_date: dto.expiration_date,
        priority: dto.priority,
        references: [],
    };

    const keepOutgoingDocuments = dto.outgoing_documents.map((documentFile) => {
        if (documentFile.nameLib) {
            return documentFile;
        }

        return oldDispatch.outgoing_documents.find((oldDoc) => {
            return oldDoc.name === documentFile.name;
        });
    })

    const keepAttachDocuments = dto.attach_documents.map((documentFile) => {
        if (documentFile.nameLib) {
            return documentFile;
        }

        return oldDispatch.attach_documents.find((oldDoc) => {
            return oldDoc.name === documentFile.name;
        });
    });

    entity.outgoing_documents = keepOutgoingDocuments;
    entity.attach_documents = keepAttachDocuments;

    if (dto.workflow_play_id) {
        entity.references = oldDispatch.references
            .filter((ref) => {
                return ref.object !== "workflow_play";
            })
            .concat({
                type: "object",
                object: "workflow_play",
                id: dto.workflow_play_id,
                isDefault: true
            });
    }

    return entity;
}

function checkPermissionToViewWorkflowPlay(workflowPlay, username) {
    if (workflowPlay.username === username) {
        return true;
    }

    if (workflowPlay.play_now.some((play) => play.username === username)) {
        return true;
    }

    if (workflowPlay.event.some((event) => event.username === username)) {
        return true;
    }

    return false;
}

function getUsernameDepartmentToNotify(users, department) {
    let usernameToNotify = [];
    users.forEach((user) => {
        const notifyTaskDepartmentRule = user.rule.find(rule => rule.rule === 'Office.Task.Notify_Task_Department');
        if (notifyTaskDepartmentRule) {
            const details = notifyTaskDepartmentRule.details;
            if (details.type === "All" || details.type === "Working") {
                usernameToNotify = usernameToNotify.concat(user.username);
            } else if (details.type === "Specific" && details.department && details.department.indexOf(department) !== -1) {
                usernameToNotify = usernameToNotify.concat(user.username);
            }
        }
    });
    return usernameToNotify;
}

function notify(req, filter, action, params, from_action){
    UserService.loadUser(req.body._service[0].dbname_prefix, filter).then(function (users) {
        users = users.map(e => e.username).filter(e => e !== req.body.username);
        RingBellItemService.insert(
            req.body._service[0].dbname_prefix,
            req.body.username,
            action,
            params,
            users,
            [],
            from_action,
            new Date().getTime()
        )
        
    }, function (err) {
        console.log(action, JOSN.stringify(err));
    })
}

class WorkflowPlayController {
    constructor() { }

    loadDetails(body) {
        let dfd = q.defer();
        q.fcall(() =>
            WorkflowPlayService.loadDetails(body._service[0].dbname_prefix, body.username, body.id, body.code),
        )
            .then((workflowDetails) => {
                if (!workflowDetails) {
                    throw BaseError.notFound("WorkflowPlayController.loadDetails.err");
                }

                // if (!checkPermissionToViewWorkflowPlay(workflowDetails, body.username)) {
                //     throw BaseError.permissionDenied("WorkflowPlayController.loadDetails.err");
                // }
                return q.all([
                    workflowDetails,
                    TaskWorkFlowPlayService.loadTaskbyWFPId(body._service[0].dbname_prefix, workflowDetails._id.toString()),
                    BriefCaseService.getByWorkflowPlayId(body._service[0].dbname_prefix, body.username, workflowDetails._id.toString()),
                    ReferenceUtil.resolveReferences(getDbNamePrefix({ body }), workflowDetails, "references"),
                ]);
            })
            .then(([workflowDetails, taskDetails, briefcase, ref]) => {
                const updateWorkflowDetails = () => {
                    Object.assign(workflowDetails, {
                        task: taskDetails,
                        briefcase: briefcase,
                    });
                    return resolveParents(body._service[0].dbname_prefix, workflowDetails);
                };

                if (workflowDetails.outgoing_dispatch) {
                    const retrieveFields = ["code"];
                    const transformFields = [{ from: "value", to: "id" }];
                    return ReferenceUtil.flattenReferencesAndRetrieveAdditionalFieldOfOGD(
                        getDbNamePrefix({ body }),
                        workflowDetails,
                        "references",
                        retrieveFields,
                        transformFields
                    )
                    .then(updateWorkflowDetails);
                } else {
                    return updateWorkflowDetails();
                }
            })
            .then((workflowDetails) => {
                dfd.resolve(workflowDetails);
            })
            .catch((e) => {
                dfd.reject(
                    e instanceof BaseError
                        ? e
                        : new BaseError("WorkflowPlayController.loadDetails.err", "Process load workflow play error"),
                );
            });
        return dfd.promise;
    }

    load(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_ManageUI(body.username, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_load(aggerationSteps, queryCriteria);
        return WorkflowPlayService.load(body._service[0].dbname_prefix, filter);
    }

    countPending(body) {
        body.checks = ['need_handle'];
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_ManageUI(body.username, body.session.employee_details.department, body.session.rule, body.checks);
        const filter = BuildFilterAggregate.generateUIFilterAggregate_count(aggerationSteps);
        return WorkflowPlayService.load(body._service[0].dbname_prefix, filter);
    }

    count(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_ManageUI(body.username, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_count(aggerationSteps, queryCriteria);
        return WorkflowPlayService.load(body._service[0].dbname_prefix, filter);
    }

    init(body) {
        let dfd = q.defer();
        if (body.session.employee_details) {
            WorkflowPlayService.init(body._service[0].dbname_prefix, body.session.employee_details.department, body.session.employee_details.competence, body.session.employee_details.job, body.session.role).then(function (result) {
                dfd.resolve(result);
            }, function (err) {
                dfd.reject(err);
            });
        } else {
            dfd.resolve({
                wf: [],
                wft: []
            });
        }

        return dfd.promise;
    }

    insert(req) {
        let dfd = q.defer();
        let date = new Date();
        FileProvider.upload(
            req,
            nameLib,
            validation.insert,
            undefined,
            parentFolder,
            req.body.username,
        )
            .then(function (formData) {
                const dbPrefix = req.body._service[0].dbname_prefix;
                const currentUser = req.body.session;
                const entity = generateBaseEntity(
                    formData,
                    currentUser.username,
                );
                const workflowId = entity.flow_info._id;

                let workflowDetail;
                let signatureTags = [];
                WorkflowService.load_details(dbPrefix, workflowId)
                    .then((workflow) => {
                        if (!workflow) {
                            return dfd.reject({
                                path: 'WorkflowPlayController.insert.err',
                                mes: 'Workflow not found',
                            });
                        }
                        workflowDetail = workflow;

                        if (!workflowDetail.allow_appendix && entity.appendix.length > 0) {
                            return dfd.reject({
                                path: 'WorkflowPlayController.insert.err',
                                mes: 'WorkflowNotAllowToUploadAppendix',
                            })
                        }

                        if (workflowDetail.file_type === WORKFLOW_FILE_TYPE.CUSTOM_TEMPLATE) {
                            return q.resolve(null);
                        } else {
                            return validateTagsInAttachments(entity.attachment, workflowDetail);
                        }
                    })
                    .then(() => {
                        if (workflowDetail.file_type === WORKFLOW_FILE_TYPE.CUSTOM_TEMPLATE) {
                            return processTemplateFile(
                                dbPrefix,
                                workflowDetail,
                                entity.tags_value,
                                currentUser,
                            );
                        } else {
                            return processUploadedFiles(
                                dbPrefix,
                                workflowDetail,
                                currentUser,
                                entity.attachment,
                            )
                        }
                    })
                    .then((fileInfo) => {
                        if (workflowDetail.file_type === WORKFLOW_FILE_TYPE.CUSTOM_TEMPLATE) {
                            entity.attachment = [fileInfo.attachment]
                            entity.originAttachment = [fileInfo.templateFile]
                        } else if (workflowDetail.file_type === WORKFLOW_FILE_TYPE.FILE_UPLOAD) {
                            entity.attachment = fileInfo
                            entity.originAttachment = entity.attachment
                        }
                        signatureTags = workflowUtil.getTemplateTagFromWorkflow(
                            workflowDetail,
                            {
                                includeTagTypes: [
                                    CUSTOM_TEMPLATE_TAG_TYPE.SIGNATURE,
                                    CUSTOM_TEMPLATE_TAG_TYPE.QUOTATION_MARK,
                                ],
                            },
                        );

                        const { startAt, expectedCompleteAt } = workflowPlayUtil.calculateFlowNodeTimes(
                            entity,
                            entity.created_at,
                            1,
                        );
                        Object.assign(entity.flow[0], {
                            start_at: startAt,
                            expected_complete_at: expectedCompleteAt,
                        });

                        return WorkflowPlayService.insert(
                            dbPrefix,
                            currentUser.username,
                            currentUser.employee_details.department,
                            entity.title,
                            entity.flow_info,
                            entity.flow,
                            entity.event,
                            entity.document_type,
                            entity.attachment,
                            entity.originAttachment,
                            entity.relatedfile,
                            entity.tags_value,
                            signatureTags,
                            workflowDetail.file_type,
                            entity.appendix,
                            entity.created_at,
                            entity.archived_documents,
                            entity.parent,
                            entity.parents,
                            entity.department_destination,
                            entity.is_personal,
                            entity.is_department,
                            entity.transfer_ticket
                        );
                    })
                    .then((result) => {
                        dfd.resolve(result);

                        const currentActor = currentUser.username;
                        const usernameNeedToApprove = result[0].play_now.map(user => user.username) || [];
                        if (usernameNeedToApprove.length > 0) {
                            RingBellItemService.insert(
                                dbPrefix,
                                currentActor,
                                'workflow_need_approve',
                                {
                                    workflowId: result[0]._id.toString(),
                                    title: entity.title,
                                    actionBy: currentActor,
                                    username_creator: currentUser.username,
                                    action: result[0].flow[0].type,
                                    document_type: result[0].document_type,
                                    code: result[0].code
                                },
                                usernameNeedToApprove,
                                [],
                                'approveWorkflowPlay',
                                date.getTime(),
                            );
                        }

                        // // Notify to the next PIC in WF to get approval
                        // if (result && result.length > 0) {
                        //     const filter = genFilterGetUsersByRuleAndDepartment(WORKFLOW_PLAY_RULE.DEPARTMENT_LEADER_MANAGE, result[0].department);
                        //     UserService.loadUser(dbPrefix, filter).then(function(users) {
                        //         const usernameNeedToApprove = users.map(user => user.username);
                        //         if (usernameNeedToApprove.length > 0) {
                        //             RingBellItemService.insert(
                        //                 dbPrefix,
                        //                 currentActor,
                        //                 'workflow_need_approve',
                        //                 {
                        //                     workflowId: result[0]._id.toString(),
                        //                     title: entity.title,
                        //                     actionBy: currentActor,
                        //                     username_creator: currentActor,
                        //                     action: result[0].flow[0].type,
                        //                     document_type: result[0].document_type,
                        //                     code: result[0].code
                        //                 },
                        //                 usernameNeedToApprove,
                        //                 [],
                        //                 'approveWorkflowPlay',
                        //                 date.getTime(),
                        //             );
                        //         }
                        //     })
                        // }
                    })
                    .catch((err) => {
                        LogProvider.error(err.mes);
                        LogProvider.error(err.message);
                        dfd.reject({
                            path: err.path || 'WorkflowPlayController.insert.err',
                            mes: err.mes || 'Process insert workflow play error',
                        });
                    });
            })
            .catch((err) => {
                console.error(err)
                dfd.reject({
                    path: 'WorkflowPlayController.insert.err',
                    mes: 'Process insert workflow play error',
                });
            });

        return dfd.promise;
    }

    insert_transfer_ticket(req) {
        let dfd = q.defer();
        let date = new Date();
        FileProvider.upload(
            req,
            nameLib,
            validation.insert_transfer_ticket,
            undefined,
            parentFolder,
            req.body.username,
        )
            .then(function (formData) {
                const dbPrefix = req.body._service[0].dbname_prefix;
                const currentUser = req.body.session;
                const entity = generateBaseEntity_transfer_ticket(
                    formData,
                    currentUser.username,
                );
                const workflowId = entity.flow_info._id;

                let workflowDetail;
                let signatureTags = [];

                WorkflowService.load_details(dbPrefix, workflowId)
                    .then((workflow) => {
                        if (!workflow) {
                            return dfd.reject({
                                path: 'WorkflowPlayController.insert.err',
                                mes: 'Workflow not found',
                            });
                        }
                        workflowDetail = workflow;

                        if (!workflowDetail.allow_appendix && entity.appendix.length > 0) {
                            return dfd.reject({
                                path: 'WorkflowPlayController.insert.err',
                                mes: 'WorkflowNotAllowToUploadAppendix',
                            })
                        }

                        if (workflowDetail.file_type === WORKFLOW_FILE_TYPE.CUSTOM_TEMPLATE) {
                            return q.resolve(null);
                        } else {
                            return validateTagsInAttachments(entity.attachment, workflowDetail);
                        }
                    })
                    .then(() => {
                        if (workflowDetail.file_type === WORKFLOW_FILE_TYPE.CUSTOM_TEMPLATE) {
                            return processTemplateFile(
                                dbPrefix,
                                workflowDetail,
                                entity.tags_value,
                                currentUser,
                            );
                        } else {
                            return processUploadedFiles(
                                dbPrefix,
                                workflowDetail,
                                currentUser,
                                entity.attachment,
                            )
                        }
                    })
                    .then((fileInfo) => {
                        if (workflowDetail.file_type === WORKFLOW_FILE_TYPE.CUSTOM_TEMPLATE) {
                            entity.attachment = [fileInfo.attachment]
                            entity.originAttachment = [fileInfo.templateFile]
                        } else if (workflowDetail.file_type === WORKFLOW_FILE_TYPE.FILE_UPLOAD) {
                            entity.attachment = fileInfo
                            entity.originAttachment = entity.attachment
                        }
                        signatureTags = workflowUtil.getTemplateTagFromWorkflow(
                            workflowDetail,
                            {
                                includeTagTypes: [
                                    CUSTOM_TEMPLATE_TAG_TYPE.SIGNATURE,
                                    CUSTOM_TEMPLATE_TAG_TYPE.QUOTATION_MARK,
                                ],
                            },
                        );

                        const { startAt, expectedCompleteAt } = workflowPlayUtil.calculateFlowNodeTimes(
                            entity,
                            entity.created_at,
                            1,
                        );
                        Object.assign(entity.flow[0], {
                            start_at: startAt,
                            expected_complete_at: expectedCompleteAt,
                        });
                        return WorkflowPlayService.insert_transfer_ticket(
                            dbPrefix,
                            currentUser.username,
                            currentUser.employee_details.department,
                            entity.title,
                            entity.flow_info,
                            entity.flow,
                            entity.event,
                            entity.document_type,
                            entity.attachment,
                            entity.originAttachment,
                            entity.relatedfile,
                            entity.tags_value,
                            signatureTags,
                            workflowDetail.file_type,
                            entity.appendix,
                            entity.created_at,
                            entity.archived_documents,
                            entity.parent,
                            entity.parents,
                            entity.user_and_department_destination,
                            entity.is_personal,
                            entity.is_department,
                            entity.transfer_ticket
                        );
                    })
                    .then((result) => {
                        // Notify to the next PIC in WF to get approval
                        if (result && result.length > 0) {
                            let currentActor = currentUser.username;

                            const filter = genFilterRuleUser(WORKFLOW_PLAY_RULE.DEPARTMENT_LEADER_MANAGE, result[0].department);
                            UserService.loadUser(dbPrefix, filter).then(function(users) {
                                let usernameNeedToApprove = [];
                                users.forEach((user) => {
                                    usernameNeedToApprove.push(user.username);
                                })

                                if (usernameNeedToApprove.length > 0) {
                                    RingBellItemService.insert(
                                        dbPrefix,
                                        currentActor,
                                        'workflow_need_approve',
                                        {
                                            workflowId: result[0]._id.toString(),
                                            title: entity.title,
                                            actionBy: currentActor,
                                            username_creator: currentUser.username,
                                            action: result[0].flow[0].type,
                                            document_type: result[0].document_type,
                                            code: result[0].code
                                        },
                                        usernameNeedToApprove,
                                        [],
                                        'approveWorkflowPlay',
                                        date.getTime(),
                                    );
                                }
                            })           
                        }
                        dfd.resolve(result);
                    })
                    .catch((err) => {
                        LogProvider.error(err.mes);
                        LogProvider.error(err.message);
                        dfd.reject({
                            path: err.path || 'WorkflowPlayController.insert.err',
                            mes: err.mes || 'Process insert workflow play error',
                        });
                    });
            })
            .catch((err) => {
                dfd.reject({
                    path: 'WorkflowPlayController.insert.err',
                    mes: 'Process insert workflow play error',
                });
            });

        return dfd.promise;
    }

    update(req) {
        let dfd = q.defer();
        let date = new Date();
        FileProvider.upload(
            req,
            nameLib,
            validation.update,
            undefined,
            parentFolder,
            req.body.username,
        )
            .then(function (formData) {
                const dbPrefix = req.body._service[0].dbname_prefix;
                const currentUser = req.body.session;
                const entity = generateBaseEntity(
                    formData,
                    currentUser.username,
                );
                let signatureTags = [];

                WorkflowPlayService.update(
                    dbPrefix,
                    currentUser.username,
                    entity.id,
                    currentUser.employee_details.department,
                    entity.title,
                    entity.flow_info,
                    entity.flow,
                    entity.event,
                    entity.document_type,
                    entity.attachment,
                    entity.originAttachment,
                    entity.relatedfile,
                    entity.tags_value,
                    signatureTags,
                    null,
                    entity.appendix,
                    entity.created_at,
                    entity.archived_documents,
                    entity.parent,
                    entity.parents,
                    entity.department_destination,
                    entity.is_personal,
                    entity.is_department,
                    entity.transfer_ticket
                )

                    .then((result) => {

                        dfd.resolve(result);
                    })
                    .catch((err) => {
                        LogProvider.error(err.mes);
                        LogProvider.error(err.message);
                        dfd.reject({
                            path: err.path || 'WorkflowPlayController.update.err',
                            mes: err.mes || 'Process update workflow play error',
                        });
                    });
            })
            .catch((err) => {
                dfd.reject({
                    path: 'WorkflowPlayController.update.err',
                    mes: 'Process update workflow play error',
                });
            });

        return dfd.promise;
    }

    loadFileInfo(body) {
        let dfd = q.defer();
        WorkflowPlayService.loadDetails(
            body._service[0].dbname_prefix,
            body.username,
            body.id,
        ).then(
            function (data) {
                let checkPermission = true;
                let checkFile = false;
                let fileInfo = {};
                let owner = data.username;

                if (data.customTemplate) {
                    if (data.customTemplate.name === body.filename) {
                        checkFile = true;
                        fileInfo = data.customTemplate;
                    }
                }

                for (let i in data.attachment) {
                    if (data.attachment[i].name === body.filename) {
                        fileInfo = data.attachment[i];
                        checkFile = true;
                        break;
                    }
                }

                for (let i in data.relatedfile) {
                    if (data.relatedfile[i].name === body.filename) {
                        fileInfo = data.relatedfile[i];
                        checkFile = true;
                        break;
                    }
                }

                for (let i in data.appendix || []) {
                    if (data.appendix[i].name === body.filename) {
                        fileInfo = data.appendix[i];
                        checkFile = true;
                        break;
                    }
                }

                for (let i in data.archived_documents || []) {
                    if (data.archived_documents[i].name === body.filename) {
                        fileInfo = data.archived_documents[i];
                        checkFile = true;
                        break;
                    }
                }

                for (let event of data.event) {
                    const file = (event.relatedfile || []).find((ele) => ele.name === body.filename)
                    if (file) {
                        fileInfo = file
                        checkFile = true
                        owner = event.username;
                    }
                }

                if (checkPermission) {
                    if (checkFile) {
                        FileProvider.loadFile(
                            body._service[0].dbname_prefix,
                            body.session,
                            fileInfo.nameLib,
                            fileInfo.name,
                            fileInfo.timePath,
                            fileInfo.locate,
                            folderArray,
                            owner,
                        ).then(
                            function (fileinfo) {
                                fileinfo.display = fileInfo.display;
                                dfd.resolve(fileinfo);
                                fileinfo = undefined;
                            },
                            function (err) {
                                dfd.reject(err);
                                fileInfo = undefined;
                                err = undefined;
                            },
                        );
                    } else {
                        dfd.reject({
                            path: 'WorkflowPlayController.loadFileInfo.FileIsNotExists',
                            mes: 'FileIsNotExists',
                        });
                    }
                    body = undefined;
                    checkPermission = undefined;
                    checkFile = undefined;
                } else {
                    dfd.reject({
                        path: 'WorkflowPlayController.loadFileInfo.NotPermission',
                        mes: 'NotPermission',
                    });
                    body = undefined;
                    checkPermission = undefined;
                    checkFile = undefined;
                    fileInfo = undefined;
                }
            },
            function (err) {
                dfd.reject(err);
                body = undefined;
            },
        );

        return dfd.promise;
    }

    approval(request) {
        const dfd = q.defer();
        const currentUser = request.body.session;
        const dbNamePrefix = request.body._service[0].dbname_prefix;
        const date = new Date();

        let entity;

        FileProvider.upload(request, nameLib, undefined, undefined, parentFolder, currentUser.username)
            .then(function (formData) {
                entity = generateApprovalEntity(formData, currentUser.username);
                return WorkflowPlayService.approval(
                    dbNamePrefix,
                    currentUser.username,
                    entity.id,
                    entity.comment,
                    entity.note,
                    entity.relatedfile,
                );
            })
            .then(function (data) {
                dfd.resolve(true);
                const currentActor = currentUser.username;
                let currentDepartment = data.department;
                let isEndNode = data.node === -1 && data.status.toLowerCase() === 'approved';

                if (isEndNode) {
                    let usernameNeedToNotify = new Set();
                    const eventsAfterReturned = data.event.reverse();

                    for (const event of eventsAfterReturned) {
                        if (event.action.toLowerCase() === 'returned') {
                            break;
                        }
                        if (event.username !== currentActor) {
                            usernameNeedToNotify.add(event.username);
                        }
                    }

                    usernameNeedToNotify = Array.from(usernameNeedToNotify);

                    RingBellItemService.insert(
                        dbNamePrefix,
                        currentActor,
                        'workflow_done',
                        {
                            workflowId: entity.id.toString(),
                            title: data.title,
                            actionBy: currentActor,
                            departmentBy: data.toDepartment, // department from B when done
                            document_type: data.document_type,
                            username_creator: data.username,
                            code:data.code
                        },
                        usernameNeedToNotify,
                        [],
                        'approveWorkflowPlay',
                        date.getTime(),
                    );
                } else {
                    const usernameNeedToApprove = data.play_now.map(user => user.username) || [];
                    if (usernameNeedToApprove.length > 0) {
                        RingBellItemService.insert(
                            dbNamePrefix,
                            currentActor,
                            'workflow_need_approve',
                            {
                                workflowId: data._id.toString(),
                                title: data.title,
                                actionBy: currentActor,
                                username_creator: currentUser.username,
                                action: data.flow[(data.node)-1].type,
                                document_type: data.document_type,
                                code: data.code,
                                departmentBy: currentDepartment
                            },
                            usernameNeedToApprove,
                            [],
                            'approveWorkflowPlay',
                            date.getTime(),
                        );
                    }

                    // Notify to the next PIC in WF to get approval
                    // const currentNode = data.flow[data.node - 1];
                    // const filter = genFilterGetUsersByRuleAndDepartment(WORKFLOW_PLAY_RULE.DEPARTMENT_LEADER_MANAGE, data.toDepartment);
                    // UserService.loadUser(dbNamePrefix, filter).then(function(users) {
                    //     const usernameNeedToApprove = users.map(user => user.username);
                    //     console.log("usernameNeedToApprove", usernameNeedToApprove);
                    //     if (usernameNeedToApprove.length > 0) {
                    //         return RingBellItemService.insert(
                    //             dbNamePrefix,
                    //             currentActor,
                    //             'workflow_need_approve',
                    //             {
                    //                 workflowId: entity.id.toString(),
                    //                 title: data.title,
                    //                 actionBy: currentActor,
                    //                 departmentBy: currentDepartment, // department from A when approve
                    //                 document_type: data.document_type,
                    //                 username_creator: data.username,
                    //                 action: currentNode.type,
                    //                 code: data.code
                    //             },
                    //             usernameNeedToApprove,
                    //             [],
                    //             'approveWorkflowPlay',
                    //             date.getTime()
                    //         );
                    //     }
                    // });
                    
                    // Notify to the user that had updated in WF without the creator
                    let usernameHadApprovedWithoutCreator = [];
                    let eventsAfterReturned = data.event.reverse();
                    for (const event of eventsAfterReturned) {
                        if (event.action.toLowerCase() === 'returned') {
                            break;
                        }
                        if (event.username !== currentActor && event.username !== data.username) {
                            usernameHadApprovedWithoutCreator.push(event.username);
                        }
                    }

                    if (usernameHadApprovedWithoutCreator.length !== 0) {
                        RingBellItemService.insert(
                            dbNamePrefix,
                            currentActor,
                            'workflow_approved',
                            {
                                workflowId: entity.id.toString(),
                                title: data.title,
                                actionBy: currentActor,
                                departmentBy: currentDepartment, // department from A when approve
                                document_type: data.document_type,
                                createdBy: data.username,
                                code: data.code
                            },
                            usernameHadApprovedWithoutCreator,
                            [],
                            'approveWorkflowPlay',
                            date.getTime(),
                        );
                    }

                    // Notify the creator of the WF
                    let creator = [data.username];
                    RingBellItemService.insert(
                        dbNamePrefix,
                        currentActor,
                        'workflow_approved_creator',
                        {
                            workflowId: entity.id.toString(),
                            title: data.title,
                            actionBy: currentActor,
                            document_type: data.document_type,
                            code:data.code
                        },
                        creator,
                        [],
                        'approveWorkflowPlay',
                        date.getTime(),
                    );
                }
                const currentNodeData = workflowPlayUtil.getCurrentNodeAfterApproveWorkflowPlay(data);
                if(currentNodeData.auto_completed_task){

                    if (data.parents.length > 0 && data.parents[0].code) {
                        let dfd = q.defer();
                        let date = new Date();
                        const taskId = data.parents[0].id;
                        TaskService.complete(dbNamePrefix, currentUser.username, taskId , date).then(
                            function (docUpdated) {
                                dfd.resolve(true);
                                let usernameToNotifySet = new Set();

                                docUpdated.main_person.forEach(username => usernameToNotifySet.add(username));
                                docUpdated.participant.forEach(username => usernameToNotifySet.add(username));
                                docUpdated.observer.forEach(username => usernameToNotifySet.add(username));

                                let usernameToNotify = Array.from(usernameToNotifySet);
                                TaskService.loadEmployeeDepartment(dbNamePrefix, docUpdated.department).then(function (res) {
                                    let usernameToReceive = getUsernameDepartmentToNotify(res, docUpdated.department);
                                    usernameToReceive = usernameToReceive.filter(username => !usernameToNotifySet.has(username));

                                    if (usernameToReceive.length > 0) {
                                        usernameToNotify = usernameToNotify.concat(usernameToReceive);
                                    }
                                    RingBellItemService.insert(
                                        dbNamePrefix,
                                        currentUser.username,
                                        'task_updated_status',
                                        { taskCode: data.parents[0].code, title: docUpdated.title, username_updated_status: currentUser.username, action: "completedTask" },
                                        usernameToNotify,
                                        [],
                                        'completedTask',
                                        date.getTime(),
                                    );
                                    date = undefined;
                                    dfd.resolve(true);
                                })
                                    .catch(function (err) {
                                        console.error(err);
                                        dfd.reject(err);
                                    });
                            },
                            function (err) {
                                dfd.reject(err);
                                date = undefined;
                            },
                        );
                    }
                }
            })
            .catch(function (error) {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    receiver(request) {
        const dfd = q.defer();
        const currentUser = request.body.session;
        const dbNamePrefix = request.body._service[0].dbname_prefix;
        const d = new Date();

        let entity;

        FileProvider.upload(request, nameLib, undefined, undefined, parentFolder, currentUser.username)
            .then(function (formData) {
                entity = generateApprovalEntity(formData, currentUser.username);
                return WorkflowPlayService.receiver(
                    dbNamePrefix,
                    currentUser.username,
                    entity.id,
                    entity.comment,
                    entity.relatedfile,
                );
            })
            .then(function (data) {
                dfd.resolve(true);
                let currentActor = currentUser.username;
                let isEndNode = data.node === -1 && data.status.toLowerCase() === 'received';

                if (isEndNode) {
                    let usernameNeedToNotify = [];
                    let eventsAfterReturned = data.event.reverse();
                    for (const event of eventsAfterReturned) {
                        if (event.action.toLowerCase() === 'returned') {
                            break;
                        }
                        if (event.username !== currentActor) {
                            usernameNeedToNotify.push(event.username);
                        }
                    }

                    RingBellItemService.insert(
                        dbNamePrefix,
                        currentActor,
                        'workflow_done',
                        {
                            workflowId: entity.id.toString(),
                            title: data.title,
                            actionBy: currentActor,
                            username_creator: data.username,
                            code:data.code
                        },
                        usernameNeedToNotify,
                        [],
                        'approveWorkflowPlay',
                        d.getTime(),
                    );
                } else {
                    // Notify to the next PIC in WF to get approval
                    let usernameNeedToApprove = [];
                    const play_now = data.play_now.map((player) => player.username);
                    if (data.node > data.event[data.event.length - 1].node) {
                        usernameNeedToApprove = play_now;
                    }

                    const currentNode = data.flow[data.node - 1];
                    if (usernameNeedToApprove.length > 0) {

                        RingBellItemService.insert(
                            dbNamePrefix,
                            currentActor,
                            'workflow_need_approve',
                            {
                                workflowId: entity.id.toString(),
                                title: data.title,
                                actionBy: currentActor,
                                username_creator: data.username,
                                action: currentNode.type,
                                code: data.code
                            },
                            usernameNeedToApprove,
                            [],
                            'approveWorkflowPlay',
                            d.getTime(),
                        );
                    }

                    // Notify to the user that had updated in WF without the creator
                    let usernameHadApprovedWithoutCreator = [];
                    let eventsAfterReturned = data.event.reverse();
                    for (const event of eventsAfterReturned) {
                        if (event.action.toLowerCase() === 'returned') {
                            break;
                        }
                        if (event.username !== currentActor && event.username !== data.username) {
                            usernameHadApprovedWithoutCreator.push(event.username);
                        }
                    }

                    if (usernameHadApprovedWithoutCreator.length !== 0) {
                        RingBellItemService.insert(
                            dbNamePrefix,
                            currentActor,
                            'workflow_approved',
                            {
                                workflowId: entity.id.toString(),
                                title: data.title,
                                actionBy: currentActor,
                                createdBy: data.username,
                                code: data.code
                            },
                            usernameHadApprovedWithoutCreator,
                            [],
                            'approveWorkflowPlay',
                            d.getTime(),
                        );
                    }

                    // Notify the creator of the WF
                    let creator = [data.username];
                    RingBellItemService.insert(
                        dbNamePrefix,
                        currentActor,
                        'workflow_approved_creator',
                        {
                            workflowId: entity.id.toString(),
                            title: data.title,
                            actionBy: currentActor,
                            code:data.code
                        },
                        creator,
                        [],
                        'approveWorkflowPlay',
                        d.getTime(),
                    );
                }
            })
            .catch(function (error) {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    process(dbPrefix, currentUser, formData) {
        const dfd = q.defer();
        const d = new Date();

        let dto = null;
        let entity = null;
        let processedWorkflowPlay = null;
        let isUpdateOutGoingDispatch = false;

        q.fcall(() => {
            dto = buildOutgoingDispatchDTOFromRequest(formData);
            dto = validation.validation.processFormData(dto);

            let outGoingDispatchDetailPromise = null;
            if (dto.outgoing_dispatch_id) {
                isUpdateOutGoingDispatch = true;
                outGoingDispatchDetailPromise = OutGoingDispatchService.load(
                    dbPrefix,
                    currentUser.username,
                    dto.outgoing_dispatch_id,
                );
            }

            return q.all([
                WorkflowPlayService.loadDetails(dbPrefix, currentUser.username, dto.workflow_play_id),
                outGoingDispatchDetailPromise,
            ]);
        })
            .then(([workflowPlay, outGoingDispatch]) => {
                LogProvider.debug("Process insert outgoing dispatch entity");

                let processPromise = null;
                if (!isUpdateOutGoingDispatch) {
                    LogProvider.debug(
                        "Process insert outgoing dispatch for workflow play with id: " + dto.workflow_play_id,
                    );
                    entity = buildOutgoingDispatchInsertEntityFromDTO(dto, workflowPlay);
                    Object.assign(entity, {
                        document_type: workflowPlay.document_type,
                    });
                    processPromise = OutGoingDispatchService.insert(
                        dbPrefix,
                        currentUser.username,
                        workflowPlay.department,
                        entity,
                    );
                } else {
                    LogProvider.debug(
                        "Process update outgoing dispatch for workflow play with id: " + dto.workflow_play_id,
                    );

                    if (outGoingDispatch.status !== OBD_STATUS.NOT_PUBLIC_YET) {
                        throw new BaseError("WorkflowPlayController.process.err", "OutGoingDispatchIsNotPublicYet");
                    }

                    entity = buildOutgoingDispatchUpdateEntityFromDTO(dto, outGoingDispatch);
                    processPromise = OutGoingDispatchService.update(
                        dbPrefix,
                        currentUser.username,
                        dto.outgoing_dispatch_id,
                        entity,
                    );
                }
                return processPromise;
            })
            .then((outgoingDispatch) => {
                if (isUpdateOutGoingDispatch) {
                    dfd.resolve(true);
                    return;
                }
                LogProvider.debug("Process workflow play 'process' node");
                return WorkflowPlayService.process(
                    dbPrefix,
                    currentUser.username,
                    dto.workflow_play_id,
                    outgoingDispatch._id.toString(),
                );
            })
            .then((data) => {
                if (isUpdateOutGoingDispatch) {
                    return;
                }
                processedWorkflowPlay = data;
                dfd.resolve(true);
                const isCompletedWorkflowPlay =
                    processedWorkflowPlay.node === -1 &&
                    processedWorkflowPlay.status === WORKFLOW_PLAY_STATUS.SAVED_ODB;

                if (!isCompletedWorkflowPlay) {
                    return;
                }

                let usernameNeedToNotify = new Set();
                let eventsAfterReturned = processedWorkflowPlay.event.reverse();
                for (const event of eventsAfterReturned) {
                    if (event.action.toLowerCase() === "returned") {
                        break;
                    }
                    if (event.username !== currentUser.username) {
                        usernameNeedToNotify.add(event.username);
                    }
                }
                RingBellItemService.insert(
                    dbPrefix,
                    currentUser.username,
                    "workflow_done",
                    {
                        workflowId: dto.workflow_play_id,
                        title: processedWorkflowPlay.title,
                        actionBy: currentUser.username,
                        code:processedWorkflowPlay.code
                    },
                    [...usernameNeedToNotify.keys()],
                    [],
                    "saveODBWorkflowPlay",
                    d.getTime(),
                );
            })
            .catch((error) => {
                LogProvider.error("Process outgoing dispatch error: " + error.mes || error.message);
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError("WorkflowPlayController.process.err", error.mes || "WorkflowPlayProcessError"),
                );
            });
        return dfd.promise;
    }

    updareReferences(dbPrefix, currentUser, formData) {
        const dfd = q.defer();
        const d = new Date();

        let dto = null;
        let entity = null;
        let processedWorkflowPlay = null;
        let isUpdateOutGoingDispatch = false;

        q.fcall(() => {
            dto = buildUpdateReferencesOutgoingDispatchDTOFromRequest(formData);
            dto = validation.validation.processUpdateReferencesFormData(dto);

            let outGoingDispatchDetailPromise = null;
            if (dto.outgoing_dispatch_id) {
                isUpdateOutGoingDispatch = true;
                outGoingDispatchDetailPromise = OutGoingDispatchService.load(
                    dbPrefix,
                    currentUser.username,
                    dto.outgoing_dispatch_id,
                );
            }

            return q.all([
                WorkflowPlayService.loadDetails(dbPrefix, currentUser.username, dto.workflow_play_id),
                outGoingDispatchDetailPromise,
            ]);
        })
            .then(([workflowPlay, outGoingDispatch]) => {
                LogProvider.debug("Process insert outgoing dispatch entity");

                let processPromise = null;
                if (!isUpdateOutGoingDispatch) {
                    LogProvider.debug(
                        "Process insert outgoing dispatch for workflow play with id: " + dto.workflow_play_id,
                    );
                    entity = buildOutgoingDispatchInsertEntityFromDTO(dto, workflowPlay);
                    Object.assign(entity, {
                        document_type: workflowPlay.document_type,
                    });
                    processPromise = OutGoingDispatchService.insert(
                        dbPrefix,
                        currentUser.username,
                        workflowPlay.department,
                        entity,
                    );
                } else {
                    LogProvider.debug(
                        "Process update outgoing dispatch for workflow play with id: " + dto.workflow_play_id,
                    );

                    if (outGoingDispatch.status !== OBD_STATUS.NOT_PUBLIC_YET) {
                        throw new BaseError("WorkflowPlayController.process.err", "OutGoingDispatchIsNotPublicYet");
                    }

                    entity = buildOutgoingDispatchUpdateEntityFromDTO(dto, outGoingDispatch);
                    processPromise = OutGoingDispatchService.update(
                        dbPrefix,
                        currentUser.username,
                        dto.outgoing_dispatch_id,
                        entity,
                    );
                }
                return processPromise;
            })
            .then((outgoingDispatch) => {
                if (isUpdateOutGoingDispatch) {
                    dfd.resolve(true);
                    return;
                }
                LogProvider.debug("Process workflow play 'process' node");
                return WorkflowPlayService.process(
                    dbPrefix,
                    currentUser.username,
                    dto.workflow_play_id,
                    outgoingDispatch._id.toString(),
                );
            })
            .then((data) => {
                if (isUpdateOutGoingDispatch) {
                    return;
                }
                processedWorkflowPlay = data;
                dfd.resolve(true);
                const isCompletedWorkflowPlay =
                    processedWorkflowPlay.node === -1 &&
                    processedWorkflowPlay.status === WORKFLOW_PLAY_STATUS.SAVED_ODB;

                if (!isCompletedWorkflowPlay) {
                    return;
                }

                let usernameNeedToNotify = new Set();
                let eventsAfterReturned = processedWorkflowPlay.event.reverse();
                for (const event of eventsAfterReturned) {
                    if (event.action.toLowerCase() === "returned") {
                        break;
                    }
                    if (event.username !== currentUser.username) {
                        usernameNeedToNotify.add(event.username);
                    }
                }
                RingBellItemService.insert(
                    dbPrefix,
                    currentUser.username,
                    "workflow_done",
                    {
                        workflowId: dto.workflow_play_id,
                        title: processedWorkflowPlay.title,
                        actionBy: currentUser.username,
                        code:processedWorkflowPlay.code
                    },
                    [...usernameNeedToNotify.keys()],
                    [],
                    "saveODBWorkflowPlay",
                    d.getTime(),
                );
            })
            .catch((error) => {
                LogProvider.error("Process outgoing dispatch error: " + error.mes || error.message);
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError("WorkflowPlayController.process.err", error.mes || "WorkflowPlayProcessError"),
                );
            });
        return dfd.promise;
    }

    transformSignOther(body) {
        let d = new Date();
        let dfd = q.defer();

        WorkflowPlayService.transformSignOther(
            body._service[0].dbname_prefix,
            body.username,
            body.receiver,
            body.id
        ).then(
            (data) => {
                dfd.resolve(true);
                let currentActor = body.username;

                let usernameNeedToNotify = [body.receiver];
                let eventsAfterReturned = data.event.reverse();
                for (const event of eventsAfterReturned) {
                    if (event.action.toLowerCase() === 'returned') {
                        break;
                    }
                    if (event.username !== currentActor) {
                        usernameNeedToNotify.push(event.username);
                    }
                }
                RingBellItemService.insert(
                    body._service[0].dbname_prefix,
                    currentActor,
                    'workflow_transform_sign',
                    {
                        workflowId: body.id.toString(),
                        title: data.title,
                        actionBy: currentActor,
                        assignee: body.receiver
                    },
                    usernameNeedToNotify,
                    [],
                    'transformSignWorkflowPlay',
                    d.getTime()
                );
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
                body = undefined;
            }
        );
        return dfd.promise;
    }

    signOther(body) {
        let d = new Date();
        let dfd = q.defer();

        WorkflowPlayService.signOther(
            body._service[0].dbname_prefix,
            body.username,
            body.id,
            body.comment
        ).then(
            (data) => {
                dfd.resolve(true);
                let currentActor = body.username;

                let usernameNeedToNotify = [];
                let eventsAfterReturned = data.event.reverse();
                for (const event of eventsAfterReturned) {
                    if (event.action.toLowerCase() === 'returned') {
                        break;
                    }
                    if (event.username !== currentActor) {
                        usernameNeedToNotify.push(event.username);
                    }
                }
                RingBellItemService.insert(
                    body._service[0].dbname_prefix,
                    currentActor,
                    'workflow_approved',
                    {
                        workflowId: body.id.toString(),
                        title: data.title,
                        actionBy: currentActor,
                        createdBy: data.username,
                        code:data.code
                    },
                    usernameNeedToNotify,
                    [],
                    "approveWorkflowPlay",
                    d.getTime()
                );
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
                body = undefined;
            }
        );
        return dfd.promise;
    }

    reject(request) {
        const dfd = q.defer();
        const currentUser = request.body.session;
        const dbNamePrefix = request.body._service[0].dbname_prefix;
        const d = new Date();

        let entity;

        FileProvider.upload(request, nameLib, undefined, undefined, parentFolder, currentUser.username)
            .then((formData) => {
                entity = generateRejectEntity(formData);
                return WorkflowPlayService.reject(
                    dbNamePrefix,
                    currentUser.username,
                    entity.id,
                    entity.comment,
                    entity.note,
                    entity.relatedfile,
                );
            })
            .then((data) => {
                dfd.resolve(true);
                let currentActor = data.event[data.event.length - 1].username;
                let usernameHadApproved = data.event.map((event) => event.username);
                usernameHadApproved = Array.from(new Set(usernameHadApproved));
                usernameHadApproved = usernameHadApproved.filter(
                    (per) => per !== data.username && per !== currentActor,
                );

                // Update the status of WF to these signed persons
                RingBellItemService.insert(
                    dbNamePrefix,
                    currentUser.username,
                    'workflow_rejected',
                    {
                        workflowId: entity.id.toString(),
                        title: data.title,
                        actionBy: currentActor,
                        code: data.code
                    },
                    usernameHadApproved,
                    [],
                    'rejectWorkflowPlay',
                    d.getTime(),
                );

                // Notify to the creator about the rejection
                RingBellItemService.insert(
                    dbNamePrefix,
                    currentUser.username,
                    'workflow_rejected_creator',
                    {
                        workflowId: entity.id.toString(),
                        title: data.title,
                        actionBy: currentActor,
                        code: data.code
                    },
                    [data.username],
                    [],
                    'rejectWorkflowPlay',
                    d.getTime(),
                );
            })
            .catch((error) => {
                dfd.reject(error);
            });

        return dfd.promise;
    }

    delete(body) {
        let d = new Date();
        let dfd = q.defer();
        WorkflowPlayService.delete(body._service[0].dbname_prefix, body.username, body.id).then(function (data) {
            dfd.resolve(true);
            let currentActor = data.event[data.event.length - 1].username;
            let usernameHadApproved = data.event.map(event => event.username);
            usernameHadApproved = Array.from(new Set(usernameHadApproved));
            usernameHadApproved = usernameHadApproved.filter(per => per !== currentActor);

            RingBellItemService.insert(
                body._service[0].dbname_prefix,
                body.username,
                'workflow_deleted',
                {
                    workflowId: body.id.toString(),
                    title: data.title,
                    actionBy: currentActor,
                    createdBy: data.username,
                    code: data.code
                },
                usernameHadApproved,
                [],
                "deleteWorkflowPlay",
                d.getTime()
            );
            dfd.resolve(true);
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            body = undefined;
        });

        return dfd.promise;
    }

    return_creator_additional_document(body) {
        let d = new Date();
        let dfd = q.defer();

        verify_ReturnCreatorAdditionalDocument(body, body.id).then(function(wf){
            const event = {
                id: uuidv4(),
                time: d.getTime(),
                action: 'return_creator_additional_document',
                username: body.username
            };
            const play_now =[{
                items:[],
                username: wf.username,
            }]
            const status = WORKFLOW_PLAY_STATUS.WAITING_ADDITIONAL_DOCUMENT;
            const node = -1;
            WorkflowPlayService.return_creator_additional_document(
                body._service[0].dbname_prefix,
                body.username,
                body.id,
                event,
                play_now,
                status,
                node,
                body.waiting_archive_id
            ).then(function(res){
                dfd.resolve(true);
                const currentUser = body.session;
                RingBellItemService.insert(
                    body._service[0].dbname_prefix,
                    body.username,
                    'workflow_need_approve',
                    {
                        workflowId: wf._id.toString(),
                        title: wf.title,
                        actionBy: body.username,
                        username_creator: currentUser.username,
                        action: 'return_creator_additional_document',
                        document_type: wf.document_type,
                        code: wf.code,
                        departmentBy: body.session.department
                    },
                    wf.username,
                    [],
                    'approveWorkflowPlay',
                    (new Date).getTime(),
                );               

            }, function(err){
                dfd.reject(err);
            })
        }, function(err){
            dfd.reject(err);
        })


        return dfd.promise;
    }

    creator_additional_document(req) {
        let d = new Date();
        let dfd = q.defer();

        FileProvider.upload(req, nameLib, validation.creator_additional_document, undefined, parentFolder, req.body.username).then(function(res){
            verify_ReturnCreatorAdditionalDocument(req.body, res.Fields.id).then(function(wf){
                const data ={};
                const dfdAr = [];
                if(res.fileInfo.file){
                    data.attachments = res.fileInfo.file.map(item => {
                        return {
                            id: uuidv4(),
                            timePath: item.timePath,
                            locate: item.type,
                            display: item.filename,
                            name: item.named,
                            nameLib: nameLib,
                            folderPath: item.folderPath,
                            username: req.body.username
                        }
                    })
                }
                const event = {
                    id: uuidv4(),
                    time: d.getTime(),
                    action: 'creator_additional_document',
                    username: req.body.username,
                    note: res.Fields.note,
                };
                dfdAr.push(BriefCaseService.update_addtional_document(
                    req.body._service[0].dbname_prefix,
                    req.body.username,
                    res.Fields.waiting_archive_id,
                    event,
                    data.attachments
                ));
                const node = -1;
                const play_now = [];
                const status = WORKFLOW_PLAY_STATUS.COMPLETED;

                dfdAr.push(WorkflowPlayService.creator_additional_document(
                    req.body._service[0].dbname_prefix,
                    req.body.username,
                    res.Fields.id,
                    event,
                    play_now,
                    status,
                    node,
                ));

                q.all(dfdAr).then(function(res){
                    dfd.resolve(true);
                    try{

                        const rule = ARCHIVE_RULE.MANGEMENT;
    
                        const filter = genFilterGetUsersByRule(rule);
                        
                        notify(req, filter, 'workflow_need_approve',{
                            workflowId: wf._id.toString(),
                            title: wf.title,
                            actionBy: req.body.username,
                            username_creator: wf.username,
                            action: 'add_done',
                            document_type: wf.document_type,
                            code: wf.code,
                            departmentBy: req.body.session.department
                        }, 'approveWorkflowPlay');
                    }catch(e){
                        console.log(e);
                    }

                    

                }, function(err){
                    dfd.reject(err);
                })

                dfd.resolve(true);

            }, function(err){
                dfd.reject(err);
            })
            
            
        }, function(err){
            console.error(err);
            dfd.reject(err);
        })


        return dfd.promise;
    }

    return(request) {
        const dfd = q.defer();
        const currentUser = request.body.session;
        const dbNamePrefix = request.body._service[0].dbname_prefix;
        const d = new Date();

        let entity;

        FileProvider.upload(request, nameLib, undefined, undefined, parentFolder, currentUser.username)
            .then((formData) => {
                entity = generateReturnEntity(formData);
                return WorkflowPlayService.return(
                    dbNamePrefix,
                    currentUser.username,
                    entity.id,
                    entity.comment,
                    entity.note,
                    entity.relatedfile,
                );
            })
            .then((data) => {
                dfd.resolve(true);
                let currentActor = data.event[data.event.length - 1].username;

                // Update the status of WF to these signed persons
                let usernameHadApproved = data.event.map((event) => event.username);
                usernameHadApproved = Array.from(new Set(usernameHadApproved));
                usernameHadApproved = usernameHadApproved.filter(
                    (per) => per !== data.username && per !== currentActor,
                );


                if (usernameHadApproved.length > 0) {
                    RingBellItemService.insert(
                        dbNamePrefix,
                        currentUser.username,
                        'workflow_returned',
                        {
                            workflowId: entity.id.toString(),
                            title: data.title,
                            actionBy: currentActor,
                            createdBy: data.username,
                            code:data.code
                        },
                        usernameHadApproved,
                        [],
                        'returnWorkflowPlay',
                        d.getTime(),
                    );
                }

                // Notify to the creator to get approval again
                let usernameToNotify = [];
                for (const player of data.play_now) {
                    usernameToNotify.push(player.username);
                }
                RingBellItemService.insert(
                    dbNamePrefix,
                    currentUser.username,
                    'workflow_returned_creator',
                    {
                        workflowId: entity.id.toString(),
                        title: data.title,
                        actionBy: currentActor,
                        code:data.code
                    },
                    usernameToNotify,
                    [],
                    'returnWorkflowPlay',
                    d.getTime()
                );

            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    removeAttachment(body) {
        let dfd = q.defer();
        WorkflowPlayService.loadDetails(body._service[0].dbname_prefix, body.username, body.id).then(function (data) {
            let fileInfo = {};
            for (var i in data.attachment) {
                if (data.attachment[i].name === body.filename) {
                    fileInfo = data.attachment[i];
                }
            }
            if (fileInfo.name) {
                const fullPath = body._service[0].dbname_prefix + "/" + folderArray.join('/') + '/' + nameLib + '/' + body.username + '/' + body.filename;

                WorkflowPlayService.removeAttachment(body._service[0].dbname_prefix, body.username, body.id, body.filename, {
                    timePath: getCurrentDate(),
                    fullPath: fullPath,
                }).then(function () {
                    dfd.resolve(true);
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
            } else {
                dfd.reject({ path: "WorkflowPlayController.removeAttachment.FileIsNull", mes: "FileIsNull" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    removeRelatedFile(body) {
        let dfd = q.defer();
        WorkflowPlayService.loadDetails(body._service[0].dbname_prefix, body.username, body.id).then(function (data) {
            let fileInfo = {};
            for (var i in data.relatedfile) {
                if (data.relatedfile[i].name === body.filename) {
                    fileInfo = data.relatedfile[i];
                }
            }
            if (fileInfo.name) {
                const fullPath = body._service[0].dbname_prefix + "/" + folderArray.join('/') + '/' + nameLib + '/' + body.username + '/' + body.filename;

                WorkflowPlayService.removeRelatedFile(body._service[0].dbname_prefix, body.username, body.id, body.filename, {
                    timePath: getCurrentDate(),
                    fullPath: fullPath,
                }).then(function () {
                    dfd.resolve(true);
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
            } else {
                dfd.reject({ path: "WorkflowPlayController.removeRelatedFile.FileIsNull", mes: "FileIsNull" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    pushAttachment(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.pushAttachment, undefined, parentFolder, req.body.username).then(function (res) {
            if (res.Files[0]) {
                WorkflowPlayService.pushAttachment(req.body._service[0].dbname_prefix, req.body.username, res.Fields.id,
                    {
                        timePath: res.Files[0].timePath,
                        locate: res.Files[0].type,
                        display: res.Files[0].filename,
                        name: res.Files[0].named,
                        nameLib
                    }).then(function () {
                        dfd.resolve({
                            timePath: res.Files[0].timePath,
                            locate: res.Files[0].type,
                            display: res.Files[0].filename,
                            name: res.Files[0].named,
                            nameLib
                        });
                    }, function (err) {
                        dfd.reject(err);
                    });
            } else {
                dfd.resolve(true);
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            req = undefined;
        });

        return dfd.promise;
    }

    pushRelatedFile(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.pushRelatedFile, undefined, parentFolder, req.body.username).then(function (res) {
            if (res.Files[0]) {
                WorkflowPlayService.pushRelatedFile(req.body._service[0].dbname_prefix, req.body.username, res.Fields.id,
                    {
                        timePath: res.Files[0].timePath,
                        locate: res.Files[0].type,
                        display: res.Files[0].filename,
                        name: res.Files[0].named,
                        nameLib
                    }).then(function () {
                        dfd.resolve({
                            timePath: res.Files[0].timePath,
                            locate: res.Files[0].type,
                            display: res.Files[0].filename,
                            name: res.Files[0].named,
                            nameLib
                        });
                    }, function (err) {
                        dfd.reject(err);
                    });
            } else {
                dfd.resolve(true);
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            req = undefined;
        });

        return dfd.promise;
    }

    resubmit(req) {
        const dfd = q.defer();

        const d = new Date();
        const dbPrefix = req.body._service[0].dbname_prefix;
        const currentUser = req.body.session;

        let entity;
        let workflowDetail;
        let workflowPlayDetail;

        FileProvider.upload(
            req,
            nameLib,
            undefined,
            undefined,
            parentFolder,
            req.body.username,
        )
            .then((formData) => {
                entity = generateResubmitEntity(formData, req.body.username);
                return WorkflowPlayService.loadDetails(
                    dbPrefix,
                    currentUser.username,
                    entity.id,
                );
            })
            .then((data) => {
                if (!data) {
                    dfd.reject({
                        path: 'WorkflowPlayController.resubmit.err',
                        mes: 'NotFoundWorkflowPlay',
                    });
                    return;
                }
                workflowPlayDetail = data;
                return WorkflowService.load_details(
                    dbPrefix,
                    data.flow_info._id,
                );
            })
            .then((workflow) => {
                if (!workflow) {
                    dfd.reject({
                        path: 'WorkflowPlayController.resubmit.err',
                        mes: 'NotFoundWorkflow',
                    });
                    return;
                }
                workflowDetail = workflow;

                if (!workflowDetail.allow_appendix && entity.appendix.length > 0) {
                    return dfd.reject({
                        path: 'WorkflowPlayController.insert.err',
                        mes: 'WorkflowNotAllowToUploadAppendix',
                    });
                }

                if (workflowPlayDetail.workflowFileType === WORKFLOW_FILE_TYPE.CUSTOM_TEMPLATE) {
                    return q.resolve(null);
                } else {
                    return validateTagsInAttachments(entity.attachment, workflowDetail);
                }
            })
            .then(() => {
                if (workflowDetail.file_type === WORKFLOW_FILE_TYPE.CUSTOM_TEMPLATE) {
                    return processTemplateFile(dbPrefix, workflowDetail, entity.tags_value, currentUser);
                } else {
                    return processUploadedFiles(dbPrefix, workflowDetail, currentUser, entity.attachment);
                }
            })
            .then((fileInfo) => {
                if (workflowDetail.file_type === WORKFLOW_FILE_TYPE.CUSTOM_TEMPLATE) {
                    entity.attachment = [fileInfo.attachment];
                    entity.originAttachment = [fileInfo.templateFile];
                } else if (
                    workflowDetail.file_type === WORKFLOW_FILE_TYPE.FILE_UPLOAD
                ) {
                    entity.attachment = fileInfo;
                    entity.originAttachment = entity.attachment;
                }
                const signatureTags = workflowUtil.getTemplateTagFromWorkflow(
                    workflowDetail,
                    {
                        includeTagTypes: [
                            CUSTOM_TEMPLATE_TAG_TYPE.SIGNATURE,
                            CUSTOM_TEMPLATE_TAG_TYPE.QUOTATION_MARK,
                        ],
                    },
                );
                const relatedFiles = mergeRelatedFiles(
                    workflowPlayDetail.relatedfile,
                    entity.relatedfile,
                    entity.preserve_relatedfile,
                );

                const appendix = mergeAppendixFiles(
                    workflowPlayDetail.appendix,
                    entity.appendix,
                    entity.preserve_appendix,
                );

                const event = {
                    username: req.body.username,
                    action: 'Resubmit',
                    time: d.getTime(),
                    comment: entity.comment,
                };
                return WorkflowPlayService.resubmit(
                    dbPrefix,
                    currentUser.username,
                    entity.id,
                    entity.title,
                    entity.attachment,
                    entity.originAttachment,
                    relatedFiles,
                    signatureTags,
                    entity.tags_value,
                    event,
                    appendix,
                );
            })
            .then((data) => {
                dfd.resolve(true);
                let usernameToNotify = [];
                for (const player of data.play_now) {
                    usernameToNotify.push(player.username);
                }
                const currentNode = data.flow[data.node - 1];
                RingBellItemService.insert(
                    req.body._service[0].dbname_prefix,
                    req.body.username,
                    'workflow_need_approve',
                    {
                        workflowId: workflowPlayDetail._id.toString(),
                        title: data.title,
                        username_creator: data.username,
                        action: currentNode.type,
                        code:data.code
                    },
                    usernameToNotify,
                    [],
                    'approveWorkflowPlay',
                    d.getTime(),
                );
            })
            .catch(function (error) {
                return dfd.reject({
                    path: 'WorkflowPlayController.resubmit.err',
                    mes: 'ProcessResubmitError',
                });
            });
        return dfd.promise;
    }

    getUserInFlow(body) {
        return WorkflowPlayService.getUserInFlow(body._service[0].dbname_prefix, body.flow);
    }

    signAfile(body) {
        let dfd = q.defer();
        validateForSign(body._service[0].dbname_prefix, body.username, body.id, body.filename).then(function (data) {
            bindSignatureToFile(data.zip, body.username, body._service[0].dbname_prefix, body.userId, data.data, body.filename).then(function (signIndfo) {
                FileProvider.uploadByBuffer(body._service[0].dbname_prefix, signIndfo.buffer, nameLib, data.data.username, data.originalFileDisplay, undefined, parentFolder).then(function (fileInfo) {
                    let event = { username: body.username, action: "Signed", time: new Date().getTime(), filename: data.originalFileDisplay };
                    try {
                        WorkflowPlayService.signAFile(body._service[0].dbname_prefix, body.username, body.id, body.filename, event, {
                            username: body.username,
                            timePath: fileInfo.timePath,
                            locate: fileInfo.type,
                            display: fileInfo.filename,
                            name: fileInfo.named,
                            nameLib,
                            signPath: signIndfo.imageFilePath
                        }).then(function () {

                            WorkflowPlayService.loadDetails(body._service[0].dbname_prefix, body.username, body.id).then(function (detailsData) {
                                dfd.resolve(detailsData);
                            }, function (err) {
                                dfd.reject(err);
                            });
                        }, function (err) {
                            dfd.reject(err);
                        });
                    } catch (error) {
                        console.log(error);
                    }

                }, function (err) {
                    dfd.reject(err);
                });
            }, function (err) { dfd.reject(err) });

        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    download(body) {
        let dfd = q.defer();

        WorkflowPlayService.loadDetails(body._service[0].dbname_prefix, body.username, body.id).then(function (data) {
            const dbPrefix = body._service[0].dbname_prefix;
            let checkPermission = true;
            let checkFile = false;
            let fileInfo = {};
            let owner = data.username;


            for (let i in data.attachment) {
                if (data.attachment[i].name === body.filename) {
                    checkFile = true;
                    break;
                }
            }

            for (let i in data.relatedfile) {
                if (data.relatedfile[i].name === body.filename) {
                    checkFile = true;
                    break;
                }
            }

            for (let i in data.appendix || []) {
                if (data.appendix[i].name === body.filename) {
                    checkFile = true;
                    break;
                }
            }

            for (let event of data.event) {
                if ((event.relatedfile || []).some((ele) => ele.name === body.filename)) {
                    checkFile = true;
                    owner = event.username;
                    break;
                }
            }

            if (checkPermission) {
                if (checkFile) {
                    FileProvider.download(`${dbPrefix}/${parentFolder}/${nameLib}/${owner}/${body.filename}`).then(
                        (url) => {
                            dfd.resolve(url);
                            url = undefined;
                        },
                        (error) => {
                            dfd.reject(error);
                            error = undefined;
                        },
                    );
                } else {
                    dfd.reject({ path: 'WorkflowPlayController.download.FileIsNotExists', mes: 'FileIsNotExists' });
                }
                body = undefined;
                checkPermission = undefined;
                checkFile = undefined;

            } else {
                dfd.reject({ path: "WorkflowPlayController.download.NotPermission", mes: "NotPermission" });
                body = undefined;
                checkPermission = undefined;
                checkFile = undefined;
                fileInfo = undefined;
            }
        }, function (err) {
            dfd.reject(err);
            body = undefined;
        });

        return dfd.promise;
    }

    signWorkflow(dbPrefix, currentActor, workflowSignId, fileName) {
        const dfd = q.defer();
        const employee = currentActor.employee_details;

        let signatureTags = [];
        let tagNeedToSign = [];
        let attachment;
        let fileNeedToSign;
        let workflowPlayUsername;

        WorkflowPlayService.loadDetails(
            dbPrefix,
            currentActor.username,
            workflowSignId,
        )
            .then((workflowPlay) => {
                signatureTags = workflowPlay.signatureTags;
                attachment = workflowPlayUtil.getAttachmentsInWorkflowPlay(workflowPlay);
                workflowPlayUsername = workflowPlay.username;

                fileNeedToSign = workflowPlayUtil.getAttachmentInWorkflowPlayByFileName(workflowPlay, fileName);
                if (!fileNeedToSign) {
                    return dfd.reject({
                        path: 'WorkflowPlayController.signWorkflow.err',
                        mes: 'NotFoundFileNeedToSign',
                    });
                }
                const currentNode = workflowPlayUtil.getCurrentNodeOfWorkflowPlay(workflowPlay);
                if (!currentNode) {
                    return dfd.reject({
                        path: 'WorkflowPlayController.signWorkflow.err',
                        mes: 'NotFoundCurrentNode',
                    });
                }

                const validateResult = workflowPlayUtil.validateSignerCanSignNode(
                    currentActor,
                    currentNode,
                    signatureTags,
                );
                if (!validateResult.isCanSign) {
                    return dfd.reject({
                        path: 'WorkflowPlayController.signWorkflow.err',
                        mes: 'YouCanNotSignThisNode',
                    });
                }
                if (validateResult.isSigned) {
                    return dfd.reject({
                        path: 'WorkflowPlayController.signWorkflow.err',
                        mes: 'YouHadSignedThisNode',
                    });
                }

                tagNeedToSign = workflowPlayUtil.getTagsNeedSignInNode(
                    currentActor,
                    currentNode,
                    signatureTags,
                );
                return templateUtil.resolveTemplateTag(
                    dbPrefix,
                    tagNeedToSign,
                    {},
                    employee,
                );
            })
            .then((processedTags) => {
                return processDocumentTags(
                    dbPrefix,
                    workflowPlayUsername,
                    fileNeedToSign,
                    processedTags,
                );
            })
            .then((fileInfo) => {
                const event = {
                    username: currentActor.username,
                    action: 'Signed',
                    time: new Date().getTime(),
                    filename: fileInfo.filename,
                };
                signatureTags.forEach((tag) => {
                    const tagFounded = tagNeedToSign.find(
                        (tagNeedToSign) => tagNeedToSign.name === tag.name,
                    );
                    if (tagFounded) {
                        tag.isSigned = true;
                        if (!tagFounded.skip) {
                            tag.signedBy = {
                                username: currentActor.username,
                                time: new Date().getTime(),
                            };
                        }
                    }
                });
                attachment.forEach((file) => {
                    if (file.name === fileNeedToSign.name) {
                        Object.assign(file, {
                            display: fileInfo.display,
                            name: fileInfo.name,
                            type: fileInfo.type,
                            folder: fileInfo.folder,
                        });
                        file.sign = (fileNeedToSign.sign || []);
                        file.sign.push({
                            username: currentActor.username,
                            time: new Date().getTime(),
                        });
                    }
                });

                return WorkflowPlayService.updateWorkflowPlayAfterSigned(
                    dbPrefix,
                    currentActor.username,
                    workflowSignId,
                    attachment,
                    signatureTags,
                    event,
                );
            })
            .then(() => {
                dfd.resolve(true);
            })
            .catch((e) => {
                dfd.reject({
                    path: 'WorkflowPlayController.signWorkflow.err',
                    mes: 'Process sign workflow error',
                });
            });

        return dfd.promise;
    }

    complete(dbNamePrefix, currentUser, req) {
        const dfd = q.defer();
        let entity;

        FileProvider.upload(req, nameLib, undefined, undefined, parentFolder, currentUser.username)
            .then(function (formData) {
                entity = generateApprovalEntity(formData, currentUser.username);
                return WorkflowPlayService.complete(
                    dbNamePrefix,
                    currentUser.username,
                    entity.id,
                    entity.comment,
                    entity.relatedfile,
                );
            })
            .then(function (data) {
                dfd.resolve(data);
            })
            .catch(function (error) {
                dfd.reject(error);
            });
        return dfd.promise;
    }

}

exports.WorkflowPlayController = new WorkflowPlayController();
