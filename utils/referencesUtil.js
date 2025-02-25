const { LogProvider } = require("@shared/log_nohierarchy/log.provider");
exports.groupReferences = function (references, options = {}) {
    const { fieldTypeName = "type", fieldKeyName = "object", fieldValueName = "value" } = options;
    const flattened = {};
    if (!Array.isArray(references)) return flattened;

    for (const reference of references) {
        switch (reference[fieldTypeName]) {
            case "object":
                flattened[reference[fieldKeyName]] = reference[fieldValueName];
                break;
            case "array":
                if (!Array.isArray(flattened[fieldValueName])) {
                    flattened[reference[fieldKeyName]] = [reference[fieldValueName]];
                } else {
                    flattened[reference[fieldKeyName]].push(reference[fieldValueName]);
                }
                break;
            default:
                LogProvider.warn("Not supported type: " + reference[fieldTypeName]);
                break;
        }
    }

    return flattened;
};
