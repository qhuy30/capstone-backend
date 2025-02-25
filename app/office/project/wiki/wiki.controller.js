
const q = require('q');
const { WikiService } = require('./wiki.service');
const { FileProvider } = require('../../../../shared/file/file.provider');
const { validation } = require('./wiki.validation');
const nameLib = "wiki";
const parentFolder = "office";
const folderArray = ['office', 'project']
const { StoreConst } = require('../../../../shared/store/gcp/store.const');
const { gcpProvider } = require('../../../../shared/store/gcp/gcp.provider');
const { FileConst } = require('../../../../shared/file/file.const');

const countFilterCondition = function (body) {
    let count = 0;
    if (body.search !== undefined && body.search !== "") {
        count++;
    }
    if (body.project !== undefined && body.project !== "") {
        count++;
    }
    if (body.department !== undefined && body.department !== "") {
        count++;
    }
    return count;
}

const genFilterData = function (body) {
    let filter;
    let count = countFilterCondition(body);
    if(count ==0){
        filter = {is_popular: { $eq: true }};
    }
    if (count == 1) {
        if (body.search !== undefined && body.search !== "") {
            filter = {
                $and: [
                    { $text: { $search: body.search } },
                    { is_popular: { $eq: true } }
                ]
            };
        }
        if (body.project !== undefined && body.project !== "") {
            filter = { project: { $eq: body.project } };
        }
        if (body.department !== undefined && body.department !== "") {
            filter = { department: { $eq: body.department } };
        }
    }
    if(count>1){
        filter ={$and:[]};
        if (body.search !== undefined && body.search !== "") {
            filter.$and.push({ $text: { $search: body.search } });
        }

        if (body.project !== undefined && body.project !== "") {
            filter.$and.push({ project: { $eq: body.project }});
        }
        if (body.department !== undefined && body.department !== "") {
            filter.$and.push({ department: { $eq: body.department }});
        }
    }
    return filter;
}

const genInsertData = function (username, fields) {
    let dfd = q.defer();
    let result = {};
    let d = new Date();
    result.event= { username, action: "created", time: d.getTime() };
    result.title = fields.title;
    if(fields.content){
        result.content = fields.content;
    }else{
        result.content ="<p></p>"
    }

    if (fields.project || fields.department) {
        if (fields.project) {
            result.project = [fields.project] || [];
        }

        if (fields.department) {
            result.department = [fields.department] || [];
        }
    } else {
        result.is_popular = true;
    }

    dfd.resolve(result);
    d = undefined;
    return dfd.promise;
}

const checkPermissionForUpdate = function (body) {
    let dfd = q.defer();
    WikiService.loadDetails(body._service[0].dbname_prefix, body.id).then(function (item) {
        if (item.entity.his[0].createdby === body.username) {
            dfd.resolve(item);
        } else {
            dfd.reject({ path: "WikiController.checkPermissionForUpdate.NotPermission", mes: "NotPermission" });
        }
        item = undefined;
        body = undefined;
    }, function (err) {
        dfd.reject(err);
        body = undefined;
        err = undefined;
    });

    return dfd.promise;
}

class WikiController {
    constructor() { }

    load(body) {
        let filter = genFilterData(body);
        return WikiService.load(body._service[0].dbname_prefix, filter, body.top, body.offset);
    }

    count(body) {
        let filter = genFilterData(body);
        return WikiService.count(body._service[0].dbname_prefix, filter);
    }

