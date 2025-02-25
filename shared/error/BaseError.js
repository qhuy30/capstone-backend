const { statusHTTP } = require('../../utils/setting');

class BaseError extends Error {
    static permissionDenied(path) {
        return new BaseError(path, "PermissionDenied", statusHTTP.forbidden);
    }

    static notFound(path, mes = "Not Found") {
        return new BaseError(path, mes, statusHTTP.notFound);
    }

    constructor(path, mes, statusCode = statusHTTP.internalServer) {
        super(mes);
        this.name = "BaseError";
        this.statusCode = statusCode;
        this.path = path;
        this.mes = mes;
    }
}

module.exports = BaseError;
