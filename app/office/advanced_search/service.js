const q = require("q");
const mongodb = require("mongodb");

const BaseError = require('../../../shared/error/BaseError');

const CommonUtils = require("@utils/util");

const { MongoDBProvider } = require("../../../shared/mongodb/db.provider");




class AdvancedSearchService {
    constructor() {}

    loadAggregate(db_prefix, obj, filter){
        return MongoDBProvider.loadAggregate_onOffice(db_prefix, obj, filter);
    }
}

class TaskService {
    constructor() {}

    loadAggregate(db_prefix, filter){
        return MongoDBProvider.loadAggregate_onOffice(db_prefix, 'task', filter);
    }

    load_by_code(db_prefix, code){
        return MongoDBProvider.load_onOffice(db_prefix, 'task', {
            code: { $eq: code },
        });
    }
}

class DAService {
    constructor() {}

    loadAggregate(db_prefix, filter){
        return MongoDBProvider.loadAggregate_onOffice(db_prefix, 'dispatch_arrived', filter);
    }

    load_by_code(db_prefix, symbol_number){
        return MongoDBProvider.load_onOffice(db_prefix, 'dispatch_arrived', {
            symbol_number: { $eq: symbol_number },
        });
    }
}

class ODBService {
    constructor() {}

    loadAggregate(db_prefix, filter){
        return MongoDBProvider.loadAggregate_onOffice(db_prefix, 'outgoing_dispatch', filter);
    }

    load_by_code(db_prefix, symbol_number){
        return MongoDBProvider.load_onOffice(db_prefix, 'outgoing_dispatch', {
            symbol_number: { $eq: symbol_number },
        });
    }
}

class WFPService {
    constructor() {}

    loadAggregate(db_prefix, filter){
        return MongoDBProvider.loadAggregate_onOffice(db_prefix, 'workflow_play', filter);
    }

    load_by_code(db_prefix, code){
        return MongoDBProvider.load_onOffice(db_prefix, 'workflow_play', {
            code: { $eq: code },
        });
    }
}

class BriefcaseService {
    constructor() {}

    loadAggregate(db_prefix, filter){
        return MongoDBProvider.loadAggregate_onOffice(db_prefix, 'briefcase', filter);
    }

    load_by_code(db_prefix, code){
        return MongoDBProvider.load_onOffice(db_prefix, 'briefcase', {
            code: { $eq: code },
        });
    }
}



exports.AdvancedSearchService = new AdvancedSearchService();
exports.TaskService = new TaskService();
exports.DAService = new DAService();
exports.ODBService = new ODBService();
exports.WFPService = new WFPService();
exports.BriefcaseService = new BriefcaseService();

