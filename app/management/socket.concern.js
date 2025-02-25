const user = require('./user/socket');
module.exports = function(socket){
    user(socket);
}
