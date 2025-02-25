const os = require('os');
const path = require('path');
const { randomFillSync } = require('crypto');
const Buffer = require('buffer').Buffer;

const Busboy = require('busboy');
const { FileConst } = require('./file.const');
const { ValidationProvider } = require('../validation/validation.provider');
const trycatch = require('trycatch');
const q = require('q');
const fs = require('fs-extra');
const { format } = require("util");
const { bucketGoogleCloud } = require('../store/gcp/config');
const func = require('joi/lib/types/func');
const { LogProvider } = require('../log_nohierarchy/log.provider');
const binary = require('joi/lib/types/binary');

function convertFileStreamToBuffer(stream) {
    return new Promise(function (resolve, reject) {
        let chunks = [];
        stream.on('data', function (chunk) {
            chunks.push(chunk);
        });

        stream.on('end', function () {
            resolve(Buffer.concat(chunks));
        });

        stream.on('error', function (error) {
            reject(error);
        });
    });
}

function handleLocalFileUpload(stream, filePath) {
    const dfd = q.defer();
    const directory = path.dirname(filePath);
    const fullDir = `${FileConst.pathLocal}/${directory}`;
    convertFileStreamToBuffer(stream)
        .then(function (buffer) {
            if (!fs.existsSync(fullDir)) {
                try {
                    fs.mkdirpSync(fullDir);
                } catch (e) {
                    throw e;
                }
            }
            fs.writeFileSync(`${FileConst.pathLocal}/${filePath}`, buffer);
            dfd.resolve();
        })
        .catch(dfd.reject);
    return dfd.promise;
}

function handleUploadFileToCloudStorage(stream, filePath, options = {}) {
    const dfd = q.defer();
    const isResumable = options.resumable || false;
    convertFileStreamToBuffer(stream)
        .then(function (buffer) {
            const bucket = bucketGoogleCloud.createBucket();
            const file = bucket.file(filePath, { resumable: isResumable });
            return file.save(buffer);
        })
        .then(function () {
            dfd.resolve();
        })
        .catch(dfd.reject);
    return dfd.promise;
}



class FileInterface {
    constructor() { }

