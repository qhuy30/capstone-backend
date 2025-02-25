const q = require('q');
const PizZip = require('pizzip');
const DocxTemplater = require('docxtemplater');
const InspectModule = require('docxtemplater/js/inspect-module');
const bufferImageSize = require('buffer-image-size');

const { LogProvider } = require('../shared/log_nohierarchy/log.provider');
const { FileProvider } = require('../shared/file/file.provider');

const EmployeeUtil = require('./employeeUtil');
const { UserService } = require('../app/management/user/user.service');
const { OrganizationService } = require('../app/office/organization/organization.service');
const { EmployeeService } = require('../app/office/human/employee/service');
const { ODBController } = require('../app/office/outgoing_dispatch/controller');

const settings = require('./setting');
const { CUSTOM_TEMPLATE_TAG_TYPE } = require('./constant');

function resolveTemplateTag (
    dbPrefix,
    templateTags,
    tagValues,
    signer,
    options = { skipSignature: false, skipQuotationMark: false , currentLanguage: 'vi-VN', username: '' },
) {
    const dfd = q.defer();
    const object = {};
    q.fcall(() => {})
        .then(() => {
            const promises = [];
            for (const templateTag of templateTags) {
                const tagType = templateTag.type;
                const tagName = templateTag.name;
                const isSkipped = templateTag.skip || false;
                switch (tagType) {
                    case CUSTOM_TEMPLATE_TAG_TYPE.CREATOR_SIGNATURE:
                    case CUSTOM_TEMPLATE_TAG_TYPE.SIGNATURE:
                        promises.push(
                            options.skipSignature || isSkipped
                                ? resolveTextValue(object, tagName, '')
                                : resolveSignature(
                                    object,
                                    tagName,
                                    dbPrefix,
                                    signer,
                                ),
                        );
                        break;

                    case CUSTOM_TEMPLATE_TAG_TYPE.CREATOR_QUOTATION_MARK:
                    case CUSTOM_TEMPLATE_TAG_TYPE.QUOTATION_MARK:
                        promises.push(
                            options.skipQuotationMark || isSkipped
                                ? resolveTextValue(object, tagName, '')
                                : resolveQuotationMark(
                                    object,
                                    tagName,
                                    dbPrefix,
                                    signer,
                                ),
                        );
                    case CUSTOM_TEMPLATE_TAG_TYPE.PICK:
                        if (templateTag.pickKey === 'user') {
                            promises.push(
                                resolveUserValue(dbPrefix, object, tagName, tagValues[tagName])
                            );
                        } else if (templateTag.pickKey === 'department') {
                            promises.push(
                                resolveDepartmentValue(dbPrefix, object, tagName, tagValues[tagName], options.currentLanguage)
                            );
                        } else if (templateTag.pickKey === 'archived_document') {
                            promises.push(
                                resolveArchivedDocumentValue(dbPrefix, object, tagName, tagValues[tagName], options.username)
                            );
                        }

                    default:
                        promises.push(
                            resolveTextValue(
                                object,
                                tagName,
                                tagValues[tagName],
                            ),
                        );
                        break;
                }
            }
            return q.all(promises);
        })
        .then(() => {
            dfd.resolve(object);
        })
        .catch((err) => {
            dfd.reject(err);
        });
    return dfd.promise;
}

function resolveUserValue(dbname_prefix, object, tagName, username = '') {
    const dfd = q.defer();
    q.fcall(() => {
        return q.resolve(UserService.loadDetails(dbname_prefix, username));
    }).then(user => {
        return q.resolve(EmployeeService.loadDetails(dbname_prefix, user.employee));
    }).then(employee => {
        Object.assign(object, { [tagName]: { type: 'text', value: employee.fullname } });
        dfd.resolve(object);
    }).catch((err) => {
        LogProvider.info(
            'Error occur when resolveUserValue. Fallback to text with empty value.',
        );
        LogProvider.error(err.message);
        Object.assign(object, {
            [tagName]: {
                type: 'text',
                value: '',
            },
        });
        dfd.resolve(object);
    });
    return dfd.promise;
}

function resolveDepartmentValue(dbname_prefix, object, tagName, departmentId = '', currentLanguage) {
    const dfd = q.defer();
    q.fcall(() => {
        return OrganizationService.loadDetails(dbname_prefix, departmentId);
    }).then(department => {
        Object.assign(object, { [tagName]: { type: 'text', value: department.title[currentLanguage] } });
        dfd.resolve(object);
    }).catch((err) => {
        LogProvider.info(
            'Error occur when resolveDepartmentValue. Fallback to text with empty value.',
        );
        LogProvider.error(err.message);
        Object.assign(object, {
            [tagName]: {
                type: 'text',
                value: '',
            },
        });
        dfd.resolve(object);
    });;
    return dfd.promise;
}

