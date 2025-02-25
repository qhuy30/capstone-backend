const {google} = require('googleapis');
const GoogleConst = require('./passport.const').google;

class GoogleInterface{
    constructor(){}
    createConnection(){
        return new  google.auth.OAuth2(
            GoogleConst.installed.client_id,
            GoogleConst.installed.client_secret,
            GoogleConst.installed.redirect_uris);
    }

    getConnectionUrl(auth){
        return auth.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
            scope: GoogleConst.defaultScope
        });
    }
    getGooglePlusApi(auth) {
        return google.plus({ version: 'v1', auth });
    }

    /** Create the google url to be sent to the client.*/
    urlGoogle() {
        const auth = this.createConnection(); // this is from previous step
        const url = this.getConnectionUrl(auth);
        return url;
    }

    async getGoogleAccountFromCode(code) {
        const auth = this.createConnection();
        const data = await auth.getToken(code);
        const tokens = data.tokens;
      
        auth.setCredentials(tokens);
        const plus = this.getGooglePlusApi(auth);
        const me = await plus.people.get({ userId: 'me' });
        const userGoogleId = me.data.id;
        const userGoogleEmail = me.data.emails && me.data.emails.length && me.data.emails[0].value;
        return {
          id: userGoogleId,
          email: userGoogleEmail,
          tokens: tokens,
        };
    }
}

exports.GoogleInterface = new GoogleInterface();