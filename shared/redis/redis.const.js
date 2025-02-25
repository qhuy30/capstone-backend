const settings = require('../../utils/setting');
const {
    REDIS_PASSWORD,
    REDIS_PORT,
    REDIS_HOST,
    REDIS_PREFIX_SESSION,
    REDIS_PREFIX_ROOM,
    REDIS_PREFIX_SOCKET

} = process.env;
var obj ={
    password: REDIS_PASSWORD,
    port: REDIS_PORT,
    host: REDIS_HOST,
    prefixSession: REDIS_PREFIX_SESSION,
    prefixRoom: REDIS_PREFIX_ROOM,
    prefixSocket: REDIS_PREFIX_SOCKET,
    timeSession : 24*60*60,
    timeCache : 24*60*60
};

module.exports = obj;