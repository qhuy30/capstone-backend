const q = require('q');
const { bucketGoogleCloud } = require('./config');

class gcpProvider {
    constructor() {}

    /**
     * 
     * @param {*} fileName 
     * @param {*} expiration default 1 min
     * @returns this url will expire with expiration * 10 min
     */
    getSignedUrl(fileName, expiration = 60, config = {}) {
        let dfd = q.defer();
        const bucket = bucketGoogleCloud.createBucket();
        const file = bucket.file(fileName);
        // This url will expire in 10 minutes
        const expiresAt = new Date(Date.now() + 10 * expiration * 1000);
        file.exists().then((data) => {
            const exists = data[0];
            if (exists) {
                file.getSignedUrl({
                    version: 'v4',
                    action: 'read',
                    expires: expiresAt,
                    ...config
                }).then(
                    (res) => {
                        dfd.resolve(res[0]);
                        res = undefined;
                        data = undefined;
                    },
                    (err) => {
                        dfd.reject(err);
                        err = undefined;
                        data = undefined;
                    }
                );
            } else {
                dfd.reject('');
            }
        },
        (err) => {
            dfd.reject(err);
            err = undefined;
        })
        
        return dfd.promise;
    }

    /**
     * 
     * @param {*} fileName 
     */
    makeFilePublic (fileName) {                   
        let dfd = q.defer();        
        const bucket = bucketGoogleCloud.createBucket();
        const file = bucket.file(fileName);                      
        file.exists().then((data) => {                     
            const exists = data[0];               
            if (exists) {     
                file.makePublic()
                .then(
                    ([res]) => {                        
                        const publicUrl = `https://storage.googleapis.com/${res.bucket}/${res.object}`;
                        dfd.resolve(publicUrl);
                        res = undefined;
                        data = undefined;
                    },
                    (err) => {
                        console.log(err);
                        dfd.reject(err);
                        err = undefined;
                        data = undefined;
                    }
                );                                               
            } else {
                dfd.reject('');
            }
        },
        (err) => {
            dfd.reject(err);
            err = undefined;
        })      
        return dfd.promise;
    }

    /**
     * 
     * @param {*} fileName 
     * @returns 
     */
    makeFilePrivate (fileName) {                         
        let dfd = q.defer();        
        const bucket = bucketGoogleCloud.createBucket();
        const file = bucket.file(fileName);                      
        file.exists().then((data) => {                     
            const exists = data[0];               
            if (exists) {     
                file.makePrivate()
                .then(
                    ([res]) => {                                               
                        dfd.resolve(res);
                        res = undefined;
                        data = undefined;
                    },
                    (err) => {                        
                        dfd.reject(err);
                        err = undefined;
                        data = undefined;
                    }
                );                                               
            } else {
                dfd.reject('');
            }
        },
        (err) => {
            dfd.reject(err);
            err = undefined;
        })      
        return dfd.promise;
    }
}

exports.gcpProvider = new gcpProvider();
