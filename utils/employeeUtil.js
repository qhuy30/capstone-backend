const path = require('path');

const {} = require('../shared/file/file.interface');
const settings = require('./setting');
const utils = require('./util');

const SIGNATURE_STORAGE_PATH = 'office/human/employee/signature';
const QUOTATION_MARK_STORAGE_PATH = 'office/human/employee/quotation_mark';

function getSignaturePath(dbPrefix, employee) {
    const idCard = employee.idcard || 'undefined';
    const folderName =
        utils
            .removeUnicode(employee.fullname.toLowerCase())
            .replace(/ /g, '_') +
        '_' +
        idCard;

    if (employee.signature) {
        return path.join(
            dbPrefix,
            SIGNATURE_STORAGE_PATH,
            folderName,
            employee.signature.name,
        );
    }

    return null;
}

function getQuotationMarkPath(dbPrefix, employee) {
    const idCard = employee.idcard || 'undefined';
    const folderName =
        utils
            .removeUnicode(employee.fullname.toLowerCase())
            .replace(/ /g, '_') +
        '_' +
        idCard;

    if (employee.quotationMark) {
        return path.join(
            dbPrefix,
            QUOTATION_MARK_STORAGE_PATH,
            folderName,
            employee.quotationMark.name,
        );
    }
    return null;
}

function isUserAsAdmin (user) {
    if (!Array.isArray(user.rule) || user.rule.length === 0) {
        return false;
    }
    return user.rule.some(e => e.rule === "*");
}

module.exports = {
    getSignaturePath,
    getQuotationMarkPath,
    isUserAsAdmin,
};
