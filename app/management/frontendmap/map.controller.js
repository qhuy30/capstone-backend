
const managementMap = require('./../mapConcern');
const officeMap = require('./../../office/mapConcern');
const basicMap = require('./../../basic/mapConcern');
const studyPlanMap = require('./../../education/mapConcern');
const utilitiesToolsMap = require('./../../utilities_tools/mapConcern');
function getAllMap() {
    let maps = [];
    for (var i in managementMap) {
        for (var j in managementMap[i]) {
            maps.push(managementMap[i][j]);
        }
    }
    for (var i in officeMap) {
        for (var j in officeMap[i]) {
            maps.push(officeMap[i][j]);
        }
    }
    for (var i in basicMap) {
        for (var j in basicMap[i]) {
            maps.push(basicMap[i][j]);
        }
    }
    for (var i in studyPlanMap) {
        for (var j in studyPlanMap[i]) {
            maps.push(studyPlanMap[i][j]);
        }
    }
    for (var i in utilitiesToolsMap) {
        for (var j in utilitiesToolsMap[i]) {
            maps.push(utilitiesToolsMap[i][j]);
        }
    }
    return maps;
}

class MapController {
    constructor() { }
    all() {
        return {
            status: true, data: JSON.parse(JSON.stringify(getAllMap()))
        };
    }

    public() {
        let publicMap = [];
        let allMap = JSON.parse(JSON.stringify(getAllMap()));
        for (let i in allMap) {
            if (allMap[i].rule === null
                || (allMap[i].rule && allMap[i].rule.length == 0)) {
                publicMap.push(allMap[i]);
            }
        }

        return {
            status: true, data: publicMap
        };;
    }

    private(rules) {
        let privateMap = [];
        let allMap = JSON.parse(JSON.stringify(getAllMap()));

        for (let i in allMap) {
            if (allMap[i].rule &&
                allMap[i].rule.length > 0
            ) {
                for (var j in allMap[i].rule) {
                    if (rules.indexOf(allMap[i].rule[j]) != -1) {
                        privateMap.push(allMap[i]);
                        break;
                    }
                }
            }
        }
        return {
            status: true, data: privateMap
        };
    }

    checkExistKey(key) {
        for (var i in managementMap) {
            for(var j in managementMap[i]){
                if (managementMap[i][j].key === key) { return true; }
            }

        }
        for (var i in officeMap) {
            for(var j in officeMap[i]){
                if (officeMap[i][j].key === key) { return true; }
            }

        }
        for (var i in basicMap) {
            for(var j in basicMap[i]){
                if (basicMap[i][j].key === key) { return true; }
            }

        }

        for (var i in studyPlanMap) {
            for (var j in studyPlanMap[i]) {
                if (studyPlanMap[i][j].key === key) { return true; }
            }
        }

        for (var i in utilitiesToolsMap) {
            for(var j in utilitiesToolsMap[i]){
                if (utilitiesToolsMap[i][j].key === key) { return true; }
            }
        }
        return false;
    }

}

exports.MapController = new MapController();
