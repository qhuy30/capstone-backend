
const trycatch = require('trycatch');
const q = require('q');
const {ItemSetup} =require('../../../shared/setup/items.const');
class RuleController {
    constructor() { }
    load() {
        let dfd = q.defer();
        trycatch(function () {
            let Items = ItemSetup.getItems("management","rule");
            dfd.resolve(Items);
            Items = undefined;
        }, function (err) {
            dfd.reject({ path: "RuleController.load.trycatch", err: err.stack });
            err = undefined;
        });
        return dfd.promise;
    }
  
}

exports.RuleController = new RuleController(); 