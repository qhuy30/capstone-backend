
const { FileInterface } = require('./file.interface');
const { SharepointProvider } = require('../office365/sharepoint.provider');
const q = require('q');
const trycatch = require('trycatch');
const { gcpProvider } = require('../store/gcp/gcp.provider');
const { FileConst } = require('./file.const');

const uploadSharepoint = function (req, nameLib, Files) {
    let dfd = q.defer();
    trycatch(function () {
        SharepointProvider.uploadFile(req.body.session, nameLib, Files).then(function () {
            dfd.resolve(Files);
            dfd = undefined;
            req = undefined;
            Files = undefined;
            nameLib = undefined;
        }, function (err) {
            dfd.reject(err);
            req = undefined;
            Files = undefined;
            nameLib = undefined;
        });
    }, function (err) {
        dfd.reject({ path: "FileProvider.uploadSharepoint.trycatch", err: err.stack });
        Files = undefined;
        nameLib = undefined;
    });
    return dfd.promise;
}

const setUndefinedForFileData = function (files) {
    for (let i in files) {
        delete files[i].data;
    }
    return files;
}
const setUndefinedForFileInfoData = function (files) {
    for (let i in files) {
        for (var j in files[i]) {
            delete files[i][j].data;
        }

    }
    return files;
}

const setPathBucket = function (dbname_prefix, folderArray, nameLib, nameFile, userName) {
    let basePath = '';
    let dfd = q.defer();
    userName = userName ? userName + '/' : '';
    if (nameFile) {
        let fileExtension = nameFile.substring(nameFile.lastIndexOf('.') + 1);
        if (fileExtension === 'doc' || fileExtension === 'docx' || fileExtension === 'xls' || fileExtension === 'xlsx' ||
        fileExtension === 'ppt' || fileExtension === 'pptx') {
            const folderPath = folderArray.join('/');
            gcpProvider
                .makeFilePublic(dbname_prefix + '/' + folderPath + '/' + nameLib + '/' + userName + nameFile)
                .then(
                    (res) => {
                        basePath = res;
                        dfd.resolve(basePath);
                        res = undefined;
                        basePath = undefined;
                        fileExtension = undefined;
                    },
                    (err) => {
                        dfd.reject(err);
                        err = undefined;
                        basePath = undefined;
                        fileExtension = undefined;
                    }
                )
                .then(
                    () => {
                        setTimeout(() => {
                            gcpProvider.makeFilePrivate(dbname_prefix + '/' + folderPath + '/' + nameLib + '/' + userName + nameFile)
                            .then(
                                (res) => {
                                    res = undefined;
                                    folderPath = undefined;
                                    nameFile = undefined;
                                    userName = undefined;
                                },
                                (err) => {
                                    console.log(err);
                                    gcpProvider.makeFilePrivate(dbname_prefix + '/' + folderPath + '/' + nameLib + '/' + userName + nameFile);
                                    userName = undefined;
                                    nameFile = undefined;
                                }
                            );
                        }, 5000);
                    }
                )
        } else {
            const folderPath = folderArray.join('/');            
            if (FileConst.modeProduction === 'development') {
                let imgUrl = bname_prefix + '/' + folderPath + '/' + nameLib + '/' + userName + nameFile;
                dfd.resolve(imgUrl);
            } else {
                gcpProvider.getSignedUrl(dbname_prefix + '/' + folderPath + '/' + nameLib + '/' + userName + nameFile).then(
                    (res) => {
                        basePath = res;
                        dfd.resolve(basePath);
                        res = undefined;
                        basePath = undefined;
                        folderPath = undefined;
                        nameFile = undefined;
                        userName = undefined;
                    },
                    (err) => {
                        dfd.reject(err);
                        err = undefined;
                        basePath = undefined;
                        folderPath = undefined;
                        nameFile = undefined;
                        userName = undefined;
                    }
                );
            }   
        }        
    } else {
        dfd.resolve(basePath);
    }
    return dfd.promise;
}

