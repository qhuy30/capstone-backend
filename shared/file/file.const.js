const settings = require('../../utils/setting');
const {
    DOMAIN_LOCAL,
    MODE_PRODUCTION,
    TENANT_DOMAIN
} = process.env;

var obj= {
    highWaterMark: 5 * 1024 * 1024,
    fileMime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/pdf", "image/png", "image/jpeg", 
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
         "application/vnd.ms-excel", 
         "application/msword",
         "application/octet-stream",
         "application/octet-stream",
         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
           "application/vnd.ms-excel", 
           "application/msword",
           "image/gif"
    ],
    locateSharepointMime: [],
    locateSharepointType: [],
    pathLocal: (function(){
        let myDirname = __dirname;
        let splitPath; 
        if(MODE_PRODUCTION =="production"){
            splitPath = myDirname.split('/');
        }else{
            splitPath = myDirname.split('\\');
        }
        let uploadPath = "";
        for (var i = 0; i < splitPath.length;i++ ){

            if(splitPath[i] === settings.folderName){
                break;
            }else{
                uploadPath += splitPath[i] + "/";
            }
            
        }
        uploadPath += "tenant_uploads";
        return uploadPath;
    })(),
    domainLocal: DOMAIN_LOCAL,
    modeProduction: MODE_PRODUCTION,
    tenantDomain: TENANT_DOMAIN
};

exports.FileConst = obj;