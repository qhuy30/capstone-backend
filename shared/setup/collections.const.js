
class CollectionSetup{
    constructor(){}
    getOfficeCollections(){
        return require('./collections/office/concern');
    }
    getManagementCollections(){
        return require('./collections/management/concern');
    }
    getBasicCollections(){
        return require('./collections/basic/concern');
    }
    getEducationCollections(){
        return require('./collections/education/concern');
    }
}
exports.CollectionSetup = new CollectionSetup();