    insert(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.insert, 'project', parentFolder, req.body.username).then(function (res) {
           
            let attachment = [];
            for (let i in res.Files) {
                if (!res.Files[i].huge) {
                    attachment.push({
                        timePath: res.Files[i].timePath,
                        locate: res.Files[i].type,
                        display: res.Files[i].filename,
                        name: res.Files[i].named,
                        nameLib
                    });
                }
            }
          
            genInsertData(req.body.username, res.Fields).then(function (data) {
                
                WikiService.insert(req.body._service[0].dbname_prefix, req.body.username,
                    data.title,
                    data.content,
                    data.project,
                    data.department,
                    data.is_popular,
                    attachment,
                    data.event).then(function () {
                        if (res.Fields.type === "private") {
                            dfd.resolve({
                                type: "private",
                                receiver: data.receiver
                            });
                        } else {
                            dfd.resolve(true);
                        }
                        req = undefined;
                        attachment = undefined;
                    }, function (err) {
                        dfd.reject(err);
                        req = undefined;
                        attachment = undefined;
                        err = undefined;
                    });
                data = undefined;
            }, function (err) {
                dfd.reject(err);
                req = undefined;
                attachment = undefined;
            });
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            req = undefined;
        });
        return dfd.promise;
    }

    loadDetails(body) {
        let dfd = q.defer();
        WikiService.loadDetails(body._service[0].dbname_prefix, body.id).then(function (item) {
            let projectIdAr =[];
            for(var i in item.project){
                projectIdAr.push(new require('mongodb').ObjectID(item.project[i]));
            }
            WikiService.checkPermission(body._service[0].dbname_prefix, body.username, projectIdAr).then(function () {
                WikiService.upView(body._service[0].dbname_prefix, body.username, body.id).then(function () {
                    WikiService.loadDetails(body._service[0].dbname_prefix, body.id).then(function (newitem) {
                        dfd.resolve(newitem);
                        body = undefined;
                        item = undefined;
                        newitem = undefined;
                    }, function (err) {
                        dfd.reject(err);
                        body = undefined;
                        item = undefined;
                        err = undefined;
                    });
                }, function (err) {
                    dfd.reject(err);
                    body = undefined;
                    err = undefined;
                    item = undefined;
                });
            }, function (err) {
                dfd.reject(err);
                body = undefined;
                err = undefined;
                item = undefined;
            });
        }, function (err) {
            dfd.reject(err);
            body = undefined;
            err = undefined;
        });
        return dfd.promise;
    }

    loadDetailsForUpdate(body) {
        let dfd = q.defer();
        checkPermissionForUpdate(body).then(function () {
            WikiService.loadDetails(body._service[0].dbname_prefix, body.id).then(function (item) {
                dfd.resolve(item);
                body = undefined;
                item = undefined;
                newitem = undefined;
            }, function (err) {
                dfd.reject(err);
                body = undefined;
                item = undefined;
                err = undefined;
            });
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            body = undefined;
        });
        return dfd.promise;
    }

    loadFileInfo(body) {
        let dfd = q.defer();
        WikiService.loadDetails(body._service[0].dbname_prefix, body.id).then(function (item) {
            let projectIdAr =[];
            for(var i in item.project){
                projectIdAr.push(new require('mongodb').ObjectID(item.project[i]));
            }
 
            WikiService.checkPermission(body._service[0].dbname_prefix, body.username, projectIdAr).then(function () {
                let checkFile = false;
                let fileInfo = {};
                for (let i in item.attachment) {
                    if (item.attachment[i].name === body.filename) {
                        fileInfo = item.attachment[i];
                        checkFile = true;
                        break;
                    }
                }
                if (checkFile) {
                    FileProvider.loadFile(body._service[0].dbname_prefix, body.session, fileInfo.nameLib, fileInfo.name, fileInfo.timePath, fileInfo.locate, folderArray, item.username).then(function (fileinfo) {
                        fileinfo.display = fileInfo.display;
                        dfd.resolve(fileinfo);
                        fileinfo = undefined;
                    }, function (err) {
                        dfd.reject(err);
                        fileInfo = undefined;
                        err = undefined;
                    });
                } else {
                    dfd.reject({ path: "WikiController.loadFileInfo.FileIsNotExists", mes: "FileIsNotExists" });
                }
                body = undefined;
                item = undefined;
            }, function (err) {
                dfd.reject(err);
                body = undefined;
                err = undefined;
                item = undefined;
            });
        }, function (err) {
            dfd.reject(err);
            body = undefined;
        });
        return dfd.promise;
    }

    like(body) {
        let dfd = q.defer();
        WikiService.loadDetails(body._service[0].dbname_prefix, body.id).then(function (item) {
            let projectIdAr =[];
            for(var i in item.project){
                projectIdAr.push(new require('mongodb').ObjectID(item.project[i]));
            }
            WikiService.checkPermission(body._service[0].dbname_prefix, body.username, projectIdAr).then(function () {
                WikiService.like(body._service[0].dbname_prefix, body.username, body.id).then(function () {
                    WikiService.loadDetails(body._service[0].dbname_prefix, body.id).then(function (newitem) {
                        dfd.resolve(newitem);
                        body = undefined;
                        item = undefined;
                        newitem = undefined;
                    }, function (err) {
                        dfd.reject(err);
                        body = undefined;
                        item = undefined;
                    });

                }, function (err) {
                    dfd.reject(err);
                    body = undefined;
                    item = undefined;
                });
            }, function (err) {
                dfd.reject(err);
                body = undefined;
                err = undefined;
                item = undefined;
            });
        }, function (err) {
            dfd.reject(err);
            body = undefined;
            err = undefined;
        });
        return dfd.promise;
    }

    unlike(body) {
        let dfd = q.defer();
        WikiService.loadDetails(body._service[0].dbname_prefix, body.id).then(function (item) {
            let projectIdAr =[];
            for(var i in item.project){
                projectIdAr.push(new require('mongodb').ObjectID(item.project[i]));
            }
            WikiService.checkPermission(body._service[0].dbname_prefix, body.username, projectIdAr).then(function () {
                WikiService.unlike(body._service[0].dbname_prefix, body.username, body.id).then(function () {
                    WikiService.loadDetails(body._service[0].dbname_prefix, body.id).then(function (newitem) {
                        dfd.resolve(newitem);
                        body = undefined;
                        item = undefined;
                        newitem = undefined;
                    }, function (err) {
                        dfd.reject(err);
                        body = undefined;
                        item = undefined;
                        err = undefined;
                    });
                }, function (err) {
                    dfd.reject(err);
                    body = undefined;
                    item = undefined;
                });
            }, function (err) {
                dfd.reject(err);
                body = undefined;
                err = undefined;
                item = undefined;
            });
        }, function (err) {
            dfd.reject(err);
            body = undefined;
            err = undefined;
        });
        return dfd.promise;
    }

    delete(body) {
        let dfd = q.defer();
        checkPermissionForUpdate(body).then(function (item) {
            WikiService.delete(body._service[0].dbname_prefix, body.id, body.username).then(function () {
                FileProvider.delete(body._service[0].dbname_prefix, body.session, nameLib, item.attachment, item.username, folderArray);
                dfd.resolve(true);
                body = undefined;
            }, function (err) {
                dfd.reject(err);
                body = undefined;
                err = undefined;
            });
        }, function (err) {
            dfd.reject(err);
            body = undefined;
            err = undefined;
        });
        return dfd.promise;
    }

    update(body) {
        let dfd = q.defer();
        checkPermissionForUpdate(body).then(function (item) {
            let projectIdAr =[];
            for(var i in item.project){
                projectIdAr.push(new require('mongodb').ObjectID(item.project[i]));
            }
            WikiService.checkExistProject(body._service[0].dbname_prefix, projectIdAr).then(function () {
                WikiService.update(body._service[0].dbname_prefix, body.username, body.id, body.title, body.content).then(function () {
                    dfd.resolve(true);
                    body = undefined;
                    item = undefined;
                }, function (err) {
                    dfd.reject(err);
                    body = undefined;
                    err = undefined;
                    item = undefined;
                });
            }, function (err) {
                dfd.reject(err);
                body = undefined;
                err = undefined;
                item = undefined;
            });
        }, function (err) {
            dfd.reject(err);
            body = undefined;
            err = undefined;
        });
        return dfd.promise;
    }

    removeAttachment(body) {
        let dfd = q.defer();
        checkPermissionForUpdate(body).then(function (item) {
            let fileInfo = {};
            for (let i in item.attachment) {
                if (item.attachment[i].name == body.filename) {
                    fileInfo = item.attachment[i];
                    break;
                }
            }
            if (fileInfo.name) {
                let d = new Date();
                FileProvider.delete(body._service[0].dbname_prefix, body.session, nameLib, [fileInfo], item.item, folderArray);
                WikiService.removeAttachment(body._service[0].dbname_prefix, body.username, body.id, body.filename, d.getTime()).then(function () {
                    dfd.resolve(true);
                    body = undefined;
                    item = undefined;
                    fileInfo = undefined;

                }, function (err) {
                    dfd.reject(err);
                    body = undefined;
                    err = undefined;
                    item = undefined;
                    fileInfo = undefined;
                });
                d = undefined;
            } else {
                dfd.reject({ path: "WikiController.removeAttachment.FileIsNotExist", mes: "FileIsNotExist" });
                body = undefined;
                item = undefined;
                fileInfo = undefined;
            }
        }, function (err) {
            dfd.reject(err);
            body = undefined;
            err = undefined;
        });
        return dfd.promise;
    }

    pushAttachment(req) {
        let dfd = q.defer();
        checkPermissionForUpdate(req.body).then(function () {

            FileProvider.upload(req, nameLib, undefined, 'project', parentFolder, req.body.username).then(function (res) {
                let attachment = [];
                for (let i in res.Files) {
                    if (!res.Files[i].huge) {
                        attachment.push({
                            timePath: res.Files[i].timePath,
                            locate: res.Files[i].type,
                            display: res.Files[i].filename,
                            name: res.Files[i].named,
                            nameLib
                        });
                    }
                }
                if (attachment[0]) {
                    let d = new Date();
                    WikiService.pushAttachment(req.body._service[0].dbname_prefix, req.body.username, req.body.id, attachment[0], d.getTime()).then(function () {
                        dfd.resolve({
                            timePath: res.Files[0].timePath,
                            locate: res.Files[0].type,
                            display: res.Files[0].filename,
                            name: res.Files[0].named,
                            nameLib
                        });
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                        req = undefined;
                    });
                    d = undefined;
                } else {
                    dfd.reject({ path: "WikiController.pushAttachment.InvalidFile", mes: "InvalidFile" });
                    err = undefined;

                }
                attachment = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                req = undefined;
            });
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            req = undefined;
        });


        return dfd.promise;
    }

    uploadImage(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, undefined, undefined, parentFolder, req.body.username).then(function (res) {
            if (res.Files[0]) {
                if (FileConst.modeProduction === 'development') {
                    let imgUrl = FileConst.tenantDomain + '/files/' + res.Files[0].folderPath + '/' + res.Files[0].named;
                    dfd.resolve(imgUrl);
                } else {
                    gcpProvider.getSignedUrl(res.Files[0].folderPath + '/' + res.Files[0].named).then(
                        (imgUrl) => {
                            dfd.resolve(imgUrl);
                            imgUrl = undefined;
                        },
                        (err) => {
                            dfd.reject(err);
                        }
                    );
                }
            } else {
                dfd.reject({ path: "WikiController.uploadImg.FileIsNull", mes: "FileIsNull" });
            }
            res = undefined;
            req = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            req = undefined;
        });
        return dfd.promise;
    }

    download(body) {                               
        let dfd = q.defer(); 
        const folderPath = folderArray.join('/');     
        
        WikiService.loadDetails(body._service[0].dbname_prefix, body.id).then(function (item) {                 
            let projectIdAr =[];
            for(var i in item.project){
                projectIdAr.push(new require('mongodb').ObjectID(item.project[i]));
            }
 
            WikiService.checkPermission(body._service[0].dbname_prefix, body.username, projectIdAr).then(function () {
                let checkFile = false;                
                for (let i in item.attachment) {
                    if (item.attachment[i].name === body.filename) {                        
                        checkFile = true;
                        break;
                    }
                }
                if (checkFile) {                                        
                    FileProvider.download(
                        body._service[0].dbname_prefix +
                            '/' +
                            folderPath +
                            '/' +
                            nameLib + 
                            '/' +
                            item.username +                 
                            '/' +
                            body.filename
                    ).then(
                        (url) => {                
                            dfd.resolve(url);
                            url = undefined;
                        },
                        (error) => {
                            dfd.reject(error);
                            error = undefined;
                        }
                    );
                } else {
                    dfd.reject({ path: "WikiController.download.FileIsNotExists", mes: "FileIsNotExists" });
                }
                body = undefined;
                item = undefined;
            }, function (err) {
                dfd.reject(err);
                body = undefined;
                err = undefined;
                item = undefined;
            });
        }, function (err) {
            dfd.reject(err);
            body = undefined;
        });        
        return dfd.promise;
    }
}

exports.WikiController = new WikiController();