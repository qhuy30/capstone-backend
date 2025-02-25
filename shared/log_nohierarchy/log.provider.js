const {LogInterface} = require('./log.interface');
class LogProvider{
    constructor(){
       
    }
    debug(details,path,type,service,parameter){
        LogInterface.debug({details,path,type,service,microservice:"primary",parameter});
    }

    verbose(details,path,type,service,parameter){
        LogInterface.verbose({details,path,type,service,microservice:"primary",parameter});
    }

    info(details,path,type,service,parameter){
        LogInterface.info({details,path,type,service,microservice:"primary",parameter});
    }

    warn(details,path,type,service,parameter){
        LogInterface.warn({details,path,type,service,microservice:"primary",parameter});
    }

    error(details,path,type,service,parameter){
        LogInterface.error({details,path,type,service,microservice:"primary",parameter});
    }

    silly(details,path,type,service,parameter){
        LogInterface.silly({details,path,type,service,microservice:"primary",parameter});
    }

    read(d,m,y){
        
    }
}

exports.LogProvider = new LogProvider();