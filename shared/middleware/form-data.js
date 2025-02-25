const BaseError = require("../error/BaseError");
const { FileProvider } = require("../file/file.provider");
const { LogProvider } = require("../log_nohierarchy/log.provider");

function resolveFormData(nameLib, validateSchema, thePath, parentFolder, usernameStatic = null) {
    return function (request, response, next) {
        if(!usernameStatic) {
            usernameStatic = request.body.session.username;
        }
        FileProvider.upload(request, nameLib, validateSchema, thePath, parentFolder, usernameStatic)
            .then((result) => {
                request.formData = result;
                next();
            })
            .catch((error) => {
                LogProvider.error("Processing form data failed with reason: " + error.message);
                response.status(500).json({ mes: "ProcessingFormDataFailed" });
            });
    };
}

module.exports = resolveFormData;
