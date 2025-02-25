const { DEFAULT_PASSWORD, HOST_NAME, HOST_DOMAIN, PORT, SOCKET_HOST, ADMIN_DOMAIN, FOLDER_NAME, SECRET_SESSION } =
    process.env;

var obj = {
    modeProduction: "production",
    defaultPassword: DEFAULT_PASSWORD,
    hostname: HOST_NAME,
    hostDomain: HOST_DOMAIN,
    port: PORT,
    socketHost: SOCKET_HOST,
    adminDomain: ADMIN_DOMAIN,
    folderName: FOLDER_NAME,
    secretSession: SECRET_SESSION,
    windowms: 15 * 60 * 1000,
    maxRequestPerIp: 100,
    statusHTTP: {
        internalServer: 500,
        forbidden: 403,
        authorized: 401,
        notFound: 404,
        notPermission: 401,
        unknownError: 520,
        outOfDate: 401,
        maintenance: 401,
        unregistered: 401,
        badRequest: 400,
    },
    messageHTTP: {
        internalServer: "FailureAction",
        forbidden: "Forbidden",
        authorized: "Unauthorized",
        notFound: "NotFound",
        notPermission: "NotPermission",
        unknownError: "UnknownError",
        outOfDate: "YourServiceIsOutOfDate",
        maintenance: "YourServiceIsMaintaining",
        unregistered: "YourServiceIsUnregistered",
    },
    signatureDimension: {
        width: 180,
        height: 70,
    },
    quotationMarkDimension: {
        width: 50,
        height: 17,
    },
};

module.exports = obj;
