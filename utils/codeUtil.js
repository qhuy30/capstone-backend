const TAG_REGEX = /(\{(?<tagName>\w+)\})+/;

const COMMON_HANDLERS = {
    year: resolveYear,
    day: resolveDate,
};

exports.resolvePattern = function (pattern, object = {}) {
    let text = pattern;
    while (TAG_REGEX.test(text)) {
        const result = TAG_REGEX.exec(text);
        const tagName = result.groups.tagName;

        if (object[tagName]) {
            text = resolveValue(text, tagName, object[tagName]);
            continue;
        }

        if (COMMON_HANDLERS[tagName]) {
            text = COMMON_HANDLERS[tagName](text);
            continue;
        }

        text = resolveValue(text, tagName, '');
    }
    return text;
};

function resolveValue(str, tagName, value) {
    return str.replace(`{${tagName}}`, value);
}

function resolveYear(str, value) {
    if (!value) {
        value = new Date().getFullYear();
    }
    return str.replace('{year}', value);
}

function resolveDate(str, value) {
    if (!value) {
        value = new Date().getDate();
    }
    return str.replace('{date}', value);
}

exports.removeAccents = function (str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}