    analyze(req, timePath, timeName, validateSchema, nameLib, thePath, folderName, userName, dbNamePrfix) {
        let dfd = q.defer();
        trycatch(function () {
            let busboy = new Busboy({ headers: req.headers, highWaterMark: FileConst.highWaterMark });
            let Files = [];
            let RelatedFiles = [];
            let fileInfo = {};
            let count = 0;
            let Fields = {};
            let formData = new Map();
            let fieldAr = [];
            let fstream;
            let filePromises = [];
            busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {

                fileInfo[fieldname] = fileInfo[fieldname] || [];
                if (filename.length > 0) {

                    if (FileConst.fileMime.indexOf(mimetype) === -1) {
                        file.resume();
                    } else {
                        count++;
                        var named = filename.substring(0, filename.length - filename.split(".")[filename.split(".").length - 1].length - 1) + "_" + req.body.username + timeName + count + '.' + filename.split(".")[filename.split(".").length - 1];
                        let path = FileConst.pathLocal + thePath + timePath + '/' + named;
                        let folderPath = dbNamePrfix + '/' + folderName + thePath + nameLib + userName;
                        if (folderPath.charAt(folderPath.length - 1) === '/')
                            folderPath = folderPath.slice(0, folderPath.length - 1);

                        if (FileConst.locateSharepointMime.indexOf(mimetype) !== -1) {
                            Files.push({
                                filename,
                                timePath,
                                named,
                                data: [],
                                type: "http",
                                folderPath
                            });
                            fileInfo[fieldname].push({
                                filename,
                                timePath,
                                named,
                                data: [],
                                type: "http",
                                folderPath
                            });
                        } else {
                            Files.push({
                                filename,
                                timePath,
                                named,
                                data: [],
                                type: "local",
                                folderPath
                            });
                            fileInfo[fieldname].push({
                                filename,
                                timePath,
                                named,
                                data: [],
                                type: "local",
                                folderPath
                            });
                            const folder = folderPath + '/' + named;
                            let promise;
                            if (FileConst.modeProduction === 'development') {
                                promise = handleLocalFileUpload(file, folder);
                            } else {
                                promise = handleUploadFileToCloudStorage(file, folder);
                            }
                            filePromises.push(promise);
                        }

                        file.on('limit', function () {
                            //console.log('file size over 6 MB.');
                            for (let i in Files) {
                                if (Files[i].fieldname === filename && !Files[i].huge) {
                                    Files[i].huge = true;
                                    fs.unlink(path);
                                    break;
                                }
                            }
                            for (let i in fileInfo[fieldname]) {
                                if (fileInfo[fieldname][i].fieldname === filename && !fileInfo[fieldname][i].huge) {
                                    fileInfo[fieldname][i].huge = true;
                                    fs.unlink(path);
                                    break;
                                }
                            }
                        });

                        file.on('data', function (data) {
                            for (let i in Files) {
                                if (Files[i].filename === filename && !Files[i].huge) {
                                    Files[i].data.push(data);
                                    break;
                                }
                            }
                            for (let i in fileInfo[fieldname]) {
                                if (fileInfo[fieldname][i].filename === filename && !fileInfo[fieldname][i].huge) {
                                    fileInfo[fieldname][i].data.push(data);
                                    break;
                                }
                            }
                        });
                    }
                } else {
                    file.resume();
                }
            });

            busboy.on('field', function (fieldname, val) {
                formData.set(fieldname, val);
                fieldAr.push(fieldname);
            });

            busboy.on('finish', function () {
                for (let i in fieldAr) {
                    Fields[fieldAr[i]] = formData.get(fieldAr[i]);
                }

                if (validateSchema !== undefined) {
                    let Joi = ValidationProvider.initModuleValidation();
                    let check = Joi.validate(Fields, validateSchema);
                    if (check.error) {
                        return dfd.reject({
                            path: 'FileInterface.getData.validate',
                            mes: check.error,
                        });
                    }
                }

                q.all(filePromises)
                    .then(function () {
                        dfd.resolve({ Fields, Files, fileInfo });
                    })
                    .catch(dfd.reject);
            });

            req.pipe(busboy);
            },
            function (err) {
                dfd.reject({ path: 'FileInterface.getData.trycatch', err: err.stack });
            }
        );
        return dfd.promise;
    }

    upload(buffer, timeName, nameLib, thePath, folderName, username, dbNamePrfix, filename) {
        let dfd = q.defer();
        const newFolderName = folderName? folderName+'/':'';
        const newThePath = thePath? thePath+'/':'';
        const newNameLib = nameLib? nameLib+'/':'';
        const newUsername = username? username:'';

        let folderPath = dbNamePrfix + '/' + newFolderName + newThePath + newNameLib + newUsername;
        var named = filename.substring(0, filename.length - filename.split(".")[filename.split(".").length - 1].length - 1) + "_" + username + timeName + '.' + filename.split(".")[filename.split(".").length - 1];
        const folder = folderPath + '/' + named;
        let stream;
        if (FileConst.modeProduction === 'development') {
            if (!fs.existsSync(FileConst.pathLocal + '/' + folderPath)) {
                try {
                    fs.mkdirpSync(FileConst.pathLocal + '/' + folderPath);
                } catch (e) {
                    throw e;
                }
            }

            stream = fs.createWriteStream(FileConst.pathLocal + '/' + folder);
            // file.pipe(fstream);
        } else {
        const bucket = bucketGoogleCloud.createBucket();
        const file = bucket.file(folder.replace(/\/+/g, '/'));
        stream = file.createWriteStream({
            resumable: false, // Tắt khả năng resume upload
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Đặt kiểu dữ liệu của file
        });
        }

        stream.end(buffer);

        stream.on('error', (err) => {
            dfd.reject({ path: "FileInterface.getData.trycatch", err: err });
        });
        stream.on('finish', () => {
            dfd.resolve(named);
        });
        return dfd.promise;
    }

    getField(req, validateSchema) {
        let dfd = q.defer();
        trycatch(function () {
            let busboy = new Busboy({ headers: req.headers, highWaterMark: FileConst.highWaterMark });
            let Fields = {};
            let fieldAr = [];
            let formData = new Map();

            busboy.on('field', function (fieldname, val) {
                formData.set(fieldname, val);
                fieldAr.push(fieldname);
            });

            busboy.on('finish', function () {
                for (let i in fieldAr) {
                    Fields[fieldAr[i]] = formData.get(fieldAr[i]);
                }

                if (validateSchema !== undefined) {
                    let Joi = ValidationProvider.initModuleValidation();
                    let check = Joi.validate(Fields, validateSchema);
                    if (check.error) {
                        dfd.reject({ path: "FileInterface.getData.validate", mes: check.error });
                    } else {
                        dfd.resolve({ Fields });
                    }
                } else {
                    dfd.resolve({ Fields });
                }
            });
            req.pipe(busboy);
        }, function (err) {
            dfd.reject({ path: "FileInterface.getField.trycatch", err: err.stack });
            err = undefined;
        });
        return dfd.promise;
    }

    delete(filePath) {
        let dfd = q.defer();
        let deleteFile = bucketGoogleCloud.deleteFile(filePath);
        if (deleteFile) {
            dfd.resolve(filePath);
        } else {
            dfd.reject({ path: 'FileInterface.delete.execute' });
        }

        return dfd.promise;
    }

    download(fileName) {
        let dfd = q.defer();
        const bucket = bucketGoogleCloud.createBucket();
        const file = bucket.file(fileName);
        file.download()
            .then(([fileContent]) => {
                dfd.resolve(fileContent);
            })
            .catch((err) => {
                dfd.reject({ path: 'FileInterface.download.error', err });
            });
        return dfd.promise;
    }

    downloadLocalBuffer(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(FileConst.pathLocal + '/' + filePath, (err, buffer) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(buffer);
                }
            });
        });
    }

    getAllFilesFromRequest(request) {
        const dfd = q.defer();
        trycatch(
            function () {
                const filePromises = [];
                const busboy = new Busboy({
                    headers: request.headers,
                    highWaterMark: FileConst.highWaterMark,
                });

                busboy.on('file', function (fieldName, binary, fileName, encoding, mimetype) {
                    if (FileConst.fileMime.indexOf(mimetype) === -1) {
                        LogProvider.debug("Not support file with mime: %s", mimetype);
                        binary.resume();
                        return;
                    }

                    LogProvider.info(`Found file with mime: ${mimetype}`);
                    const filePromise = new Promise(function(resolve, reject) {
                        convertFileStreamToBuffer(binary)
                            .then(function (buffer) {
                                resolve({
                                    fieldName,
                                    fileName,
                                    encoding,
                                    mimetype,
                                    buffer,
                                });
                            })
                            .catch(reject)
                    })
                    filePromises.push(filePromise);
                });

                busboy.on('finish', function () {
                    q.all(filePromises).then(dfd.resolve).catch(dfd.reject);
                });

                request.pipe(busboy);
            },
            function (error) {
                dfd.reject({ path: "FileInterface.getAllFilesFromRequest.trycatch", err: error.stack });
            }
        );
        return dfd.promise;
    }

}

exports.FileInterface = new FileInterface();
