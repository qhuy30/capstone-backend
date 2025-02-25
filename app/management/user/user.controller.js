

const { AuthenticationProvider } = require('../../../shared/authentication/authentication.provider');
const q = require('q');
const jwt = require('jsonwebtoken');
const { JWTOptions } = require('../../../shared/authentication/authentication.const');
const { UserService } = require('./user.service');
const { ConfigSetup } = require('../../../shared/setup/config.const');
const { FileProvider } = require('../../../shared/file/file.provider');
const trycatch = require('trycatch');
const ExcelJS = require('exceljs');
const { genFilterByRule, genFilterCountByRule } = require('@utils/util');
const { removeAccents } = require('@utils/codeUtil');
const { FirebaseProvider } = require('@shared/firebase/firebase.provider');
const nameLib = "avatar";

const parentFolder = '/management';
const countFilterCondition = function (body) {
    let count = 0;
    if (body.isactive !== undefined) {
        count++;
    }
    if (body.search !== undefined && body.search !== "") {
        count++;
    }
    return count;
}

const genFilterData = function (body) {
    let count = countFilterCondition(body);
    if (count == 0) { return {}; }
    let filter;
    if (count > 1) {
        filter = { $and: [] };
        if (body.isactive !== undefined) {
            filter.$and.push({ isactive: { $eq: body.isactive } });
        }
        if (body.search !== undefined && body.search !== "") {
            filter.$and.push({
                $or: [
                    { username: { $regex: body.search, $options: "i" } },
                    { title_search: { $regex: body.search, $options: "i" } }
                ]
            });

        }
    } else {
        if (body.isactive !== undefined) {
            filter = { isactive: { $eq: body.isactive } };
        }
        if (body.search !== undefined) {
            body.search = removeAccents(body.search);
            
            filter = {
                $or: [
                    { username: { $regex: body.search, $options: "i" } },
                    { title_search: { $regex: body.search, $options: "i" } }
                ]
            };
        }
    }
    return filter;
}

const genFilterData_for_pick_user_directive = function (body) {
    const conditions = [
        { isactive: { $eq: true } }
    ];

    if (body.department) {
        conditions.push({ department: { $eq: body.department } });
    }

    if (body.search !== undefined) {
        body.search = removeAccents(body.search);
        conditions.push({
            $or: [
                { username: { $regex: body.search, $options: "i" } },
                { title_search: { $regex: body.search, $options: "i" } }
            ]
        });
    }
    
    return { $and: conditions };
}

const generateUserInfo = function (body) {
    let obj = {};
    obj.language = body.language !== undefined ? body.language : ConfigSetup.user.new.language;
    obj.isactive = body.isactive !== undefined ? body.isactive : ConfigSetup.user.new.isactive;
    return obj;
}






class UserController {
    constructor() { }

    login(body) {
        let dfd = q.defer();
        UserService.checkExists(body._service[0].dbname_prefix, body.data.username, body.data.password).then(function (data) {
            if (data[0]) {
                let dataen = AuthenticationProvider.encrypt_lv1({ username: data[0].username });
                let payload = { "data": dataen };
                let secret;
                if (ConfigSetup.system.separateTenantFrontend) {
                    secret = JWTOptions.jwtSecret_onHost;
                } else {
                    secret = JWTOptions.jwtSecret;
                }

                let accessToken = jwt.sign(payload, secret, { expiresIn: JWTOptions.expiresIn });
                let refreshToken = jwt.sign(payload, secret, { expiresIn: JWTOptions.longExpiresIn });

                dfd.resolve({
                    token: accessToken,
                    refresh_token: body.data.remember ? refreshToken : null,
                    data: data[0]
                });

                secret = undefined;
                dataen = undefined;
                payload = undefined;
                accessToken = undefined;
                refreshToken = undefined;
            } else {
                dfd.reject({ path: "UserController.login.InvalidSigninInformation", mes: "InvalidSigninInformation" });
            }
        }, function (err) {
            dfd.reject(err);
            body = undefined;
            err = undefined;
        });

        return dfd.promise;
    }

    refreshToken(body) {
        let dfd = q.defer();
        trycatch(function () {
            let jwtParser = jwt.decode(body.refreshToken);
            let username = AuthenticationProvider.decrypt_lv1(jwtParser.data).username;
            if (jwtParser.exp < Date.now() / 1000) {
                dfd.reject({ path: "UserController.refreshToken.RefreshTokenIsExpired", mes: "RefreshTokenIsExpired" });
            }

            let dataen = AuthenticationProvider.encrypt_lv1({ username });
            let payload = { "data": dataen };
            let secret = ConfigSetup.system.separateTenantFrontend ? JWTOptions.jwtSecret_onHost : JWTOptions.jwtSecret;
            let newAccessToken = jwt.sign(payload, secret, { expiresIn: JWTOptions.expiresIn });

            UserService.loadDetails(body._service[0].dbname_prefix, username).then(function (data) {
                dfd.resolve({
                    token: newAccessToken,
                    data
                });

                jwtParser = undefined;
                username = undefined;
                dataen = undefined;
                payload = undefined;
                secret = undefined;
                newAccessToken = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                body = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "UserController.refreshToken.trycatch", err: err.stack });
            err = undefined;
        });

        return dfd.promise;
    }