class FileProvider {
    constructor() {}
    upload(req, nameLib, validateSchema, thePath, parentFolder, usernameStatic) {
        let dfd = q.defer();
        trycatch(
            function () {
                let d = new Date();
                let timePath;
                let timeName = d.getTime();
                let dbNamePrfix = req.body._service[0].dbname_prefix;
                // thePath = "/" + req.body._service[0].dbname_prefix + thePath;
                if (usernameStatic) {
                    let month = d.getMonth() > 8 ? d.getMonth() + 1 : '0' + (d.getMonth() + 1);
                    let date = d.getDate() > 9 ? d.getDate() : '0' + d.getDate();
                    timePath = '/' + usernameStatic + '/' + d.getFullYear() + '_' + month + '_' + date;
                } else {
                    let username = req.body && req.body.username ? req.body.username : 'system';
                    let month = d.getMonth() > 8 ? d.getMonth() + 1 : '0' + (d.getMonth() + 1);
                    let date = d.getDate() > 9 ? d.getDate() : '0' + d.getDate();
                    timePath = '/' + username + '/' + d.getFullYear() + '_' + month + '_' + date;
                }

                let newNameLib = nameLib ? nameLib + '/' : '';
                if (newNameLib && newNameLib.charAt(0) === '/') newNameLib = newNameLib.slice(1);

                let newThepath = thePath ? thePath + '/' : '';
                if (newThepath && newThepath.charAt(0) === '/') newThepath = newThepath.slice(1);

                let newFolder = parentFolder ? parentFolder + '/' : '';
                if (newFolder && newFolder.charAt(0) === '/') newFolder = newFolder.slice(1);
                let newUserName = usernameStatic ? usernameStatic : '';
                FileInterface.analyze(
                    req,
                    timePath,
                    timeName,
                    validateSchema,
                    newNameLib,
                    newThepath,
                    newFolder,
                    newUserName,
                    dbNamePrfix
                ).then(
                    function (res) {
                        let locateSharepoint = [];
                        let locateLocal = [];

                        for (let i in res.Files) {
                            if (!res.Files[i].huge) {
                                if (res.Files[i].type === 'http') {
                                    locateSharepoint.push(res.Files[i]);
                                } else {
                                    locateLocal.push(res.Files[i]);
                                }
                            }
                        }

                        if (locateSharepoint.length > 0) {
                            uploadSharepoint(req, nameLib, locateSharepoint).then(
                                function () {
                                    res.Files = setUndefinedForFileData(res.Files);
                                    res.fileInfo = setUndefinedForFileInfoData(res.fileInfo);
                                    dfd.resolve(res);
                                    req = undefined;
                                    nameLib = undefined;
                                    locateSharepoint = undefined;
                                    locateLocal = undefined;
                                    res = undefined;
                                    validateSchema = undefined;
                                    thePath = undefined;
                                },
                                function (err) {
                                    dfd.reject(err);
                                    let obj = new FileProvider();
                                    obj.rollback(locateLocal);
                                    obj = undefined;
                                    req = undefined;
                                    nameLib = undefined;
                                    locateSharepoint = undefined;
                                    locateLocal = undefined;
                                    res = undefined;
                                    validateSchema = undefined;
                                    thePath = undefined;
                                }
                            );
                        } else {
                            res.Files = setUndefinedForFileData(res.Files);
                            res.fileInfo = setUndefinedForFileInfoData(res.fileInfo);
                            dfd.resolve(res);
                            req = undefined;
                            nameLib = undefined;
                            locateSharepoint = undefined;
                            locateLocal = undefined;
                            res = undefined;
                            validateSchema = undefined;
                            thePath = undefined;
                        }
                    },
                    function (err) {
                        dfd.reject(err);
                        err = undefined;
                        req = undefined;
                        nameLib = undefined;
                        validateSchema = undefined;
                        thePath = undefined;
                    }
                );
            },
            function (err) {
                dfd.reject({ path: 'FileProvider.upload.trycactch', err: err.stack });
                req = undefined;
                nameLib = undefined;
                validateSchema = undefined;
                thePath = undefined;
            }
        );
        return dfd.promise;
    }

    rollback(dbname_prefix, Files) {
        let dfd = q.defer();
        trycatch(
            function () {
                let dfdAr = [];
                for (let i in Files) {
                    dfdAr.push(FileInterface.delete('/' + dbname_prefix + Files[i].timePath + '/' + Files[i].named));
                }
                q.all(dfdAr).then(
                    function () {
                        dfd.resolve(Files);
                    },
                    function (err) {
                        dfd.reject(err);
                        LogProvider.warn(err, 'FileProvider.rollback.deleteFiles', 'service', '', { Files });
                        Files = undefined;
                    }
                );
            },
            function (err) {
                dfd.reject({ path: 'FileProvider.rollback.trycatch', err: err.stack });
                Files = undefined;
            }
        );
        return dfd.promise;
    }