function resolveArchivedDocumentValue(dbname_prefix, object, tagName, id = '', username) {
    const dfd = q.defer();
    q.fcall(() => {
        return q.resolve(ODBController.loadDetail(dbname_prefix, { username, id }));
    }).then(odb => {
        Object.assign(object, { [tagName]: { type: 'text', value: odb.workflow_play.title } });
        dfd.resolve(object);
    }).catch((err) => {
        LogProvider.info(
            'Error occur when resolveArchivedDocumentValue. Fallback to text with empty value.',
        );
        LogProvider.error(err.message);
        Object.assign(object, {
            [tagName]: {
                type: 'text',
                value: '',
            },
        });
        dfd.resolve(object);
    });
    return dfd.promise;
}

function resolveTextValue (object, tagName, tagValue = '') {
    const dfd = q.defer();
    q.fcall(() => {
        Object.assign(object, { [tagName]: { type: 'text', value: tagValue } });
        dfd.resolve(object);
    });
    return dfd.promise;
}

function resolveSignature (object, tagName, dbPrefix, signer) {
    const dfd = q.defer();
    q.fcall(() => {
        return q.resolve(EmployeeUtil.getSignaturePath(dbPrefix, signer));
    })
        .then((signaturePath) => {
            if (!signaturePath) {
                throw new Error('Signature is empty');
            }
            return FileProvider.downloadBuffer(signaturePath);
        })
        .then((buffer) => {
            return processImageWithDimension(buffer, {
                width: settings.signatureDimension.width,
                height: settings.signatureDimension.height,
            });
        })
        .then((resizedImage) => {
            const jsonObjStr = JSON.stringify(resizedImage);
            Object.assign(object, {
                [tagName]: {
                    type: 'image',
                    value: jsonObjStr,
                },
            });
            dfd.resolve(object);
        })
        .catch((err) => {
            LogProvider.debug(
                'Error occur when resolve signature. Fallback to text with empty value.',
            );
            Object.assign(object, {
                [tagName]: {
                    type: 'text',
                    value: '',
                },
            });
            dfd.resolve(object);
        });
    return dfd.promise;
}

function resolveQuotationMark (object, tagName, dbPrefix, signer) {
    const dfd = q.defer();
    q.fcall(() => {
        return q.resolve(EmployeeUtil.getQuotationMarkPath(dbPrefix, signer));
    })
        .then((quotationMarkPath) => {
            if (!quotationMarkPath) {
                throw new Error('Quotation mark is null');
            }
            return FileProvider.downloadBuffer(quotationMarkPath);
        })
        .then((buffer) => {
            return processImageWithDimension(buffer, {
                width: settings.quotationMarkDimension.width,
                height: settings.quotationMarkDimension.height,
            });
        })
        .then((resizedImage) => {
            const jsonObjStr = JSON.stringify(resizedImage);
            Object.assign(object, {
                [tagName]: {
                    type: 'image',
                    value: jsonObjStr,
                },
            });
            dfd.resolve(object);
        })
        .catch((err) => {
            LogProvider.info(
                'Error occur when resolveQuotationMark. Fallback to text with empty value.',
            );
            LogProvider.error(err.message);
            Object.assign(object, {
                [tagName]: {
                    type: 'text',
                    value: '',
                },
            });
            dfd.resolve(object);
        });
    return dfd.promise;
}

function processImageWithDimension(imageBuffer, { width, height }) {
    return new Promise((resolve, reject) => {
        try {
            const dimension = bufferImageSize(imageBuffer);
            const currentRatio = dimension.width / dimension.height;
            // const newHeight = width / currentRatio;
            const newWidth = height * currentRatio;
            resolve({
                base64Buffer: imageBuffer.toString('base64'),
                width: newWidth,
                height,
            });
        } catch (error) {
            reject(error);
        }
    });
}

function getTagsInTemplate(base64Buffer) {
    try {
        const zip = new PizZip(Buffer.from(base64Buffer, 'base64'));
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
        err.path = 'TemplateUtil.getTagsInTemplate';
        err.mes = errorMessages;
        throw err;
    }
}

module.exports = {
    getTagsInTemplate,
    resolveTemplateTag,
    resolveTextValue,
    resolveSignature,
};