    changePassword(body) {
        let dfd = q.defer();
        body.password = AuthenticationProvider.encrypt_oneDirection_lv1(body.password);
        body.newpassword = AuthenticationProvider.encrypt_oneDirection_lv1(body.newpassword);
        UserService.checkExists(body._service[0].dbname_prefix, body.username, body.password).then(function (data) {
            if (data[0]) {
                UserService.changePassword(body._service[0].dbname_prefix, body.username, body.password, body.newpassword).then(function () {
                    dfd.resolve(true);
                    dfd = undefined;
                    body = undefined;
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                    body = undefined;
                });
            } else {
                dfd.reject({ path: "UserController.changePassword.InvalidPassword", mes: "InvalidPassword" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            body = undefined;
        });
        return dfd.promise;
    }

    changeLanguage(body) {
        return UserService.changeLanguage(body._service[0].dbname_prefix, body.username, body.key);
    }

    loadUserForAddFriend(body) {
        return UserService.loadUserForAddFriend(body._service[0].dbname_prefix, body.username, body.search);
    }

    load_for_pick_user_directive(body){
        let filter = genFilterData_for_pick_user_directive(body);
        return UserService.loadUser(body._service[0].dbname_prefix, filter, body.top, body.offset, body.sort);
    }

    count_for_pick_user_directive(body) {
        let filter = genFilterData_for_pick_user_directive(body);
        return UserService.countUser(body._service[0].dbname_prefix, filter);
    }

    load_by_rule(body){
        let rule = body.rule;
        if(!Array.isArray(body.rule)){
            rule = [body.rule];
        }


        const matchConditions = [
            {
                $or: [
                    {
                        rule: {
                            $elemMatch: {
                                rule: { $in: rule },
                                "details.type": { $ne: "None" },
                            }
                        }
                    },
                    {
                        rule: {
                            $elemMatch: {
                                rule: { $in: rule },
                                details: { $exists: false }
                            }
                        }
                    },
                    {
                        'groupInfo.rule': {
                            $elemMatch: {
                                rule: { $in: rule },
                                "details.type": { $ne: "None" },
                            }
                        }
                    },
                    {
                        'groupInfo.rule': {
                            $elemMatch: {
                                rule: { $in: rule },
                                details: { $exists: false },
                            }
                        }
                    }
                ]
            }
        ];

        if (body.search !== undefined) {
            matchConditions.push({
                $or: [
                    { username: { $regex: body.search, $options: "i" } },
                    { title_search: { $regex: body.search, $options: "i" } }
                ]
            });
        }

        const filter = [            
            // Bước 1: `$lookup`
            {
                $lookup: {
                    from: 'group',
                    localField: 'username', // Trường trong 'user' để nối
                    foreignField: 'user', // Trường trong 'group' chứa danh sách user
                    as: 'groupInfo' // Kết quả nối sẽ nằm trong 'groupInfo'
                }
            },
            // Bước 2: `$match`
            {
                $match: {
                    $and: matchConditions
                }
            },
            // Bước 3: `$skip` và `$limit` cho phân trang
            {
                $skip: body.offset // `page` và `limit` được truyền từ request
            },
            {
                $limit: body.top // Số lượng document mỗi trang
            }
        ];
        return UserService.loadUserAggregate(body._service[0].dbname_prefix, filter);
    }

    count_by_rule(body) {
        let rule = body.rule;
        if(!Array.isArray(body.rule)){
            rule = [body.rule];
        }

        const matchConditions = [
            {
                $or: [
                    {
                        rule: {
                            $elemMatch: {
                                rule: { $in: rule },
                                "details.type": { $ne: "None" },
                            }
                        }
                    },
                    {
                        rule: {
                            $elemMatch: {
                                rule: { $in: rule },
                                details: { $exists: false }
                            }
                        }
                    },
                    {
                        'groupInfo.rule': {
                            $elemMatch: {
                                rule: { $in: rule },
                                "details.type": { $ne: "None" },
                            }
                        }
                    },
                    {
                        'groupInfo.rule': {
                            $elemMatch: {
                                rule: { $in: rule },
                                details: { $exists: false },
                            }
                        }
                    }
                ]
            }
        ];

        if (body.search !== undefined) {
            matchConditions.push({
                $or: [
                    { username: { $regex: body.search, $options: "i" } },
                    { title_search: { $regex: body.search, $options: "i" } }
                ]
            });
        }

        const filter = [
            // Bước 1: `$lookup`
            {
                $lookup: {
                    from: 'group',
                    localField: 'username', // Trường trong 'user' để nối
                    foreignField: 'user', // Trường trong 'group' chứa danh sách user
                    as: 'groupInfo' // Kết quả nối sẽ nằm trong 'groupInfo'
                }
            },
            // Bước 2: `$match`
            {
                $match: {
                    $and: matchConditions
                }
            },
            // Bước 3: `$skip` và `$limit` cho phân trang
            {
                $count: "count",
            },
        ];
        return UserService.executeAggregate(body._service[0].dbname_prefix, filter);
    }

    load(body) {
        let filter = genFilterData(body);
        return UserService.loadUser(body._service[0].dbname_prefix, filter, body.top, body.offset, body.sort);
    }

    load_host_meeting_room(body) {
        let filter = genFilterData(body);
        return UserService.loadUser(body._service[0].dbname_prefix, filter, body.top, body.offset, body.sort);
    }

    count(body) {
        let filter = genFilterData(body);
        return UserService.countUser(body._service[0].dbname_prefix, filter);
    }

    insert(body) {
        let info = generateUserInfo(body);
        body.password = AuthenticationProvider.encrypt_oneDirection_lv1(body.password);
        return UserService.insert(
            body._service[0].dbname_prefix,
            body.username,
            body.title,
            body.account,
            body.password,
            info.language,
            info.isactive,
            body.department);
    }

    checkExist(body) {
        return UserService.checkExist(body._service[0].dbname_prefix, body.account);
    }

    update(body) {

        return UserService.update(body._service[0].dbname_prefix, body.username, body.id, body.title, body.isactive,body.role);

    }

    delete(body) {
        return UserService.delete(body._service[0].dbname_prefix, body.id, body.username);
    }

    pushRule(body) {
        return UserService.pushRule(body._service[0].dbname_prefix, body.username, body.id, body.rule);
    }

    removeRule(body) {
        return UserService.removeRule(body._service[0].dbname_prefix, body.username, body.id, body.rule);
    }





    loadDetails(body) {
        let dfd = q.defer();
        let dfdAr = [];
        dfdAr.push(UserService.loadDetails(body._service[0].dbname_prefix, body.account));
        // dfdAr.push(UserService.loadPerson(body.account));
        q.all(dfdAr).then(function (res) {
            // res[0].person = res[1]._id;
            dfd.resolve(res[0]);
            res = undefined;
            dfd = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    loadForDirective(body) {
        return UserService.loadForDirective(body._service[0].dbname_prefix, body.account);
    }

    loadmanyfordirective(body){
        return UserService.loadmanyfordirective(body._service[0].dbname_prefix, body.usernames);
    }

    updateAvatar(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, undefined, "/user", parentFolder, req.body.username).then(function (res) {
            UserService.updateAvatar(req.body._service[0].dbname_prefix, req.body.username,
                {
                    timePath: res.Files[0].timePath,
                    locate: res.Files[0].type,
                    display: res.Files[0].filename,
                    name: res.Files[0].named,
                    nameLib,
                }).then(function () {
                    dfd.resolve(true);
                    req = undefined;
                    err = undefined;
                }, function (err) {
                    dfd.reject(err);
                    req = undefined;
                    err = undefined;
                });
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            req = undefined;
        });
        return dfd.promise;
    }

    resetPassword(body) {
        return UserService.resetPassword(body._service[0].dbname_prefix, body.username, body.account);
    }

    resetPermission(body) {
        return UserService.resetPermission(body._service[0].dbname_prefix, body.username, body.account);
    }


    loadUserByRole(body) {
        let dfd = q.defer();
        let dfdAr = [];
        dfdAr.push(UserService.loadByRole(body._service[0].dbname_prefix, body.role));
        q.all(dfdAr).then(function (res) {
            dfd.resolve(res[0]);
            res = undefined;
            dfd = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    loadByDepartment(body) {
        let dfd = q.defer();
        let dfdAr = [];
        dfdAr.push(UserService.loadByDepartment(body._service[0].dbname_prefix, body.department));
        q.all(dfdAr).then(function (res) {
            dfd.resolve(res[0]);
            res = undefined;
            dfd = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    load_import_user_template(req) {
        const dfd = q.defer();
        const workbook = new ExcelJS.Workbook();

        FileProvider.downloadBuffer('templates/tep-tin-mau-them-nguoi-dung.xlsx').then(
            (res) => workbook.xlsx.load(res),
            dfd.reject,
        ).then(
            () => {

                return workbook.xlsx.writeBuffer();
            },
            dfd.reject,
        ).then(
            (res) => {
                dfd.resolve(res);
            },
            dfd.reject,
        );

        return dfd.promise;
    }

    update_FCM_token(body) {
        return UserService.update_FCM_token(body._service[0].dbname_prefix, body.username, body.token);
    }

}

exports.UserController = new UserController();