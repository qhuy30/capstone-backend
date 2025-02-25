const {GoogleInterface} = require('./google.interface');

class GoogleProvider{
    constructor(){}
    getUrl(){
        return GoogleInterface.urlGoogle();
    }

    getInfo(code){
        return GoogleInterface.getGoogleAccountFromCode(code);
    }
}

exports.GoogleProvider = new GoogleProvider();