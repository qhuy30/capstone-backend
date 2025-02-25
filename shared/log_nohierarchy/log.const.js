exports.LogConst = {
    path:"../logs-tenant/",
    levels:{ error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 },
    colors: {
        error: 'red',
        debug: 'blue',
        warn: 'yellow',
        info: 'green',
        verbose: 'cyan',
        silly: 'magenta'
    },
    isjson :{
        console:false,
        file:true
    }
};