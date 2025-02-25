'use strict';
var cluster = require("./shared/cluster").controller;
if (cluster.cluster.isMaster) {
    const numCPUs = require('os').cpus().length;
    
    for (let i = 0; i < numCPUs; i++) {
        cluster.cluster.fork();
    }
    cluster.cluster.on('exit', function(worker, code, signal) {
        cluster.cluster.fork();
    });
}else{
    require("./server");
}
