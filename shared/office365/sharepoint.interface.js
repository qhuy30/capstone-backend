
const spRequest = require('sp-request');
const trycatch = require('trycatch');
const q = require('q');
class SharepointInterface {
    constructor() { }
    genSPR(username, password) {
        return spRequest.create({ username, password });
    }

    get(spr, url) {
        let dfd = q.defer();
        trycatch(function () {
            spr.get(url).then(res => {
                dfd.resolve(res);
                spr = undefined;
                url = undefined;
                res = undefined;
            }).catch(err => {
                dfd.reject({path: "SharepointInterface.get.validrequest",err:err.message});
                spr = undefined;
                url = undefined;
                err = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "SharepointInterface.get.trycatch", err: err.stack });
            spr = undefined;
            url = undefined;
            err = undefined;
        });
        return dfd.promise;
    }

    getDigest(spr, site) {
        let dfd = q.defer();
        trycatch(function () {
            spr.requestDigest(site).then(digest => {
                dfd.resolve(digest);
                spr = undefined;
                site = undefined;
                digest = undefined;
            }).catch(err => {
                dfd.reject({path: "SharepointInterface.getDigest.validrequest",err});
                spr = undefined;
                site = undefined;
                err = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "SharepointInterface.getDigest.trycatch", err: err.stack });
            spr = undefined;
            site = undefined;
            err = undefined;
        });
        return dfd.promise;
    }

    post(spr, digest, url, data) {
        let dfd = q.defer();
        trycatch(function () {
            spr.post(url, { body: data, headers: { 'X-RequestDigest': digest, 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*' } }).then(res => {
                dfd.resolve(res);
                spr = undefined;
                url = undefined;
                res = undefined;
                dfd = undefined;
                digest = undefined;
                data = undefined;
            }, err => {
                dfd.reject({path: "SharepointInterface.post.validrequest",err});
                spr = undefined;
                url = undefined;
                err = undefined;
                dfd = undefined;
                digest = undefined;
                data = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "SharepointInterface.post.trycatch", err: err.stack });
            spr = undefined;
            digest = undefined;
            url = undefined;
            data = undefined;
            err = undefined;
        });
        return dfd.promise;
    }

    uploadfile(spr, digest, site, nameLib,fileName,bufferAr) {
        let dfd = q.defer();
        trycatch(function () {
            let fileCollectionEndpoint =
                site + "/_api/web/getfolderbyserverrelativeurl('" + nameLib + "')/files" +
                "/add(overwrite=true, url='" + fileName+ "')";
            spr.post(fileCollectionEndpoint, {
                body: Buffer.concat(bufferAr),
                json: false,
                headers: {
                    "X-RequestDigest": digest
                }
            }).then(function () {
                dfd.resolve(fileName);
                spr = undefined;
                site = undefined;
                dfd = undefined;
                digest = undefined;
                nameLib = undefined;
                fileCollectionEndpoint = undefined;
                fileName = undefined;
                bufferAr = undefined;
            }, function (err) {
                dfd.reject({path: "SharepointInterface.uploadfile.validrequest",err});
                spr = undefined;
                site = undefined;
                err = undefined;
                dfd = undefined;
                digest = undefined;
                nameLib = undefined;
                fileCollectionEndpoint = undefined;
                fileName = undefined;
                bufferAr = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "SharepointInterface.uploadfile.trycatch", err: err.stack });
            spr = undefined;
            digest = undefined;
            site = undefined;
            nameLib = undefined;
            tqv = undefined;
            busboy = undefined;
            err = undefined;
            fileName = undefined;
            bufferAr = undefined;
        });
        return dfd.promise;
    }

    checkout(spr, digest, site, nameLib, fileName) {
        let dfd = q.defer();
        trycatch(function () {
            spr.post(site + "/_api/web/GetFileByServerRelativeUrl('/" + nameLib + "/" + fileName + "')/CheckOut()", {
                headers: {
                    "X-RequestDigest": digest
                }
            }).then(res => {
                dfd.resolve(res);
                spr = undefined;
                site = undefined;
                res = undefined;
                dfd = undefined;
                digest = undefined;
                nameLib = undefined;
                fileName = undefined;

            }, err => {
                dfd.reject({path: "SharepointInterface.checkout.validrequest",err});
                spr = undefined;
                site = undefined;
                err = undefined;
                dfd = undefined;
                digest = undefined;
                nameLib = undefined;
                fileName = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "SharepointInterface.checkout.trycatch", err: err.stack });
            spr = undefined;
            digest = undefined;
            site = undefined;
            nameLib = undefined;
            fileName = undefined;
            err = undefined;
        });
        return dfd.promise;
    }

    checkin(spr, digest, site, nameLib, fileName, username) {
        let dfd = q.defer();
        trycatch(function () {
            spr.post(site + "/_api/web/GetFileByServerRelativeUrl('/" + nameLib + "/" + fileName + "')/CheckIn(comment='By " + username + "',checkintype=0)", {
                headers: {
                    "X-RequestDigest": digest
                }
            }).then(res => {
                dfd.resolve(res);
                spr = undefined;
                site = undefined;
                res = undefined;
                dfd = undefined;
                digest = undefined;
                nameLib = undefined;
                fileName = undefined;
                username = undefined;
            }, err => {
                dfd.reject({path: "SharepointInterface.checkin.validrequest",err});
                spr = undefined;
                site = undefined;
                err = undefined;
                dfd = undefined;
                digest = undefined;
                nameLib = undefined;
                fileName = undefined;
                username = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "SharepointInterface.checkin.trycatch", err: err.stack });
            spr = undefined;
            digest = undefined;
            site = undefined;
            nameLib = undefined;
            fileName = undefined;
            err = undefined;
            username = undefined;
        });
        return dfd.promise;
    }

    deletefile(spr, digest, site, nameLib, fileName) {
        let dfd = q.defer();
        trycatch(function () {
            spr.post(site + "/_api/web/GetFileByServerRelativeUrl('/" + nameLib + "/" + fileName + "')", {
                headers: {
                    "accept": "application/json;odata=verbose",
                    "X-RequestDigest": digest,
                    "IF-MATCH": "*",
                    "X-HTTP-Method": "DELETE"
                }
            }).then(res => {
                dfd.resolve(res);
                spr = undefined;
                site = undefined;
                res = undefined;
                dfd = undefined;
                digest = undefined;
                nameLib = undefined;
                fileName = undefined;

            }, err => {
                dfd.reject({path: "SharepointInterface.deletefile.validrequest",err});
                spr = undefined;
                site = undefined;
                err = undefined;
                dfd = undefined;
                digest = undefined;
                nameLib = undefined;
                fileName = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "SharepointInterface.deletefile.trycatch", err: err.stack });
            spr = undefined;
            digest = undefined;
            site = undefined;
            nameLib = undefined;
            fileName = undefined;
            err = undefined;
        });
        return dfd.promise;
    }

    
}

exports.SharepointInterface = new SharepointInterface();