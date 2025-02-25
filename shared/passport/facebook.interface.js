
const  FacebookStrategy = require('passport-facebook').Strategy;
const FacebookConst = require('./passport.const');

class FacebookInterface{
    constructor(){}
    set(passport,callback){
        passport.use(new FacebookStrategy({
            clientID: FacebookConst.facebookAuth.clientID,
            clientSecret: FacebookConst.facebookAuth.clientSecret,
            callbackURL: FacebookConst.facebookAuth.callbackURL
          },
          function(accessToken, refreshToken, profile,cb) {
            callback(accessToken, refreshToken, profile);
            cb(null,profile);
            
          }
        ));
        passport.serializeUser(function(user, done) {
          done(null, user);
        });
        
        passport.deserializeUser(function(user, done) {
          done(null, user);
        });
    }
}
exports.FacebookInterface = new FacebookInterface();