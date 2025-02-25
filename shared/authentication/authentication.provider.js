const { LogProvider } = require('../log_nohierarchy/log.provider');
const jwt = require('jsonwebtoken');
const trycatch = require('trycatch');
const crypto = require('crypto-js');
const q = require('q');
const { messageHTTP, statusHTTP } = require('../../utils/setting');
const { secretkey, JWTOptions } = require('./authentication.const');
const { ConfigSetup } = require('../setup/config.const');

class AuthenticationProvider {
    constructor() { }
    encrypt_lv1(input) {
        return crypto.AES.encrypt(JSON.stringify(input), secretkey).toString();
    }

    decrypt_lv1(input) {
        return JSON.parse(crypto.AES.decrypt(input, secretkey).toString(crypto.enc.Utf8));
    }

    encrypt_oneDirection_lv1(input) {
        return crypto.SHA256(input).toString();
    }


    verify(req, res) {
       
        let result;
        if (req.headers &&
            req.headers.authorization &&
            req.headers.authorization.split(' ')[0] === 'DTTOKEN') {

            let jwtToken = req.headers.authorization.split(' ')[1];
            let secret = JWTOptions.jwtSecret;

            jwt.verify(jwtToken, secret, function (err, payload) {

                if (err) {
                    result = {
                        status: false,
                        err: { path: "AuthenticationProvider.verify_onManagement.authorizationisinvalid", err: 'Unauthorized!' }
                    };
                    err = undefined;
                    payload = undefined;
                    jwtToken = undefined;
                } else {
                    let obj = new AuthenticationProvider();
                    let data = obj.decrypt_lv1(payload.data);
                    req.body = req.body || {};
                    req.body.username = data.username;
                    err = undefined;
                    data = undefined;
                    payload = undefined;
                    jwtToken = undefined;
                    obj = undefined;
                    result = {
                        status: true,
                        req
                    };

                }
            });
            secret = undefined;
        } else {
            result = {
                status: false,
                err: { path: "AuthenticationProvider.verify_onManagement.authorizationisundefined", err: 'Unauthorized!' }
            };
        }


        return result;
    }

    generateInformation(req) {
        let dfd = q.defer();
        if (req.headers &&
            req.headers.authorization &&
            req.headers.authorization.split(' ')[0] === 'DTTOKEN') {

            let jwtToken = req.headers.authorization.split(' ')[1];
            let secret = JWTOptions.jwtSecret;
      
            jwt.verify(jwtToken, secret, function (err, payload) {

                if (err) {
                    dfd.reject({
                        path: "AuthenticationProvider.generateInformation_onManagement.Unauthorized",
                        err: "Unauthorized"
                    });

                } else {
                    let obj = new AuthenticationProvider();
                    let data = obj.decrypt_lv1(payload.data);
                    req.body = req.body || {};
                    req.body.username = data.username;
                    data = undefined;
                    obj = undefined;
                    dfd.resolve(req);
                }
                err = undefined;
                payload = undefined;
                jwtToken = undefined;
                secret = undefined;
                req = undefined;
            });
        } else {
            dfd.reject({
                path: "AuthenticationProvider.generateInformation_onManagement.TokenIsNull",
                err: "TokenIsNull"
            });
            req = undefined;
        }
        return dfd.promise;
    }


}

exports.AuthenticationProvider = new AuthenticationProvider();