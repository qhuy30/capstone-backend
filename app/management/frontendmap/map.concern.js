const maps= require('../mapConcern');

module.exports =(function(){
    var tenantMap=[];
    for (let i in maps){
        for (let j in maps[i]){
            tenantMap.push(maps[i][j]);
        }
    }
    return tenantMap;
})()