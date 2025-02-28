const Q = require("q");

const { LabelService } = require("./service");
const { BuildFilterAggregate } = require("./utility");
const { checkRuleCheckBox } = require("@utils/ruleUtils");

const LABEL_INSERT_PARENT_LABEL = "Office.Task.Management_MajorLabels_Department";
const LABEL_INSERT_CHILD_LABEL = "Office.Task.Management_MinorLabels_Department";

function checkInsertPermission(session) {
    return {
        parent: {
            check: checkRuleCheckBox(LABEL_INSERT_PARENT_LABEL, session),
            department: []
        },
        // child: checkDetailPermission(session, LABEL_INSERT_CHILD_LABEL),
    };
}

function checkDetailPermission(session, checkRule) {
    const result = {
        check: false,
        department: [],
    };
    const rules = session.rule.filter((ele) => ele.rule === checkRule);
    for (const rule of rules) {
        switch (rule.details.type) {
            case "All":
                result.check = true;
                result.department = [];
                break;

            case "Working":
                result.check = true;
                result.department = [session.department];
                break;

            case "Specific":
                result.check = true;
                result.department = rule.details.department;
                break;
        }
    }
    return result;
}

class LabelController {
    load(dbPrefix, currentUser, body) {
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_load([], queryCriteria);

        return LabelService.loadAll(dbPrefix, filter);
    }

    loadMultiple(dbPrefix, currentUser, body) {
        return LabelService.loadByIds(dbPrefix, currentUser.username, body.ids);
    }

    loadDetail(dbPrefix, currentUser, body) {
        return LabelService.loadDetailById(dbPrefix, currentUser.username, body.id);
    }

    insert(dbPrefix, currentUser, body) {
        const checkPermissionResult = checkInsertPermission(currentUser);
        return LabelService.insert(dbPrefix, checkPermissionResult, currentUser.username, body);
    }

    update(dbPrefix, currentUser, body) {
        const checkPermissionResult = checkInsertPermission(currentUser);
        return LabelService.update(dbPrefix, checkPermissionResult, currentUser.username, body);
    }
}

exports.LabelController = new LabelController();
