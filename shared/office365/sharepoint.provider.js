const { SharepointConst } = require('./sharepoint.const');
const { SharepointInterface } = require('./sharepoint.interface');
const { LogProvider } = require('../log_nohierarchy/log.provider');
const q = require('q');

const getLink = function (input, embed) {
    var extensionFile = input.substring(input.length - 3, input.length);
    if (extensionFile.toLowerCase() == 'pdf'
        || extensionFile.toLowerCase() == 'jpg'
        || extensionFile.toLowerCase() == "png"
        || extensionFile.toLowerCase() == "gif"
        || extensionFile.toLowerCase() == "png"
        || extensionFile.toLowerCase() == "rar") {
        return SharepointConst.domain + input;
        return;
    }
    if (extensionFile.toLowerCase() == 'ocx' || extensionFile.toLowerCase() == 'doc') {
        return embed;
        return;
    }
    if (extensionFile.toLowerCase() == 'xls' || extensionFile.toLowerCase() == 'xla' || extensionFile.toLowerCase() == 'lsx') {
        var temp = input.substr(1, input.length);
        return embed + '&file=' + temp.substring(temp.indexOf('/') + 1, temp.length);
        return;
    }
}

class SharepointProvider {
    constructor() { }
    genSPR(session) {
        session.sharepoint = {
            username: SharepointConst.username,
            password: SharepointConst.password
        };
        if (session === undefined
            || session.sharepoint === undefined
            || session.sharepoint.username === undefined
            || session.sharepoint.password === undefined) {
            return {
                status: false,
                err: "InvalidSharepointInfomation"
            };
        }
        return {
            status: true,
            data: SharepointInterface.genSPR(session.sharepoint.username, session.sharepoint.password)
        }
    }

    get(session, url) {
        let obj = new SharepointProvider();
        let spr = obj.genSPR(session);
        let dfd = q.defer();
        if (spr.status) {
            return SharepointInterface.get(spr.data, SharepointConst.domain + url);
        } else {
            dfd.reject({ path: "SharepointProvider.genSPR.InvalidSharepointInfomation", mes: "InvalidSharepointInfomation" });
            return dfd.promise;
        }
    }

    getDigest(session) {
        let obj = new SharepointProvider();
        let spr = obj.genSPR(session);
        let dfd = q.defer();
        if (spr.status) {
            return SharepointInterface.getDigest(spr.data, SharepointConst.domain);
        } else {
            dfd.reject({ path: "SharepointProvider.genSPR.InvalidSharepointInfomation", mes: "InvalidSharepointInfomation" });
            return dfd.promise;
        }
    }

    post(session, url, data) {
        let obj = new SharepointProvider();
        let spr = obj.genSPR(session);
        let dfd = q.defer();
        if (spr.status) {
            obj.getDigest(session).then(function (digest) {
                SharepointInterface.post(spr.data, digest, SharepointConst.domain + url, data).then(function (res) {
                    dfd.resolve(res);
                    res = undefined;
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
                digest = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
        } else {
            dfd.reject({ path: "SharepointProvider.genSPR.InvalidSharepointInfomation", mes: "InvalidSharepointInfomation" });
        }
        return dfd.promise;
    }

    rollback(spr, digest, nameLib, Files) {
        let dfd = q.defer();
        trycatch(function () {
            let dfdAr = [];
            for (let i in Files) {
                dfdAr.push(SharepointInterface.deletefile(spr, digest, SharepointConst.domain, nameLib, Files[i].named));
            }
            q.all(dfdAr).then(function () {
                dfd.resolve(Files);
            }, function (err) {
                dfd.reject(err);
                LogProvider.warn(err, "SharepointProvider.rollback.deleteFiles", "service", "", { nameLib, Files });
            });
            dfdAr = undefined;
            spr = undefined;
            digest = undefined;
            nameLib = undefined;
            Files = undefined;
        }, function (err) {
            dfd.reject({ path: "SharepointProvider.rollback.trycatch", err: err.stack });
            spr = undefined;
            digest = undefined;
            nameLib = undefined;
            Files = undefined;
        });
        return dfd.promise;
    }

    uploadFile(session, nameLib, Files) {
        let obj = new SharepointProvider();
        let spr = obj.genSPR(session);
        let dfd = q.defer();
        if (spr.status) {
            obj.getDigest(session).then(function (digest) {

                let dfdAr = [];
                for (let i in Files) {
                    dfdAr.push(SharepointInterface.uploadfile(spr.data, digest, SharepointConst.domain, nameLib, Files[i].named, Files[i].data));
                }
                q.all(dfdAr).then(function (res) {
                    dfd.resolve(res);
                    res = undefined;
                }, function (err) {
                    dfd.reject(err);
                    obj.rollback(spr, digest, nameLib, Files);
                    err = undefined;
                });
                digest = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
        } else {
            dfd.reject({ path: "SharepointProvider.genSPR.InvalidSharepointInfomation", mes: "InvalidSharepointInfomation" });
        }
        return dfd.promise;
    }

    checkout(session, nameLib, fileName) {
        let obj = new SharepointProvider();
        let spr = obj.genSPR(session);
        let dfd = q.defer();
        if (spr.status) {
            obj.getDigest(session).then(function (digest) {
                SharepointInterface.checkout(spr.data, digest, SharepointConst.domain, nameLib, fileName).then(function (res) {
                    dfd.resolve(res);
                    res = undefined;
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
                digest = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
        } else {
            dfd.reject({ path: "SharepointProvider.genSPR.InvalidSharepointInfomation", mes: "InvalidSharepointInfomation" });
        }
        return dfd.promise;
    }

    checkin(session, nameLib, fileName) {
        let obj = new SharepointProvider();
        let spr = obj.genSPR(session);
        let dfd = q.defer();
        if (spr.status) {
            obj.getDigest(session).then(function (digest) {
                SharepointInterface.checkin(spr.data, digest, SharepointConst.domain, nameLib, fileName, session.sharepoint.username).then(function (res) {
                    dfd.resolve(res);
                    res = undefined;
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
                digest = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
        } else {
            dfd.reject({ path: "SharepointProvider.genSPR.InvalidSharepointInfomation", mes: "InvalidSharepointInfomation" });
        }
        return dfd.promise;
    }

    deleteFile(session, nameLib, fileName) {
        let obj = new SharepointProvider();
        let spr = obj.genSPR(session);
        let dfd = q.defer();
        if (spr.status) {
            obj.getDigest(session).then(function (digest) {
                SharepointInterface.deletefile(spr.data, digest, SharepointConst.domain, nameLib, fileName).then(function (res) {
                    dfd.resolve(res);
                    res = undefined;
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
                digest = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
        } else {
            dfd.reject({ path: "SharepointProvider.genSPR.InvalidSharepointInfomation", mes: "InvalidSharepointInfomation" });
        }
        return dfd.promise;
    }

    loadFile(session, nameLib, nameFile) {
        let dfd = q.defer();
        let obj = new SharepointProvider();
        obj.get(session, "/_api/web/GetFileByServerRelativeUrl('" + "/" + nameLib + "/" + nameFile + "')/ListItemAllFields").then(function (data) {
            dfd.resolve({
                id: data.body.d.ID,
                embedUri: data.body.d.ServerRedirectedEmbedUri,
                guid: data.body.d.GUID
            });
        }, function (err) {
            dfd.reject(err);
            session = undefined;
            nameLib = undefined;
            nameFile = undefined;
        });
        return dfd.promise;
    }

}

exports.SharepointProvider = new SharepointProvider();
