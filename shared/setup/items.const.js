
const setupItems = {
    management : require('./items/management/concern'),
    office: require('./items/office/concern'),
    basic: require('./items/basic/concern')
};

class ItemSetup{
    constructor(){}
    allItems(side){
        return setupItems[side];
    }

    getItems(side,nameCollection){
        for (var i in setupItems[side]){
            if (setupItems[side][i].name == nameCollection){
                return setupItems[side][i].items;
            }
        }
        return [];
    }
}
exports.ItemSetup =  new ItemSetup();