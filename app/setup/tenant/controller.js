const BasicIndex = require("../../basic/indexConcern");
const ManagementIndex = require("../../management/indexConcern");
const OfficeIndex = require("../../office/indexConcern");

const {CollectionSetup} = require("../../../shared/setup/collections.const");
const {ItemSetup} = require("../../../shared/setup/items.const");

const q = require('q');
class TenantController {
    constructor() { }

    loadIndex(body) {
        let dfd = q.defer();
        switch (body.key) {
            case "basic":
                dfd.resolve(BasicIndex);
                break;
            case "management":
                dfd.resolve(ManagementIndex);
                break;
            case "office":
                dfd.resolve(OfficeIndex);
                break;
        }
        return dfd.promise;
    }

    loadCollection(body) {
        let dfd = q.defer();
        switch (body.key) {
            case "basic":
                dfd.resolve(CollectionSetup.getBasicCollections());
                break;
            case "management":
                dfd.resolve(CollectionSetup.getManagementCollections());
                break;
            case "office":
                dfd.resolve(CollectionSetup.getOfficeCollections());
                break;
        }
        return dfd.promise;
    }

    loadItem(body) {
        let dfd = q.defer();
        switch (body.key) {
            case "basic":
            case "management":
            case "office":
                dfd.resolve(ItemSetup.allItems(body.key));
                break;
        }
        return dfd.promise;
    }

    loadItemByCollection(body) {
        let dfd = q.defer();
        switch (body.key) {
            case "basic":
            case "management":
            case "office":
                dfd.resolve(ItemSetup.getItems(body.key,body.collection));
                break;
        }
        return dfd.promise;
    }


}

exports.TenantController = new TenantController();  