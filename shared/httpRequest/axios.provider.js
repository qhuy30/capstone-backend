const { AxiosInterface } = require('./axios.interface');
const q = require('q');
class AxiosProvider {
    constructor() { }

    post(url, body, options) {
        let dfd = q.defer();
        AxiosInterface.post(url, body, options).then(function (res) {
            dfd.resolve(res);
        }).catch(function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    get(url, options) {
        let dfd = q.defer();
        AxiosInterface.get(url, options).then(function (res) {
            dfd.resolve(res);
        }).catch(function (err) {
            dfd.reject(err);
        });
        return dfd.promise;;
    }

    put(url, body, options) {
        let dfd = q.defer();
        AxiosInterface.put(url, body, options).then(function (res) {
            dfd.resolve(res);
        }).catch(function (err) {
            dfd.reject(err);
        });
        return dfd.promise;;
    }

    delete(url, body, options) {
        let dfd = q.defer();
        AxiosInterface.delete(url, body, options).then(function (res) {
            dfd.resolve(res);
        }).catch(function (err) {
            dfd.reject(err);
        });
        return dfd.promise;;
    }
}
exports.AxiosProvider = new AxiosProvider();