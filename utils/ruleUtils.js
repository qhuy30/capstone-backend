function checkRuleRadioDepartment (ruleSet, departmentItem, departmentUser, ruleToCheck) {
    const ruleDetails = ruleSet.filter(e => e.rule === ruleToCheck)[0];
    if (ruleDetails) {
        if (ruleDetails && ruleDetails.details) {
            switch (ruleDetails.details.type) {
                case "All":
                    return true;
                case "Working":
                    return departmentItem === departmentUser;
                case "Specific":
                    return ruleDetails.details.department.indexOf(departmentItem) !== -1;
            }
        }
    }
    return false;
}

function checkRuleCheckBox (_rule, user) {
    return user.rule.some(e => e.rule === _rule);
}

function deepEqual(value1, value2) {
    if (value1 === value2) return true; // Same reference or primitive type

    if (typeof value1 !== typeof value2) return false; // Different types

    if (Array.isArray(value1) && Array.isArray(value2)) {
        if (value1.length !== value2.length) return false;

        return value1.every((item, index) => deepEqual(item, value2[index]));
    }

    if (typeof value1 === 'object' && typeof value2 === 'object' && value2!==null&& value1!==null) {
        const keys1 = Object.keys(value1);
        const keys2 = Object.keys(value2);

        if (keys1.length !== keys2.length) return false;

        return keys1.every(key => deepEqual(value1[key], value2[key]));
    }

    return false;
}

function deepClone(obj) {
    try{
        return JSON.parse(JSON.stringify(obj));
    }catch(e){
        return null;
    }
}

function getObjectDifferences(obj1, obj2) {
    const diff = {};

    for (let key in obj1) {
        if (obj1.hasOwnProperty(key)) {
            if (!deepEqual(obj1[key], obj2[key])) {
                diff[key] = {
                    old: obj2[key],
                    new: obj1[key]
                };
            }
        }
    }

    return diff;
}

module.exports = {
    checkRuleRadioDepartment,
    checkRuleCheckBox,
    getObjectDifferences,
    deepClone
};