    loadFile(dbname_prefix, session, nameLib, nameFile, timePath, locate, folder, userName) {
        let dfd = q.defer();
        // TODO:
        // if (locate === 'local') {

        if (FileConst.modeProduction === 'development') {
            userName = userName ? userName + '/' : '';
            const folderPath = folder.join('/');             

            let pathBucket = FileConst.tenantDomain + '/files/' + dbname_prefix + '/' + folderPath + '/' + nameLib + '/' + userName + nameFile;
            dfd.resolve({
                type: 'local',
                url: pathBucket,
            });
        } else {
            setPathBucket(dbname_prefix, folder, nameLib, nameFile, userName).then(
                (res) => {
                    let pathBucket = res;
                    dfd.resolve({
                        type: 'local',
                        url: pathBucket,
                    });
                },
                (err) => {
                    dfd.reject(err);
                }
            );
        }
        // } else {
        //     SharepointProvider.loadFile(session, nameLib, nameFile).then(
        //         function (data) {
        //             dfd.resolve({
        //                 type: 'http',
        //                 url: data.embedUri,
        //                 id: data.id,
        //                 guid: data.guid,
        //             });
        //         },
        //         function (err) {
        //             dfd.reject(err);
        //         }
        //     );
        // }
        
        return dfd.promise;
    }

    delete(dbname_prefix, session, nameLib, Files, userName, folderArray) {
        let dfd = q.defer();
        trycatch(
            function () {
                let dfdAr = [];
                for (let i in Files) {
                    if (Files[i].locate === 'local') {
                        const folderPath = folderArray.join('/');
                        const filePath =
                            dbname_prefix + '/' + folderPath + '/' + nameLib + '/' + userName + '/' + Files[i].name;
                        dfdAr.push(FileInterface.delete(filePath));
                    }
                    if (Files[i].locate === 'http') {
                        dfdAr.push(SharepointProvider.deleteFile(session, Files[i].nameLib, Files[i].name));
                    }
                }
                q.all(dfdAr).then(
                    function () {
                        dfd.resolve(true);
                        session = undefined;
                        nameLib = undefined;
                        Files = undefined;
                        dfdAr = undefined;
                    },
                    function (err) {
                        dfd.reject(err);
                        err = undefined;
                        session = undefined;
                        nameLib = undefined;
                        Files = undefined;
                        dfdAr = undefined;
                    }
                );
            },
            function (err) {
                console.log(err.stack);
                dfd.reject({ path: 'FileProvider.delete.trycactch', err: err.stack });
                err = undefined;
                session = undefined;
                nameLib = undefined;
                Files = undefined;
            }
        );
        return dfd.promise;
    }

    getField(req, validateSchema) {
        return FileInterface.getField(req, validateSchema);
    }

    uploadByBuffer(dbname_prefix,buffer,nameLib,username,filename,thePath, parentFolder ){
        let dfd  = q.defer();
        const filenameFormated =  filename.replace(/\s/g, "_");
        FileInterface.upload(buffer,new Date().getTime(),nameLib,thePath, parentFolder,username,dbname_prefix,filenameFormated).then(function(fileNamed){
            dfd.resolve({
                nameLib,
                named: fileNamed,
                filename,
                type:"http",
                timePath: ""
            });
        },function(err){
            dfd.reject(err);
        });
        return dfd.promise;
    }

    download(url) {
        if (FileConst.modeProduction === 'development') {
            return new Promise((resolve, reject) => {
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']; 

                const fileExtension = url.toLowerCase().slice(-4); 
                let imgUrl = '';
                if (imageExtensions.includes(fileExtension)) {
                    imgUrl = FileConst.tenantDomain + '/fileDownload/' + url;
                } else {
                    imgUrl = FileConst.tenantDomain + '/files/' + url;
                    imgUrl += '?response-content-disposition=attachment';
                }
                resolve(imgUrl);
            });
        } else {
            return gcpProvider.getSignedUrl(url, undefined, { responseDisposition: 'attachment' });
        }
    }

    downloadBuffer(filename) {
        if (FileConst.modeProduction === 'development') {
            return FileInterface.downloadLocalBuffer(filename);
        } else {
            return FileInterface.download(filename);
        }
    }

    getAllFilesFromRequest(request) {
        return FileInterface.getAllFilesFromRequest(request);
    }

    makeFilePublic(filePath) {
        if (FileConst.modeProduction === 'development') {
            const host = FileConst.tenantDomain + '/files/';
            return q.resolve(host + filePath);
        } else {
            return gcpProvider.makeFilePublic(filePath);
        }
    }

}

exports.FileProvider = new FileProvider();
